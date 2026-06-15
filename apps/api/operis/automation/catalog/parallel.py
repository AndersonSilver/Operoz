from __future__ import annotations

from operis.automation.catalog.registry import CatalogEntry, catalog


def register_parallel() -> None:
    catalog.register(
        CatalogEntry(
            key="parallel.fan_out",
            kind="parallel",
            label="Fan-out paralelo",
            description="Executa vários ramos em paralelo (ex.: e-mail + webhook ao mesmo tempo).",
            icon="git-merge",
            config_schema={
                "type": "object",
                "properties": {
                    "join_policy": {"type": "string", "enum": ["all", "any"], "default": "all"},
                    "branches": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "label": {"type": "string"},
                            },
                            "required": ["id", "label"],
                        },
                    },
                },
            },
            handler=None,
        )
    )
