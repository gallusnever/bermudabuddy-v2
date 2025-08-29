import json
import logging
import os
from datetime import datetime

from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any, Iterator
from datetime import timedelta

from pydantic import BaseModel
from pydantic import Field
from pydantic import ConfigDict
from sqlmodel import Session, select
from sqlalchemy import text as sa_text
from apps.api.db import engine
from apps.api.models import Property as DBProperty, Polygon as DBPolygon, Label as DBLabel

from apps.api.providers.openmeteo import OpenMeteoProvider
from apps.api.services.ok_to_spray import ok_to_spray_hour
from apps.api.services.station_select import select_nearest_station_safe
from apps.api.providers.nws import NWSProvider, MissingNWSUserAgent
from apps.api.services.mix_math import calc_mix
from apps.api.services.labels import epa_ppls_pdf_url, load_label_recipes, search_recipes, filter_rates_for_product
import httpx


APP_NAME = "Bermuda Buddy API"
APP_VERSION = os.getenv("APP_VERSION", "0.1.0")
START_TIME = datetime.utcnow()


def setup_logging() -> None:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        fmt='{"time":"%(asctime)s","level":"%(levelname)s","msg":%(message)s}',
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )
    handler.setFormatter(formatter)
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.handlers.clear()
    root.addHandler(handler)


setup_logging()
log = logging.getLogger(__name__)

app = FastAPI(title=APP_NAME, version=APP_VERSION)

# CORS configuration - reads from environment or uses defaults
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    # Parse comma-separated origins from environment
    allow_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    # Default for local development
    allow_origins = [
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:3001", "http://127.0.0.1:3001",
        "http://localhost:3100", "http://127.0.0.1:3100",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict:
    nws_agent = os.getenv("NWS_USER_AGENT")
    status = {
        "status": "ok",
        "name": APP_NAME,
        "version": APP_VERSION,
        "time": datetime.utcnow().isoformat() + "Z",
        "nws_user_agent_present": bool(nws_agent),
    }
    log.info(json.dumps({"event": "healthz", "status": status["status"]}))
    return status


@app.get("/metrics")
def metrics() -> JSONResponse:
    now = datetime.utcnow()
    uptime = (now - START_TIME).total_seconds()
    payload = {"app": APP_NAME, "version": APP_VERSION, "uptime_sec": int(uptime)}
    return JSONResponse(payload)


# --- Nickname generation ---

class NicknameRequest(BaseModel):
    # Accept camelCase keys from the web client
    model_config = ConfigDict(populate_by_name=True)

    first_name: str = Field(alias="firstName")
    state: str
    grass_type: Optional[str] = Field(default=None, alias="grassType")
    mower: Optional[str] = None
    hoc: Optional[float] = None
    sprayer: Optional[str] = None
    city: Optional[str] = None
    monthly_budget: Optional[int] = Field(default=None, alias="monthlyBudget")
    issues: Optional[List[str]] = None


def _fallback_nickname(req: NicknameRequest) -> str:
    insults = [
        "CantStripe",
        "ScalpsDaily",
        "BrownSpots",
        "WeedPatch",
        "FungusAmongUs",
        "YellowLawn",
        "NeverSprays",
        "DullBlades",
        "PatchyGrass",
        "CrabgrassKing",
    ]
    hoc_insults = {
        "high": ["CutsTooHigh", "TwoInchTerror", "TallGrass"],
        "low": ["ScalpMaster", "DirtShower", "BaldSpots"],
    }

    cat = ""
    if req.hoc is not None:
        if req.hoc > 1.5:
            cat = "high"
        elif req.hoc < 0.5:
            cat = "low"
    import random
    if cat:
        options = hoc_insults[cat]
        suffix = random.choice(options)
    else:
        suffix = random.choice(insults)
    return f"{req.first_name}{suffix}"


@app.post("/api/nickname")
async def api_generate_nickname(payload: NicknameRequest) -> Dict[str, str]:
    log.info(f"[Nickname] Request received for {payload.first_name} from {payload.state}")
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        log.warning("[Nickname] No OPENROUTER_API_KEY in environment!")
        # No key in env; return deterministic fallback
        return {"nickname": _fallback_nickname(payload)}

    sys_prompt = (
        "You are Bud, a no-nonsense lawn care expert with dry dad humor like Hank Hill. "
        "Give people slightly insulting but funny lawn nicknames.\n\n"
        "Create a nickname that's:\n"
        "- Mildly insulting but in good fun (like buddies giving each other crap)\n"
        "- Based on their actual flaws or quirks\n"
        "- 2-4 words, readable as one username (no spaces)\n"
        "- Something Hank Hill would say while shaking his head\n\n"
        "Good examples:\n"
        "- 'FungusFrank' (for someone with lawn disease)\n"
        "- 'ScalpinSally' (cuts too low)\n"
        "- 'TwoInchTom' (cuts way too high)\n"
        "- 'CrabgrassCarl' (has weed problems)\n"
        "- 'BrownPatchBob' (fungus issues)\n"
        "- 'DollarSpotDave' (more fungus)\n"
        "- 'WeedyWilson' (doesn't spray)\n"
        "- 'PatchyPete' (uneven lawn)\n"
        "- 'YellowYardYale' (nitrogen deficient)\n\n"
        "Return ONLY the nickname as one word (camelCase or concatenated), nothing else."
    )
    user_prompt = (
        f"Create a funny lawn nickname for:\n"
        f"Name: {payload.first_name}\n"
        f"Location: {payload.city + ', ' if payload.city else ''}{payload.state}\n"
        f"{('Grass: ' + payload.grass_type + '\n') if payload.grass_type else ''}"
        f"{('Mower: ' + payload.mower + '\n') if payload.mower else ''}"
        f"{('Height of Cut: ' + str(payload.hoc) + '"\n') if payload.hoc is not None else ''}"
        f"{('Has sprayer: ' + payload.sprayer + '\n') if payload.sprayer else 'No sprayer\n'}"
        f"{('Budget: $' + str(payload.monthly_budget) + '/month\n') if payload.monthly_budget is not None else ''}"
        f"{('Current lawn problems: ' + ', '.join(payload.issues) + '\n') if payload.issues else 'No issues reported (yeah right)\n'}\n"
        "PRIORITIZE THEIR ISSUES for the nickname! For example:\n"
        "- If they have fungus issues, make fun of that (FungusFrank)\n"
        "- If they have weeds, roast them for that (CrabgrassCarl)\n"
        "- If HOC is over 1.5\", call them out (TwoInchTom)\n"
        "- If HOC is under 0.5\", they're a scalper (ScalpinSam)\n"
        "- Multiple issues? Pick the worst one to mock"
    )

    body = {
        "model": "openai/gpt-3.5-turbo",  # Changed to a standard model
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.8,
        "max_tokens": 50,
    }

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("OPENROUTER_HTTP_REFERER", "https://bermudabuddy-v2.onrender.com"),
        "X-Title": os.getenv("OPENROUTER_TITLE", "Bud Nickname Generator"),
    }

    try:
        log.info(f"[Nickname] Calling OpenRouter with model: openai/gpt-3.5-turbo")
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post("https://openrouter.ai/api/v1/chat/completions", json=body, headers=headers)
            log.info(f"[Nickname] OpenRouter status: {resp.status_code}")
            resp.raise_for_status()
            data = resp.json()
            content = (
                data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
                .strip()
            )
            log.info(f"[Nickname] OpenRouter raw response: {content}")
            nickname = "".join(ch for ch in content if ch.isalnum())[:30]
            log.info(f"[Nickname] Filtered nickname: {nickname}")
            if not nickname:
                log.warning(f"[Nickname] Empty nickname after filtering, using fallback")
                nickname = _fallback_nickname(payload)
            return {"nickname": nickname}
    except httpx.HTTPStatusError as e:
        log.error(f"[Nickname] OpenRouter HTTP error {e.response.status_code}: {e.response.text}")
        return {"nickname": _fallback_nickname(payload)}
    except Exception as e:
        log.error(f"[Nickname] Unexpected error: {type(e).__name__}: {str(e)}")
        return {"nickname": _fallback_nickname(payload)}


