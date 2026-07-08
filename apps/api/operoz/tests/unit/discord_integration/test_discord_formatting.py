from __future__ import annotations

from django.test import SimpleTestCase

from operoz.discord_integration.services.discord_formatting import (
    build_focus_reply,
    build_overview_reply,
    filter_stats_by_focus,
)


def _sample_project(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "project_id": "1",
        "name": "MAGALU",
        "identifier": "MAG",
        "total_issues": 108,
        "completed_issues": 54,
        "open_issues": 54,
        "support_open": 3,
        "status_report_coverage": "partial",
    }
    base.update(overrides)
    return base


class DiscordFormattingTests(SimpleTestCase):
    def test_filter_stats_by_focus_partial_match(self):
        stats = [
            _sample_project(name="MAGALU", identifier="MAG"),
            _sample_project(name="SICREDI", identifier="SIC", open_issues=4, completed_issues=4, total_issues=8),
        ]
        matched = filter_stats_by_focus(stats, "magalu")
        self.assertEqual(len(matched), 1)
        self.assertEqual(matched[0]["name"], "MAGALU")

    def test_build_overview_reply_single_panorama_format(self):
        stats = [
            _sample_project(),
            _sample_project(
                name="SICREDI",
                identifier="SIC",
                total_issues=20,
                completed_issues=15,
                open_issues=5,
                support_open=0,
                status_report_coverage="complete",
            ),
        ]
        reply = build_overview_reply(stats)
        self.assertEqual(len(reply.payloads), 1)
        embed = reply.payloads[0].embeds[0]
        self.assertEqual(embed["title"], "Panorama da squad")
        self.assertNotIn("conclusão no prazo", embed["description"])
        self.assertNotIn("Indicador", embed["description"])
        self.assertIn("Clientes", embed["description"])
        self.assertIn(str(stats[0]["name"]), embed["description"])
        self.assertIn("Resumo da squad", embed["description"])
        self.assertIn("59 abertas", embed["description"])
        self.assertNotIn("fields", embed)

    def test_build_overview_reply_keeps_all_clients_in_one_message(self):
        stats = [
            _sample_project(
                name=f"Projeto {index}",
                identifier=f"P{index}",
                total_issues=index,
                completed_issues=index // 2,
                open_issues=index - index // 2,
            )
            for index in range(1, 19)
        ]
        reply = build_overview_reply(stats)
        self.assertEqual(len(reply.payloads), 1)
        self.assertNotIn("continua", reply.payloads[0].embeds[0]["description"])
        self.assertIn("Projeto 18", reply.payloads[0].embeds[0]["description"])

    def test_build_focus_reply_includes_support_and_report(self):
        reply = build_focus_reply(
            focus="MAGALU",
            llm_text="**Riscos**\n- Nenhum bloqueio crítico.",
            stats=[_sample_project()],
        )
        field_names = [field["name"] for field in reply.payloads[0].embeds[0]["fields"]]
        self.assertIn("Sustentação", field_names)
        self.assertIn("Status report", field_names)
