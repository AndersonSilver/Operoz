from __future__ import annotations

PROPOSAL_TOOLS = frozenset(
    {
        "propose_automation_rule",
        "propose_automation_pack_install",
        "propose_issue_comment",
        "propose_issue_state_change",
    }
)

EXECUTABLE_CONFIRMED_ACTIONS = frozenset(
    {
        "issue_comment",
        "issue_state_change",
    }
)


def is_proposal_tool(tool_name: str) -> bool:
    return tool_name in PROPOSAL_TOOLS


def proposal_metadata_key(tool_name: str) -> str | None:
    mapping = {
        "propose_automation_rule": "automation_proposal",
        "propose_automation_pack_install": "pack_install_proposal",
        "propose_issue_comment": "action_proposal",
        "propose_issue_state_change": "action_proposal",
    }
    return mapping.get(tool_name)
