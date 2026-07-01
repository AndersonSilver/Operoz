from __future__ import annotations

from django.core.management.base import BaseCommand

from operoz.assistant.llm.client import chat_completion
from operoz.assistant.llm.config import get_llm_base_url, get_llm_config
from operoz.assistant.llm.http_client import llm_user_message


class Command(BaseCommand):
    help = "Testa a configuração LLM (God Mode / env) com uma mensagem mínima."

    def handle(self, *args, **options):
        api_key, model, provider, degraded = get_llm_config()
        if not api_key or not model or not provider:
            self.stderr.write(self.style.ERROR("LLM não configurado (chave, modelo ou provedor ausente)."))
            return

        masked = f"{api_key[:6]}…{api_key[-4:]}" if len(api_key) > 12 else "(curta)"
        base_url = get_llm_base_url(provider_key=provider)
        self.stdout.write(f"Provedor: {provider}")
        self.stdout.write(f"Modelo:   {model}")
        self.stdout.write(f"Chave:    {masked}")
        self.stdout.write(f"Base URL: {base_url or '(padrão OpenAI)'}")
        self.stdout.write(f"Degraded: {degraded}")
        self.stdout.write("Enviando ping…")

        result = chat_completion([{"role": "user", "content": "Responda apenas: ok"}])
        if result.error:
            self.stderr.write(
                self.style.ERROR(
                    llm_user_message(result.error, detail=result.error_detail),
                )
            )
            self.stderr.write(self.style.ERROR(f"Código: {result.error}"))
            return

        self.stdout.write(self.style.SUCCESS(f"OK — resposta: {(result.content or '').strip()[:200]}"))
