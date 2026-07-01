from unittest.mock import MagicMock, patch

from operoz.devops.celery_queue_monitor import (
    default_alert_threshold,
    get_queue_depths,
    queues_exceeding_threshold,
)


class TestCeleryQueueMonitor:
    def test_queues_exceeding_threshold(self):
        depths = {"automation": 10, "assistant": 600, "celery": None}
        alerts = queues_exceeding_threshold(depths, 500)
        assert len(alerts) == 1
        assert alerts[0]["queue"] == "assistant"
        assert alerts[0]["depth"] == 600

    def test_default_alert_threshold(self):
        with patch.dict("os.environ", {"CELERY_QUEUE_ALERT_THRESHOLD": "1000"}):
            assert default_alert_threshold() == 1000

    @patch("operoz.devops.celery_queue_monitor.app")
    def test_get_queue_depths_passive_declare(self, mock_app):
        channel = MagicMock()
        channel.queue_declare.side_effect = [
            (None, 42, None),
            Exception("NOT_FOUND"),
        ]
        conn = MagicMock()
        conn.default_channel = channel
        mock_app.connection_or_acquire.return_value.__enter__.return_value = conn

        depths = get_queue_depths(["automation", "missing"])
        assert depths == {"automation": 42, "missing": None}
