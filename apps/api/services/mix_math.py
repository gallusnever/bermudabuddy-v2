from __future__ import annotations

import math
from typing import List, Literal, Optional, Tuple, Dict, Any

# Units
# - area_sqft: square feet
# - carrier_gpa_per_1k: gallons per 1,000 sqft (turf convention)
# - tank_size_gal: gallons
# - rate units supported:
#   'oz_per_1k', 'lb_per_1k', 'oz_per_acre', 'lb_per_acre', 'fl_oz_per_gal', 'percent_vv'

RateUnit = Literal[
    'oz_per_1k', 'lb_per_1k', 'oz_per_acre', 'lb_per_acre', 'fl_oz_per_gal', 'percent_vv'
]


def tank_coverage_sqft(tank_size_gal: float, carrier_gpa_per_1k: float) -> float:
    if carrier_gpa_per_1k <= 0:
        raise ValueError('carrier_gpa_per_1k must be > 0')
    return (tank_size_gal / carrier_gpa_per_1k) * 1000.0


def gallons_for_area(area_sqft: float, carrier_gpa_per_1k: float) -> float:
    return (area_sqft / 1000.0) * carrier_gpa_per_1k


def total_product(
    rate_value: float,
    rate_unit: RateUnit,
    area_sqft: float,
    carrier_gpa_per_1k: float,
) -> Tuple[float, str]:
    if rate_unit == 'oz_per_1k':
        return rate_value * (area_sqft / 1000.0), 'oz'
    if rate_unit == 'lb_per_1k':
        return rate_value * (area_sqft / 1000.0), 'lb'
    if rate_unit == 'oz_per_acre':
        return rate_value * (area_sqft / 43560.0), 'oz'
    if rate_unit == 'lb_per_acre':
        return rate_value * (area_sqft / 43560.0), 'lb'
    if rate_unit == 'fl_oz_per_gal':
        gallons = gallons_for_area(area_sqft, carrier_gpa_per_1k)
        return rate_value * gallons, 'fl_oz'
    if rate_unit == 'percent_vv':
        gallons = gallons_for_area(area_sqft, carrier_gpa_per_1k)
        # percent v/v of spray volume -> fl oz of product
        return (rate_value / 100.0) * gallons * 128.0, 'fl_oz'
    raise ValueError('unsupported rate unit')


def split_per_tank(
    total: float,
    total_area_sqft: float,
    tank_size_gal: float,
    carrier_gpa_per_1k: float,
) -> List[float]:
    cov = tank_coverage_sqft(tank_size_gal, carrier_gpa_per_1k)
    if cov <= 0:
        raise ValueError('invalid tank coverage')
    if total_area_sqft <= 0:
        return []
    n_full = int(total_area_sqft // cov)
    remainder_area = total_area_sqft - (n_full * cov)
    parts = []
    for _ in range(n_full):
        parts.append(total * (cov / total_area_sqft))
    if remainder_area > 1e-6:
        parts.append(total * (remainder_area / total_area_sqft))
    return parts


def per_gallon_concentration(
    rate_value: float,
    rate_unit: RateUnit,
) -> Optional[Tuple[float, str]]:
    if rate_unit == 'fl_oz_per_gal':
        return rate_value, 'fl_oz_per_gal'
    if rate_unit == 'percent_vv':
        return rate_value, 'percent_vv'
    return None


def calc_mix(
    *,
    rate_value: float,
    rate_unit: RateUnit,
    area_sqft: float,
    carrier_gpa_per_1k: float,
    tank_size_gal: float,
) -> Dict[str, Any]:
    total, unit = total_product(rate_value, rate_unit, area_sqft, carrier_gpa_per_1k)
    per_tank = split_per_tank(total, area_sqft, tank_size_gal, carrier_gpa_per_1k)
    tanks_needed = len(per_tank)
    conc = per_gallon_concentration(rate_value, rate_unit)
    gallons_total = gallons_for_area(area_sqft, carrier_gpa_per_1k)
    return {
        'total_product': total,
        'product_unit': unit,
        'tanks_needed': tanks_needed,
        'per_tank': per_tank,
        'spray_gallons_total': gallons_total,
        'per_gallon_concentration': conc,
    }

