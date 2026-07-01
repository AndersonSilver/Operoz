"""Valida manifests de Automation Packs no repositório."""

from __future__ import annotations

from typing import Any

from django.core.management.base import BaseCommand, CommandError

from operoz.automation.packs_registry import (
    automation_packs_dir,
    get_automation_pack,
    list_automation_packs,
    validate_all_automation_packs,
    validate_pack_manifest,
)


class Command(BaseCommand):
    help = "Valida pack.json (e hooks) dos Automation Packs Operoz"

    def add_arguments(self, parser):
        parser.add_argument("pack_name", nargs="?", help="Nome do pack (ex: operoz-pack-gestao-operacional)")
        parser.add_argument("--all", action="store_true", help="Validar todos os packs")

    def handle(self, *args: Any, **options: Any) -> None:
        if options["all"] or not options["pack_name"]:
            errors = validate_all_automation_packs()
            packs = list_automation_packs()
            if errors:
                raise CommandError("\n".join(errors))
            self.stdout.write(self.style.SUCCESS(f"{len(packs)} pack(s) válido(s) em {automation_packs_dir()}"))
            return

        bundle = get_automation_pack(options["pack_name"])
        if not bundle:
            raise CommandError(f"Pack não encontrado: {options['pack_name']}")

        errors = validate_pack_manifest(bundle.manifest, pack_root=bundle.root)
        if errors:
            raise CommandError("\n".join(errors))
        self.stdout.write(self.style.SUCCESS(f"Pack válido: {bundle.name} v{bundle.manifest['version']}"))
