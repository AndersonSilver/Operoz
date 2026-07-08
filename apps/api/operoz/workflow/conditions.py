"""
Workflow Transition Conditions Registry

Conditions that must be met for a transition to be available to a user.
Each condition is a function that receives (user, issue, config) and returns
True if the condition is satisfied, False otherwise.
"""

from typing import Callable, Dict, Any
from django.contrib.auth import get_user_model

User = get_user_model()


class ConditionRegistry:
    """Registry for transition conditions using Open/Closed principle"""

    _conditions: Dict[str, Callable] = {}

    @classmethod
    def register(cls, condition_type: str):
        """Decorator to register a condition function"""

        def decorator(func: Callable):
            cls._conditions[condition_type] = func
            return func

        return decorator

    @classmethod
    def get(cls, condition_type: str) -> Callable:
        """Get a condition function by type"""
        if condition_type not in cls._conditions:
            raise ValueError(f"Unknown condition type: {condition_type}")
        return cls._conditions[condition_type]

    @classmethod
    def all_types(cls) -> list[str]:
        """Return all registered condition types"""
        return list(cls._conditions.keys())


# Register built-in conditions


@ConditionRegistry.register("assignee_only")
def condition_assignee_only(user: User, issue: Any, config: Dict[str, Any]) -> bool:
    """
    Only the assignee of the issue can execute this transition.

    Config: {} (empty)
    """
    if not issue.assignees.exists():
        return False
    return issue.assignees.filter(id=user.id).exists()


@ConditionRegistry.register("reporter_only")
def condition_reporter_only(user: User, issue: Any, config: Dict[str, Any]) -> bool:
    """
    Only the reporter (creator) of the issue can execute this transition.

    Config: {} (empty)
    """
    return issue.created_by == user


@ConditionRegistry.register("role")
def condition_role(user: User, issue: Any, config: Dict[str, Any]) -> bool:
    """
    User must have a specific role in the project.

    Config: {"role": "ADMIN" | "MEMBER" | "GUEST"}
    """
    from operoz.db.models import ProjectMember, ROLE

    role_name = config.get("role")
    if not role_name:
        return False

    try:
        role_value = ROLE[role_name].value
    except KeyError:
        return False

    return ProjectMember.objects.filter(member=user, project=issue.project, role=role_value, is_active=True).exists()


@ConditionRegistry.register("group")
def condition_group(user: User, issue: Any, config: Dict[str, Any]) -> bool:
    """
    User must belong to a specific group.

    Config: {"group_id": "<uuid>"}
    Note: This will be implemented when feature 07 (Permission Scheme) is done.
    For now, this returns False (not implemented).
    """
    # TODO: Implement when feature 07 is done
    return False


@ConditionRegistry.register("is_member")
def condition_is_member(user: User, issue: Any, config: Dict[str, Any]) -> bool:
    """
    User must be a member of the project (any role).

    Config: {} (empty)
    """
    from operoz.db.models import ProjectMember

    return ProjectMember.objects.filter(member=user, project=issue.project, is_active=True).exists()


def check_conditions(user: User, issue: Any, transition: Any) -> tuple[bool, str]:
    """
    Check all conditions for a transition.

    Returns:
        (allowed: bool, error_message: str)
    """
    for condition in transition.conditions.all():
        condition_func = ConditionRegistry.get(condition.condition_type)
        if not condition_func(user, issue, condition.config):
            return False, f"Condition '{condition.condition_type}' not satisfied"

    return True, ""