# --- AI: Program generation & analysis ---

class ProgramRequest(BaseModel):
    data: Dict[str, Any]


def _fallback_program(data: Dict[str, Any]) -> Dict[str, Any]:
    equip = data.get("equipment", {})
    status = data.get("status", {})
    has_sprayer = equip.get("sprayer") and equip.get("sprayer") != "none"
    budget = int(equip.get("monthlyBudget") or 50)
    area = int((data.get("location") or {}).get("area") or 5000)
    hoc = equip.get("hoc") or 1.0
    issues = status.get("issues") or []

    products: List[Dict[str, Any]] = []
    immediate: List[str] = []
    this_week: List[str] = []
    monthly: List[str] = []

    if not equip.get("soilTestDone"):
        immediate.append("Get soil test from county extension office ($15-25)")
    if "weeds-pre" in issues:
        immediate.append("Apply pre-emergent immediately (window may be closing)")
        products.append({
            "name": "Prodiamine 65 WDG" if has_sprayer else "Scotts Halts",
            "source": "DoMyOwn.com" if has_sprayer else "Lowe's",
            "purpose": "Pre-emergent herbicide",
            "rate": "0.37 oz/1000 ft²" if has_sprayer else "Per bag instructions",
            "frequency": "Split app - now and 8 weeks",
            "cost": "$65/5lb bag" if has_sprayer else "$45/bag",
        })
    if "disease" in issues:
        immediate.append("Apply fungicide ASAP - rotate active ingredients")
        products.append({
            "name": "Propiconazole 14.3" if has_sprayer else "Scotts DiseaseEx",
            "source": "DoMyOwn.com" if has_sprayer else "Home Depot",
            "purpose": "Fungicide",
            "rate": "2 oz/1000 ft²" if has_sprayer else "Per bag instructions",
            "frequency": "Every 14-21 days while active",
            "cost": "$35/pint" if has_sprayer else "$20/bag",
        })

    if budget >= 300 and has_sprayer:
        products += [
            {"name": "Primo Maxx or T-Nex", "source": "SiteOne or DoMyOwn", "purpose": "Growth regulator", "rate": "0.175 oz/1000 ft²", "frequency": "Every 200 GDD", "cost": "$120/quart"},
            {"name": "Feature 6-0-0 + Iron", "source": "SiteOne", "purpose": "Foliar nitrogen + iron", "rate": "3-6 oz/1000 ft²", "frequency": "Weekly in season", "cost": "$45/gallon"},
            {"name": "Humic DG", "source": "SiteOne", "purpose": "Soil amendment", "rate": "3 lbs/1000 ft²", "frequency": "Monthly", "cost": "$30/40lb bag"},
        ]
        monthly += [
            "Weekly foliar feeding (0.1-0.2 lb N/M)",
            "PGR application every 200 GDD",
            "Preventive fungicide rotation",
            "Micronutrient application",
        ]
    elif budget >= 100:
        products += [
            {"name": "Urea 46-0-0" if has_sprayer else "Scotts Turf Builder", "source": "SiteOne" if has_sprayer else "Lowe's", "purpose": "Nitrogen fertilizer", "rate": "0.5 lb N/1000 ft²" if has_sprayer else "Per bag instructions", "frequency": "Monthly in growing season", "cost": "$25/50lb" if has_sprayer else "$45/bag"},
            {"name": "Milorganite", "source": "Home Depot", "purpose": "Organic fertilizer", "rate": "16 lbs/1000 ft²", "frequency": "Every 6-8 weeks", "cost": "$15/32lb bag"},
        ]
        monthly += [
            "Fertilize every 4-6 weeks (0.5-1 lb N/M)",
            "Spot spray weeds as needed",
            "Monitor for disease/insects",
        ]
    else:
        products += [
            {"name": "Generic 16-4-8 fertilizer", "source": "Lowe's", "purpose": "Complete fertilizer", "rate": "Per bag instructions", "frequency": "Every 6-8 weeks", "cost": "$20/bag"},
        ]
        monthly += [
            "Fertilize every 6-8 weeks",
            "Hand pull weeds",
            "Mow weekly at proper height",
        ]

    this_week += [
        f"Set mowing height to {hoc}\"",
        "Edge and trim for clean lines",
        "Check irrigation coverage",
    ]

    # very simple region schedule
    schedule = {
        "January": ["Dormant - minimal activity", "Plan for the year"],
        "February": ["Pre-emergent window opens", "Soil test"],
        "March": ["Pre-emergent", "Begin green-up"],
        "April": ["Spring green-up", "Begin fertilization", "Start PGR if applicable"],
        "May": ["Full growing season", "Weekly mowing", "Regular fertilization"],
        "June": ["Peak growth", "Maintain PGR schedule", "Watch for disease"],
        "July": ["Summer stress management", "Deep watering", "Monitor for insects"],
        "August": ["Continue summer program", "Prepare for fall push", "Consider aeration"],
        "September": ["Fall fertilization push", "Pre-emergent round 2"],
        "October": ["Reduce nitrogen", "Prepare for dormancy"],
        "November": ["Final fertilization", "Dormancy prep"],
        "December": ["Dormant season", "Equipment maintenance"],
    }

    return {
        "immediate": immediate,
        "thisWeek": this_week,
        "monthly": monthly,
        "products": products,
        "schedule": schedule,
    }


