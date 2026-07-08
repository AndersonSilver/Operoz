"""
Workflow Transition Post-Functions Registry

Post-functions that execute after a successful transition.
Each post-function is a function that receives (issue, actor, config, transition)
and performs an action.
"""

from typing import Callable, Dict, Any
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class PostFunctionRegistry:
    """Registry for transition post-functions using Open/Closed principle"""

    _functions: Dict[str, Callable] = {}

    @classmethod
    def register(cls, function_type: str):
        """Decorator to register a post-function"""

        def decorator(func: Callable):
            cls._functions[function_type] = func
            return func

        return decorator

    @classmethod
    def get(cls, function_type: str) -> Callable:
        """Get a post-function by type"""
        if function_type not in cls._functions:
            raise ValueError(f"Unknown post-function type: {function_type}")
        return cls._functions[function_type]

    @classmethod
    def all_types(cls) -> list[str]:
        """Return all registered post-function types"""
        return list(cls._functions.keys())


# Register built-in post-functions


@PostFunctionRegistry.register("assign")
def post_function_assign(issue: Any, actor: User, config: Dict[str, Any], transition: Any) -> None:
    """
    Assign the issue to a specific user.

    Config: {"user_id": "<uuid>"} or {"assignee": "reporter" | "project_lead"}
    """
    from operoz.db.models import IssueAssignee

    # Clear existing assignees
    issue.assignees.all().delete()

    user_id = config.get("user_id")
    assignee_type = config.get("assignee")

    if user_id:
        try:
            user = User.objects.get(id=user_id)
            IssueAssignee.objects.create(
                issue=issue,
                assignee=user,
                workspace=issue.workspace,
                project=issue.project,
            )
        except User.DoesNotExist:
            pass
    elif assignee_type == "reporter" and issue.created_by:
        IssueAssignee.objects.create(
            issue=issue,
            assignee=issue.created_by,
            workspace=issue.workspace,
            project=issue.project,
        )
    elif assignee_type == "project_lead" and issue.project.project_lead:
        IssueAssignee.objects.create(
            issue=issue,
            assignee=issue.project.project_lead,
            workspace=issue.workspace,
            project=issue.project,
        )


@PostFunctionRegistry.register("clear_field")
def post_function_clear_field(issue: Any, actor: User, config: Dict[str, Any], transition: Any) -> None:
    """
    Clear a specific field on the issue.

    Config: {"field": "field_name"}
    """
    field_name = config.get("field")
    if not field_name:
        return

    if hasattr(issue, field_name):
        setattr(issue, field_name, None)
        issue.save(update_fields=[field_name])


@PostFunctionRegistry.register("update_field")
def post_function_update_field(issue: Any, actor: User, config: Dict[str, Any], transition: Any) -> None:
    """
    Update a specific field on the issue.

    Config: {"field": "field_name", "value": "new_value"}
    """
    field_name = config.get("field")
    value = config.get("value")

    if not field_name or value is None:
        return

    if hasattr(issue, field_name):
        setattr(issue, field_name, value)
        issue.save(update_fields=[field_name])


@PostFunctionRegistry.register("fire_event")
def post_function_fire_event(issue: Any, actor: User, config: Dict[str, Any], transition: Any) -> None:
    """
    Fire an automation event that can trigger automation rules.

    Config: {"event_name": "transition.completed", "data": {...}}
    """
    # This will integrate with the automation dispatcher when feature 03 is implemented
    # For now, this is a placeholder
    pass


@PostFunctionRegistry.register("webhook")
def post_function_webhook(issue: Any, actor: User, config: Dict[str, Any], transition: Any) -> None:
    """
    Send a webhook notification.

    Config: {"url": "https://...", "method": "POST", "headers": {...}, "body": {...}}
    Note: This will use the automation policy for webhook allowlist and sandboxing.
    """
    # This will integrate with the automation webhook system
    # For now, this is a placeholder
    pass


@PostFunctionRegistry.register("add_comment")
def post_function_add_comment(issue: Any, actor: User, config: Dict[str, Any], transition: Any) -> None:
    """
    Add a comment to the issue.

    Config: {"comment": "Comment text"} or {"comment_template": "template_key"}
    """
    from operoz.db.models import IssueComment

    comment_text = config.get("comment")
    if not comment_text:
        return

    IssueComment.objects.create(
        issue=issue,
        comment_html=comment_text,
        actor=actor,
        workspace=issue.workspace,
        project=issue.project,
    )


@PostFunctionRegistry.register("set_due_date")
def post_function_set_due_date(issue: Any, actor: User, config: Dict[str, Any], transition: Any) -> None:
    """
    Set the due date of the issue.

    Config: {"due_date": "2024-01-01"} or {"days_from_now": 7}
    """
    from datetime import datetime, timedelta

    due_date = config.get("due_date")
    days_from_now = config.get("days_from_now")

    if days_from_now:
        due_date = (timezone.now() + timedelta(days=days_from_now)).date()

    if due_date:
        if isinstance(due_date, str):
            due_date = datetime.strptime(due_date, "%Y-%m-%d").date()
        issue.target_date = due_date
        issue.save(update_fields=["target_date"])


def run_post_functions(issue: Any, actor: User, transition: Any) -> None:
    """
    Run all post-functions for a transition in order of sort_order.
    """
    post_functions = transition.post_functions.all().order_by("sort_order")

    for post_function in post_functions:
        func = PostFunctionRegistry.get(post_function.function_type)
        try:
            func(issue, actor, post_function.config, transition)
        except Exception as e:
            # Log error but continue with other post-functions
            # In production, this should be logged properly
            print(f"Post-function {post_function.function_type} failed: {e}")
