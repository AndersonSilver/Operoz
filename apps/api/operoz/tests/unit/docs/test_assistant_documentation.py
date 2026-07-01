from pathlib import Path

import pytest
import yaml


def _docs_root() -> Path | None:
    docker_docs = Path("/docs")
    if (docker_docs / "assistant-index.md").is_file():
        return docker_docs
    here = Path(__file__).resolve()
    for depth in range(3, 9):
        if depth >= len(here.parents):
            break
        candidate = here.parents[depth] / "docs"
        if (candidate / "assistant-index.md").is_file():
            return candidate
    return None


@pytest.fixture(scope="module")
def repo_docs() -> Path:
    root = _docs_root()
    if root is None:
        pytest.skip("docs/ not found — mount ./docs:/docs:ro no container api")
    return root

REQUIRED_DOCS = [
    "assistant-user-guide.md",
    "assistant-admin-guide.md",
    "assistant-api-reference.md",
    "assistant-adrs.md",
    "assistant-index.md",
    "assistant-scaling.md",
    "assistant-scaling-baseline.md",
    "operoz-assistant-adr-004-chat-scaling.md",
    "assistant-go-live-checklist.md",
    "assistant-incident-runbook.md",
    "claude-code-operoz-mapping.md",
    "openapi/assistant.yaml",
]

REQUIRED_SECTIONS = {
    "assistant-user-guide.md": ["Limitações", "Exemplos"],
    "assistant-admin-guide.md": ["Rate limits", "LLM"],
    "assistant-api-reference.md": ["POST /sessions/{session_id}/chat/", "Tools internas"],
    "assistant-adrs.md": ["pgvector vs Qdrant", "379 tools", "004"],
    "operoz-mcp.md": ["Assistente Operoz vs MCP externo"],
    "claude-code-operoz-mapping.md": [
        "Plugin manifest",
        "decision.llm",
        "action.retry_until",
        "Board Playbooks",
    ],
}


@pytest.mark.unit
class TestAssistantDocumentation:
    @pytest.mark.parametrize("filename", REQUIRED_DOCS)
    def test_required_doc_exists(self, repo_docs: Path, filename: str):
        path = repo_docs / filename
        assert path.is_file(), f"Missing doc: {filename}"

    @pytest.mark.parametrize("filename,sections", list(REQUIRED_SECTIONS.items()))
    def test_doc_contains_sections(self, repo_docs: Path, filename: str, sections: list[str]):
        path = repo_docs / filename
        content = path.read_text(encoding="utf-8")
        for section in sections:
            assert section in content, f"{filename} missing section: {section}"

    def test_openapi_assistant_valid_yaml(self, repo_docs: Path):
        path = repo_docs / "openapi" / "assistant.yaml"
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        assert data["openapi"].startswith("3.")
        assert "/sessions/" in data["paths"]