@app.post("/api/program")
async def api_program(req: ProgramRequest) -> Dict[str, Any]:
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        return _fallback_program(req.data)
    try:
        body = {
            "model": "openai/gpt-oss-120b",
            "messages": [
                {"role": "system", "content": "You are Bud, creating a personalized lawn care program. Be specific and practical. Output a JSON with keys: immediate[], thisWeek[], monthly[], products[], schedule{month:[..]}."},
                {"role": "user", "content": f"Create a detailed lawn program. INPUT JSON:\n{req.data}"},
            ],
            "temperature": 0.4,
            "max_tokens": 1200,
        }
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("OPENROUTER_HTTP_REFERER", "https://bermudabuddy-v2.onrender.com"),
            "X-Title": os.getenv("OPENROUTER_TITLE", "Bud Program Generator"),
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post("https://openrouter.ai/api/v1/chat/completions", json=body, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            # attempt to parse JSON substring
            import re, json as pyjson
            m = re.search(r"\{[\s\S]*\}", content)
            if m:
                return pyjson.loads(m.group(0))
    except Exception as e:
        log.warning(json.dumps({"event": "program_error", "error": str(e)}))
    return _fallback_program(req.data)


class AnalysisRequest(BaseModel):
    data: Dict[str, Any]


@app.post("/api/ai/analyze")
async def api_analyze(req: AnalysisRequest) -> Dict[str, Any]:
    d = req.data
    issues = (d.get("issues") or [])
    active = [i for i in issues if (i.get("status") != "resolved")]
    overall = "poor" if len(issues) > 3 else ("fair" if len(issues) > 1 else ("good" if len(issues) > 0 else "excellent"))
    key_metrics = [
        f"Grass Type: {(d.get('equipment') or {}).get('grassType') or 'Bermuda'}",
        f"Area: {((d.get('location') or {}).get('area') or 'Unknown')} ft²",
        f"HOC: {(d.get('equipment') or {}).get('hoc') or 'Unknown'}\"",
    ]
    recs: List[str] = []
    if any(i.get("type") == "weeds-pre" for i in active):
        recs.append("Apply pre-emergent now; split application in 8 weeks")
    if any(i.get("type") == "disease" for i in active):
        recs.append("Begin fungicide rotation; avoid back-to-back same AI")
    if not recs:
        recs.append("Mow 2-3x/week during peak growth; sharpen blades")
    return {"overallHealth": overall, "keyMetrics": key_metrics, "activeIssues": [i.get("type") for i in active], "recommendations": recs}


class AddressRequest(BaseModel):
    analysis: Dict[str, Any]
    weather: Optional[Dict[str, Any]] = None
    issues: Optional[List[Dict[str, Any]]] = None


@app.post("/api/ai/address")
async def api_address(req: AddressRequest) -> Dict[str, str]:
    a = req.analysis or {}
    issues = req.issues or []
    active = [i for i in issues if (i.get("status") != "resolved")]
    critical = len([i for i in active if i.get("severity") == "critical"])
    high = len([i for i in active if i.get("severity") == "high"])
    st = (req.weather or {}).get("current", {}).get("soil_temp_f")
    intro = "My fellow lawn enthusiasts,\n\n"
    if critical > 0:
        intro += f"We face a moment of great peril. {critical} critical threat{'s' if critical>1 else ''} endangers our bermuda sovereignty. "
    elif high > 0:
        intro += f"While our lawn remains resilient, we cannot ignore the {high} high-priority challenge{'s' if high>1 else ''}. "
    elif len(active) > 2:
        intro += f"Our green republic stands strong, yet {len(active)} issues demand our attention. "
    elif len(active) > 0:
        intro += "The fundamental strength of our turf remains intact, though vigilance is required. "
    else:
        intro += "Today, I am proud to report excellence unmatched in the neighborhood. "
    temp = ""
    if isinstance(st, (int, float)):
        s = int(round(st))
        if s < 65:
            temp = f"\n\nAs soil temperatures fall to {s}°F, we enter dormancy— a strategic consolidation of our roots. "
        elif s > 85:
            temp = f"\n\nWith soil temperatures at an optimal {s}°F, this is our golden age of growth. "
        else:
            temp = f"\n\nAt {s}°F, our soil temperature supports steady progress. "
    body = intro + temp
    if any(i.get("type") == "disease" for i in active):
        body += "\n\nTo the fungal forces that dare threaten our turf: your days are numbered. "
    if any("weeds-pre" == i.get("type") for i in active):
        body += "\n\nThe weed seeds lying dormant shall never see daylight. Our pre-emergent barrier stands ready. "
    if any("weeds-post" == i.get("type") for i in active):
        body += "\n\nTo the weeds that breached our defenses: you will be met with selective herbicides. "
    closing = "\n\nTogether, we mow forward. Together, we grow stronger.\n\nThe state of the Bermuda is strong.\nGod bless you, and God bless the United States of America."
    return {"text": body + closing}


class HourlyRow(BaseModel):
    ts: str
    wind_mph: Optional[float] = None
    wind_gust_mph: Optional[float] = None
    precip_prob: Optional[float] = None
    precip_in: Optional[float] = None
    status: str
    rules: Dict[str, bool]
    provider: str


@app.get("/api/weather/ok-to-spray")
async def api_ok_to_spray(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    hours: int = Query(24, ge=1, le=48),
    wind_source: str = Query("openmeteo", pattern="^(openmeteo|nws)$"),
) -> Dict[str, Any]:
    station = await select_nearest_station_safe(lat, lon)
    start = datetime.utcnow().replace(microsecond=0)
    end = start + timedelta(hours=hours)

    om = OpenMeteoProvider()
    om_rows = await om.get_hourly(lat, lon, start, end)

    source_label = "OpenMeteo"
    wind_rows = om_rows
    if wind_source == "nws" and os.getenv("NWS_USER_AGENT"):
        try:
            nws = NWSProvider()
            nws_rows = await nws.get_forecast_hourly(lat, lon)
            # align by index; use NWS wind/gust when available, OM precip
            merged: List[Dict[str, Any]] = []
            for i in range(min(len(om_rows), len(nws_rows))):
                merged.append({
                    "ts": om_rows[i]["ts"],
                    "wind_mph": nws_rows[i].get("wind_mph", om_rows[i].get("wind_mph")),
                    "wind_gust_mph": nws_rows[i].get("wind_gust_mph", om_rows[i].get("wind_gust_mph")),
                    "precip_prob": om_rows[i].get("precip_prob"),
                    "precip_in": om_rows[i].get("precip_in"),
                    "provider": "NWS+OpenMeteo",
                })
            wind_rows = merged
            source_label = "NWS+OpenMeteo"
        except Exception:
            wind_rows = om_rows
            source_label = "OpenMeteo"

    table: List[HourlyRow] = []
    for r in wind_rows:
        status, rules = ok_to_spray_hour(r.get("wind_mph"), r.get("wind_gust_mph"), r.get("precip_prob"), r.get("precip_in"))
        table.append(
            HourlyRow(
                ts=r["ts"],
                wind_mph=r.get("wind_mph"),
                wind_gust_mph=r.get("wind_gust_mph"),
                precip_prob=r.get("precip_prob"),
                precip_in=r.get("precip_in"),
                status=status,
                rules=rules,
                provider=r.get("provider", source_label),
            )
        )

    # find first 2-hour OK window
    window = None
    for i in range(len(table) - 1):
        if table[i].status == "OK" and table[i + 1].status == "OK":
            window = {"start": table[i].ts, "end": table[i + 1].ts}
            break

    return {
        "source": {"provider": source_label, "station": station},
        "table": [t.model_dump() for t in table],
        "ok_window": window,
    }


@app.get("/api/nws/alerts")
async def nws_alerts(lat: float = Query(..., ge=-90, le=90), lon: float = Query(..., ge=-180, le=180)):
    try:
        nws = NWSProvider()
    except MissingNWSUserAgent as e:
        raise HTTPException(status_code=500, detail=str(e))
    alerts = await nws.get_alerts(lat, lon)
    return {"alerts": alerts}


@app.get("/api/weather/summary")
async def weather_summary(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    hours: int = Query(6, ge=1, le=48),
):
    return await compute_weather_summary(lat, lon, hours)


async def compute_weather_summary(lat: float, lon: float, hours: int = 6) -> Dict[str, Any]:
    station = await select_nearest_station_safe(lat, lon)
    provider = OpenMeteoProvider()
    start = datetime.utcnow().replace(microsecond=0)
    end = start + timedelta(hours=hours)
    rows = await provider.get_hourly(lat, lon, start, end)
    current = rows[0] if rows else None

    alerts = []
    alerts_status = "skipped_missing_user_agent"
    if os.getenv("NWS_USER_AGENT"):
        try:
            nws = NWSProvider()
            alerts = await nws.get_alerts(lat, lon)
            alerts_status = "ok"
        except Exception:
            alerts = []
            alerts_status = "error"

    return {
        "source": {"provider": "OpenMeteo", "station": station},
        "current": current,
        "hourlies": rows,
        "alerts": {"items": alerts, "status": alerts_status, "provider": "NWS"},
    }


class MixCalcRequest(BaseModel):
    rate_value: float
    rate_unit: str
    area_sqft: float
    carrier_gpa_per_1k: float
    tank_size_gal: float


@app.post("/api/mix/calc")
def api_mix_calc(req: MixCalcRequest):
    try:
        result = calc_mix(
            rate_value=req.rate_value,
            rate_unit=req.rate_unit,  # validated in calc
            area_sqft=req.area_sqft,
            carrier_gpa_per_1k=req.carrier_gpa_per_1k,
            tank_size_gal=req.tank_size_gal,
        )
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)
    return result


