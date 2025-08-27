from __future__ import annotations

from typing import Any, Dict, List, Optional
import os
import glob
import yaml


def epa_ppls_pdf_url(reg_no: str) -> Optional[str]:
    # Minimal deterministic URL pattern for federal label PDFs on EPA PPLS mirrors.
    if not reg_no or '-' not in reg_no:
        return None
    # In reality, PPLS requires lookup. We return a plausible CDX pattern for stubbing.
    parts = reg_no.split('-')
    return f"https://www3.epa.gov/pesticides/chem_search/ppls/{parts[0]}/{reg_no}-latest.pdf"


def load_label_recipes(data_dir: str) -> List[Dict[str, Any]]:
    recipes: List[Dict[str, Any]] = []
    for path in glob.glob(os.path.join(data_dir, '*.yaml')):
        with open(path, 'r') as f:
            try:
                doc = yaml.safe_load(f) or {}
                base = os.path.basename(path)
                doc['__file'] = base
                doc['__file_slug'] = os.path.splitext(base)[0]
                recipes.append(doc)
            except Exception:
                continue
    return recipes


def _norm(s: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def search_recipes(recipes: List[Dict[str, Any]], query: str) -> List[Dict[str, Any]]:
    q = _norm(query or '')
    synonyms = {
        'tenex': 'tnex',
        't-nex': 'tnex',
        'prodiamine65wdg': 'prodiamine65wdg',
        'prodiamine': 'prodiamine65wdg',
        'primo': 'primo_maxx',
        'primo_maxx': 'primo_maxx',
        'dimension': 'dimension_2ew',
        'dimension_2ew': 'dimension_2ew',
        'drive': 'drive_xlr8',
        'drive_xlr8': 'drive_xlr8',
    }
    q_alt = synonyms.get(q, q)
    if not q:
        return []
    out = []
    for r in recipes:
        name = _norm(r.get('name') or '')
        reg = _norm(r.get('epa_reg_no') or '')
        file_slug = _norm(r.get('__file_slug') or '')
        aliases = [ _norm(a) for a in (r.get('aliases') or []) ]
        if q in name or q in reg or q_alt in name or q in file_slug or q_alt in file_slug or q in aliases or q_alt in aliases:
            out.append({
                'name': r.get('name'),
                'epa_reg_no': r.get('epa_reg_no'),
                'type': r.get('type'),
                'rates': r.get('rates'),
                'label_pdf_url': r.get('label_pdf_url'),
                'signal_word': r.get('signal_word'),
                'rup': r.get('rup'),
            })
    return out


def filter_rates_for_product(recipes: List[Dict[str, Any]], product_query: str, hoc_in: Optional[float] = None) -> Dict[str, Any]:
    items = search_recipes(recipes, product_query)
    if not items:
        return {"rates": []}
    r = next((x for x in recipes if x.get('name') == items[0]['name']), None)
    if not r:
        return {"rates": []}
    rates = r.get('rates') or {}
    hoc_ranges = rates.get('hoc_ranges') or []
    if hoc_in is not None:
        hoc_ranges = [hr for hr in hoc_ranges if hr.get('hoc_max_in') is None or hoc_in <= hr.get('hoc_max_in')]
    return {
        "name": r.get('name'),
        "epa_reg_no": r.get('epa_reg_no'),
        "rates": {**rates, 'hoc_ranges': hoc_ranges},
    }
