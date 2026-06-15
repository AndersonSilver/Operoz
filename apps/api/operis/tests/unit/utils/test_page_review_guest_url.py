from __future__ import annotations

from operis.utils.page_review_guest import build_prd_review_api_base, build_prd_review_guest_url


class TestPrdReviewGuestUrl:
    def test_guest_url_prefers_app_base_url(self, settings):
        settings.WEB_URL = "http://localhost:8000"
        settings.APP_BASE_URL = "http://localhost:3000"
        assert (
            build_prd_review_guest_url("operoz_prd_test")
            == "http://localhost:3000/guest/prd-review/operoz_prd_test"
        )

    def test_guest_url_falls_back_to_web_url(self, settings):
        settings.WEB_URL = "https://app.operoz.test"
        settings.APP_BASE_URL = None
        assert build_prd_review_guest_url("abc").endswith("/guest/prd-review/abc")

    def test_api_base_prefers_web_url(self, settings):
        settings.WEB_URL = "http://localhost:8000"
        settings.APP_BASE_URL = "http://localhost:3000"
        assert build_prd_review_api_base() == "http://localhost:8000"

    def test_api_base_falls_back_to_app_base_url(self, settings):
        settings.WEB_URL = None
        settings.APP_BASE_URL = "https://app.operoz.test"
        assert build_prd_review_api_base() == "https://app.operoz.test"