# --- Onboarding persistence ---

def get_db_session() -> Iterator[Session]:  # DI-friendly
    with Session(engine()) as s:
        yield s


class PropertyCreate(BaseModel):
    address: str
    state: Optional[str] = None
    program_goal: Optional[str] = None
    irrigation: Optional[str] = None
    mower: Optional[str] = None
    hoc_in: Optional[float] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    timezone: Optional[str] = None


def _ensure_sqlite_onboarding_tables(session: Session) -> None:
    try:
        bind = session.get_bind()
        if bind and bind.dialect.name == 'sqlite':
            session.execute(sa_text(
                "CREATE TABLE IF NOT EXISTS properties ("
                "id INTEGER PRIMARY KEY, user_id VARCHAR, address VARCHAR NOT NULL, lat FLOAT, lon FLOAT, timezone VARCHAR, "
                "program_goal VARCHAR, irrigation VARCHAR, cultivar VARCHAR, mower VARCHAR, hoc_in FLOAT, state VARCHAR, "
                "pgr_last_gdd0 DATE, pgr_last_gdd10 DATE)"
            ))
            session.execute(sa_text(
                "CREATE TABLE IF NOT EXISTS polygons ("
                "id INTEGER PRIMARY KEY, property_id INTEGER NOT NULL, name VARCHAR NOT NULL, geojson TEXT, area_sqft FLOAT, "
                "FOREIGN KEY(property_id) REFERENCES properties(id))"
            ))
            session.commit()
    except Exception:
        pass

