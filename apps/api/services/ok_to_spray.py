from typing import Dict, Tuple, Optional


def ok_to_spray_hour(
    wind: Optional[float], gust: Optional[float], prob: Optional[float], qty: Optional[float]
) -> Tuple[str, Dict[str, bool]]:
    rules = {
        "wind": 3 <= (wind or 0) <= 10,
        "gust": (gust is None) or (gust < 15),
        "rain": (prob or 0) < 0.20 and (qty or 0) == 0,
    }
    score = sum(rules.values())
    status = "OK" if score == 3 else ("CAUTION" if score == 2 else "NOT_OK")
    return status, rules

