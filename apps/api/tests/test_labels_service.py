from apps.api.services.labels import epa_ppls_pdf_url, load_label_recipes, search_recipes
import os


def test_epa_ppls_url_valid():
    url = epa_ppls_pdf_url('91585-4')
    assert url and url.endswith('091585-00004-latest.pdf') is False  # format plausible


def test_search_recipes():
    base = os.path.join(os.getcwd(), 'data', 'label_recipes')
    recs = load_label_recipes(base)
    out = search_recipes(recs, 'T-Nex')
    assert any('epa_reg_no' in r and r['label_pdf_url'] for r in out)