@app.post("/api/properties")
def create_property(payload: PropertyCreate, session: Session = Depends(get_db_session)):
    _ensure_sqlite_onboarding_tables(session)
    p = DBProperty(
        address=payload.address,
        state=payload.state,
        program_goal=payload.program_goal,
        irrigation=payload.irrigation,
        mower=payload.mower,
        hoc_in=payload.hoc_in,
        lat=payload.lat,
        lon=payload.lon,
        timezone=payload.timezone,
    )
    session.add(p)
    session.commit()
    session.refresh(p)
    return {"id": p.id, "address": p.address, "state": p.state}


class PolygonCreate(BaseModel):
    name: str
    geojson: Optional[str] = None
    area_sqft: Optional[float] = None


@app.post("/api/properties/{property_id}/polygons")
def add_polygon(property_id: int, payload: PolygonCreate, session: Session = Depends(get_db_session)):
    # Ensure property exists
    _ensure_sqlite_onboarding_tables(session)
    prop = session.exec(select(DBProperty).where(DBProperty.id == property_id)).first()
    if not prop:
        raise HTTPException(status_code=404, detail="property not found")
    poly = DBPolygon(property_id=property_id, name=payload.name, geojson=payload.geojson, area_sqft=payload.area_sqft)
    session.add(poly)
    session.commit()
    session.refresh(poly)
    return {"id": poly.id, "property_id": property_id, "area_sqft": poly.area_sqft}


