from apps.api.services.mix_math import calc_mix, tank_coverage_sqft, total_product


def test_tank_coverage_sqft():
  assert tank_coverage_sqft(2.0, 1.0) == 2000.0
  assert tank_coverage_sqft(4.0, 2.0) == 2000.0


def test_liquid_rate_oz_per_1k():
  r = calc_mix(rate_value=1.5, rate_unit='oz_per_1k', area_sqft=5000, carrier_gpa_per_1k=1.0, tank_size_gal=2.0)
  # total product
  assert r['product_unit'] == 'oz'
  assert abs(r['total_product'] - 7.5) < 1e-6
  # 2 gal tank @ 1 gpa per 1k sqft -> 2000 sqft per tank -> 3 tanks (2 full + partial)
  assert r['tanks_needed'] == 3
  assert abs(sum(r['per_tank']) - r['total_product']) < 1e-6


def test_fl_oz_per_gal():
  # 1 fl oz per gallon, area 5000 sqft, 1 gpa/1k -> gallons_total=5 → total product 5 fl oz
  r = calc_mix(rate_value=1.0, rate_unit='fl_oz_per_gal', area_sqft=5000, carrier_gpa_per_1k=1.0, tank_size_gal=2.0)
  assert r['product_unit'] == 'fl_oz'
  assert abs(r['total_product'] - 5.0) < 1e-6
  assert r['per_gallon_concentration'] == (1.0, 'fl_oz_per_gal')


def test_percent_vv():
  # 1% v/v of 5 gallons -> 0.05 gal product -> 6.4 fl oz
  r = calc_mix(rate_value=1.0, rate_unit='percent_vv', area_sqft=5000, carrier_gpa_per_1k=1.0, tank_size_gal=2.0)
  assert r['product_unit'] == 'fl_oz'
  assert abs(r['total_product'] - (0.05 * 128)) < 1e-6

