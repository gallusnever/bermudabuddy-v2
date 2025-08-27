from apps.api.services.ok_to_spray import ok_to_spray_hour


def test_ok_rules_all_ok():
    status, rules = ok_to_spray_hour(5, 10, 0.1, 0)
    assert status == 'OK'
    assert rules == {"wind": True, "gust": True, "rain": True}


def test_ok_rules_caution_two_of_three():
    status, rules = ok_to_spray_hour(2, 10, 0.1, 0)
    assert status == 'CAUTION'
    assert rules["wind"] is False


def test_ok_rules_not_ok():
    status, rules = ok_to_spray_hour(12, 20, 0.5, 0.1)
    assert status == 'NOT_OK'
    assert list(rules.values()).count(False) >= 2