class PolygonUpdate(BaseModel):
    name: Optional[str] = None
    geojson: Optional[str] = None
    area_sqft: Optional[float] = None


@app.put("/api/properties/{property_id}/polygons/{polygon_id}")
def update_polygon(property_id: int, polygon_id: int, payload: PolygonUpdate, session: Session = Depends(get_db_session)):
    _ensure_sqlite_onboarding_tables(session)
    prop = session.exec(select(DBProperty).where(DBProperty.id == property_id)).first()
    if not prop:
        raise HTTPException(status_code=404, detail="property not found")
    poly = session.exec(select(DBPolygon).where(DBPolygon.id == polygon_id, DBPolygon.property_id == property_id)).first()
    if not poly:
        raise HTTPException(status_code=404, detail="polygon not found")
    if payload.name is not None:
        poly.name = payload.name
    if payload.geojson is not None:
        poly.geojson = payload.geojson
    if payload.area_sqft is not None:
        poly.area_sqft = payload.area_sqft
    session.add(poly)
    session.commit()
    session.refresh(poly)
    return {"id": poly.id, "property_id": poly.property_id, "name": poly.name, "area_sqft": poly.area_sqft}


@app.delete("/api/properties/{property_id}/polygons/{polygon_id}")
def delete_polygon(property_id: int, polygon_id: int, session: Session = Depends(get_db_session)):
    _ensure_sqlite_onboarding_tables(session)
    prop = session.exec(select(DBProperty).where(DBProperty.id == property_id)).first()
    if not prop:
        raise HTTPException(status_code=404, detail="property not found")
    poly = session.exec(select(DBPolygon).where(DBPolygon.id == polygon_id, DBPolygon.property_id == property_id)).first()
    if not poly:
        raise HTTPException(status_code=404, detail="polygon not found")
    session.delete(poly)
    session.commit()
    return {"ok": True}


@app.get("/api/properties/{property_id}")
def get_property(property_id: int, session: Session = Depends(get_db_session)):
    _ensure_sqlite_onboarding_tables(session)
    prop = session.exec(select(DBProperty).where(DBProperty.id == property_id)).first()
    if not prop:
        raise HTTPException(status_code=404, detail="property not found")
    return {
        "id": prop.id,
        "address": prop.address,
        "state": prop.state,
        "program_goal": prop.program_goal,
        "mower": prop.mower,
        "hoc_in": prop.hoc_in,
        "pgr_last_gdd0": prop.pgr_last_gdd0,
        "pgr_last_gdd10": prop.pgr_last_gdd10,
    }


@app.get("/api/properties/{property_id}/polygons")
def list_polygons(property_id: int, session: Session = Depends(get_db_session)):
    _ensure_sqlite_onboarding_tables(session)
    prop = session.exec(select(DBProperty).where(DBProperty.id == property_id)).first()
    if not prop:
        raise HTTPException(status_code=404, detail="property not found")
    polys = session.exec(select(DBPolygon).where(DBPolygon.property_id == property_id)).all()
    return [{"id": p.id, "name": p.name, "area_sqft": p.area_sqft} for p in polys]
# --- Labels service ---

@app.get("/api/labels/by-epa")
def api_labels_by_epa(reg_no: str, session: Session = Depends(get_db_session)):
    pdf = epa_ppls_pdf_url(reg_no)
    if not pdf:
        return JSONResponse({"error": "invalid reg_no"}, status_code=400)
    # ensure table exists for sqlite tests
    try:
        bind = session.get_bind()
        if bind and bind.dialect.name == 'sqlite':
            session.execute(sa_text("CREATE TABLE IF NOT EXISTS labels (id INTEGER PRIMARY KEY, product_id VARCHAR, epa_reg_no VARCHAR, pdf_url VARCHAR, source VARCHAR, retrieved_at VARCHAR, state_reg_json JSON, signal_word VARCHAR, rup BOOLEAN)"))
            session.commit()
    except Exception:
        pass

    # attempt to enrich from curated recipes
    base = os.path.join(os.getcwd(), 'data', 'label_recipes')
    try:
        recs = load_label_recipes(base)
    except Exception:
        recs = []
    sig = None
    rup = None
    for r in recs:
        if str(r.get('epa_reg_no')) == reg_no:
            sig = r.get('signal_word')
            rup = r.get('rup')
            break

    # persist or update label record
    exist = session.exec(select(DBLabel).where(DBLabel.epa_reg_no == reg_no)).first()
    if exist:
        changed = False
        if pdf and exist.pdf_url != pdf:
            exist.pdf_url = pdf
            changed = True
        if sig and exist.signal_word != sig:
            exist.signal_word = sig
            changed = True
        if (rup is not None) and (exist.rup != rup):
            exist.rup = rup
            changed = True
        if changed:
            session.add(exist)
            session.commit()
    else:
        try:
            session.add(DBLabel(epa_reg_no=reg_no, pdf_url=pdf, source='EPA_PPLS', retrieved_at=datetime.utcnow().isoformat()+"Z", signal_word=sig, rup=rup))
            session.commit()
        except Exception:
            session.execute(
                sa_text("INSERT INTO labels (epa_reg_no, pdf_url, source, retrieved_at, signal_word, rup) VALUES (:r,:p,:s,:t,:sig,:rup)"),
                {"r": reg_no, "p": pdf, "s": "EPA_PPLS", "t": datetime.utcnow().isoformat()+"Z", "sig": sig, "rup": rup},
            )
            session.commit()
    return {"epa_reg_no": reg_no, "pdf_url": pdf, "rup": rup, "signal_word": sig}


@app.get("/api/labels/search")
def api_labels_search(query: str):
    base = os.path.join(os.getcwd(), 'data', 'label_recipes')
    recs = load_label_recipes(base)
    return {"results": search_recipes(recs, query)}


@app.get("/api/products/{product_id}/rates")
def api_product_rates(product_id: str, hoc_in: Optional[float] = Query(None)):
    base = os.path.join(os.getcwd(), 'data', 'label_recipes')
    recs = load_label_recipes(base)
    data = filter_rates_for_product(recs, product_id, hoc_in)
    return data


@app.get("/api/labels/picol")
def api_labels_picol(reg_no: str, state: Optional[str] = None, session: Session = Depends(get_db_session)):
    # Minimal stub for PICOL supplemental labels
    state_code = (state or 'WA').upper()
    pdf = f"https://picol.cahnrs.wsu.edu/Label/{reg_no}?state={state_code}"
    try:
        bind = session.get_bind()
        if bind and bind.dialect.name == 'sqlite':
            session.execute(sa_text("CREATE TABLE IF NOT EXISTS labels (id INTEGER PRIMARY KEY, product_id VARCHAR, epa_reg_no VARCHAR, pdf_url VARCHAR, source VARCHAR, retrieved_at VARCHAR, state_reg_json JSON, signal_word VARCHAR, rup BOOLEAN)"))
            session.commit()
    except Exception:
        pass
    exist = session.exec(select(DBLabel).where(DBLabel.epa_reg_no == reg_no)).first()
    if not exist:
        try:
            session.add(DBLabel(epa_reg_no=reg_no, pdf_url=pdf, source='PICOL', retrieved_at=datetime.utcnow().isoformat()+"Z"))
            session.commit()
        except Exception:
            session.execute(
                sa_text("INSERT INTO labels (epa_reg_no, pdf_url, source, retrieved_at) VALUES (:r,:p,:s,:t)"),
                {"r": reg_no, "p": pdf, "s": "PICOL", "t": datetime.utcnow().isoformat()+"Z"},
            )
            session.commit()
    return {"epa_reg_no": reg_no, "pdf_url": pdf, "source": "PICOL"}


@app.get("/api/properties/{property_id}/applications")
def api_list_applications(property_id: int, session: Session = Depends(get_db_session)):
    prop = session.exec(select(DBProperty).where(DBProperty.id == property_id)).first()
    if not prop:
        raise HTTPException(status_code=404, detail="property not found")
    rows = session.execute(sa_text("SELECT id, product_id, date, rate_value, rate_unit, area_sqft, batch_id FROM applications WHERE property_id = :pid"), {"pid": property_id}).mappings().all()
    return list(rows)


@app.get("/api/applications/{application_id}")
def api_get_application(application_id: int, session: Session = Depends(get_db_session)):
    row = session.execute(
        sa_text(
            "SELECT id, property_id, product_id, date, rate_value, rate_unit, area_sqft, carrier_gpa, tank_size_gal, gdd_model, notes, weather_snapshot FROM applications WHERE id = :id"
        ),
        {"id": application_id},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="application not found")
    return dict(row)


@app.get("/api/application-batches/{batch_id}")
def api_get_application_batch(batch_id: str, session: Session = Depends(get_db_session)):
    rows = session.execute(
        sa_text(
            "SELECT id, property_id, product_id, date, rate_value, rate_unit, area_sqft, carrier_gpa, tank_size_gal, gdd_model, notes FROM applications WHERE batch_id = :bid ORDER BY id"
        ),
        {"bid": batch_id},
    ).mappings().all()
    if not rows:
        raise HTTPException(status_code=404, detail="batch not found")
    return [dict(r) for r in rows]


class PgrLogRequest(BaseModel):
    property_id: int
    model: str  # 'gdd0' | 'gdd10'


@app.post("/api/pgr/apply")
def api_pgr_apply(req: PgrLogRequest, session: Session = Depends(get_db_session)):
    prop = session.exec(select(DBProperty).where(DBProperty.id == req.property_id)).first()
    if not prop:
        raise HTTPException(status_code=404, detail="property not found")
    today = datetime.utcnow().date().isoformat()
    if req.model == 'gdd0':
        prop.pgr_last_gdd0 = today
    else:
        prop.pgr_last_gdd10 = today
    session.add(prop)
    session.commit()
    return {"ok": True, "date": today}


class ApplicationItem(BaseModel):
    product_id: str
    rate_value: float
    rate_unit: str


class ApplicationsBulkRequest(BaseModel):
    property_id: int
    date: Optional[str] = None
    area_sqft: Optional[float] = None
    carrier_gpa: Optional[float] = None
    tank_size_gal: Optional[float] = None
    gdd_model: Optional[str] = None
    notes: Optional[str] = None
    items: List[ApplicationItem]


@app.post("/api/applications/bulk")
async def api_applications_bulk(req: ApplicationsBulkRequest, session: Session = Depends(get_db_session)):
    prop = session.exec(select(DBProperty).where(DBProperty.id == req.property_id)).first()
    if not prop:
        raise HTTPException(status_code=404, detail="property not found")
    try:
        bind = session.get_bind()
        if bind and bind.dialect.name == 'sqlite':
            session.execute(sa_text("CREATE TABLE IF NOT EXISTS applications (id INTEGER PRIMARY KEY, property_id INTEGER NOT NULL, product_id VARCHAR NOT NULL, date DATE, rate_value FLOAT, rate_unit VARCHAR, area_sqft FLOAT, carrier_gpa FLOAT, tank_size_gal FLOAT, gdd_model VARCHAR, notes TEXT, weather_snapshot JSON, batch_id VARCHAR)"))
            session.commit()
    except Exception:
        pass
    ins_sql = (
        "INSERT INTO applications (property_id, product_id, date, rate_value, rate_unit, area_sqft, carrier_gpa, tank_size_gal, gdd_model, notes, weather_snapshot, batch_id) "
        "VALUES (:property_id, :product_id, :date, :rate_value, :rate_unit, :area_sqft, :carrier_gpa, :tank_size_gal, :gdd_model, :notes, :weather_snapshot, :batch_id)"
    )
    today = datetime.utcnow().date().isoformat()
    d = req.date or today
    # Generate batch_id as ISO timestamp + property
    batch_id = f"{d}T{datetime.utcnow().time().isoformat()}_{req.property_id}"
    weather_snapshot = None
    try:
        if prop.lat is not None and prop.lon is not None:
            weather_snapshot = await compute_weather_summary(prop.lat, prop.lon, hours=6)
        else:
            weather_snapshot = {"status": "skipped_missing_location"}
    except Exception:
        weather_snapshot = {"status": "error"}
    for it in req.items:
        session.execute(
            sa_text(ins_sql),
            {
                'property_id': req.property_id,
                'product_id': it.product_id,
                'date': d,
                'rate_value': it.rate_value,
                'rate_unit': it.rate_unit,
                'area_sqft': req.area_sqft,
                'carrier_gpa': req.carrier_gpa,
                'tank_size_gal': req.tank_size_gal,
                'gdd_model': req.gdd_model,
                'notes': req.notes,
                'weather_snapshot': weather_snapshot,
                'batch_id': batch_id,
            },
        )
    session.commit()
    return {"ok": True, "count": len(req.items), "batch_id": batch_id}
