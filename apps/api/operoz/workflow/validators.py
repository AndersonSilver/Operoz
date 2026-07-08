"""
Workflow Transition Validators Registry

Validators that check if a transition can be executed based on the provided data.
Each validator is a function that receives (issue, data, config) and returns
(errors: list[str]) - empty list means validation passed.
"""

from typing import Callable, Dict, Any, List


class ValidatorRegistry:
    """Registry for transition validators using Open/Closed principle"""

    _validators: Dict[str, Callable] = {}

    @classmethod
    def register(cls, validator_type: str):
        """Decorator to register a validator function"""

        def decorator(func: Callable):
            cls._validators[validator_type] = func
            return func

        return decorator

    @classmethod
    def get(cls, validator_type: str) -> Callable:
        """Get a validator function by type"""
        if validator_type not in cls._validators:
            raise ValueError(f"Unknown validator type: {validator_type}")
        return cls._validators[validator_type]

    @classmethod
    def all_types(cls) -> list[str]:
        """Return all registered validator types"""
        return list(cls._validators.keys())


# Register built-in validators


@ValidatorRegistry.register("required_fields")
def validator_required_fields(issue: Any, data: Dict[str, Any], config: Dict[str, Any]) -> List[str]:
    """
    Require specific fields to be present and non-empty.

    Config: {"fields": ["field_id1", "field_id2", ...]}
    """
    errors = []
    required_fields = config.get("fields", [])

    for field_id in required_fields:
        value = data.get(field_id)
        if value is None or value == "":
            errors.append(f"Field '{field_id}' is required")

    return errors


@ValidatorRegistry.register("has_comment")
def validator_has_comment(issue: Any, data: Dict[str, Any], config: Dict[str, Any]) -> List[str]:
    """
    Require a comment to be provided with the transition.

    Config: {} (empty)
    """
    comment = data.get("comment")
    if not comment or not comment.strip():
        return ["A comment is required for this transition"]

    return []


@ValidatorRegistry.register("regex")
def validator_regex(issue: Any, data: Dict[str, Any], config: Dict[str, Any]) -> List[str]:
    """
    Validate a field against a regex pattern.

    Config: {"field": "field_id", "pattern": "regex_pattern", "message": "error message"}
    """
    import re

    field_id = config.get("field")
    pattern = config.get("pattern")
    message = config.get("message", f"Field '{field_id}' does not match the required pattern")

    if not field_id or not pattern:
        return []

    value = data.get(field_id)
    if value is None or value == "":
        return []  # Skip validation if field is empty (use required_fields for that)

    if not re.match(pattern, str(value)):
        return [message]

    return []


@ValidatorRegistry.register("max_length")
def validator_max_length(issue: Any, data: Dict[str, Any], config: Dict[str, Any]) -> List[str]:
    """
    Validate that a field does not exceed maximum length.

    Config: {"field": "field_id", "max_length": 100}
    """
    field_id = config.get("field")
    max_length = config.get("max_length")

    if not field_id or not max_length:
        return []

    value = data.get(field_id)
    if value is None:
        return []

    if len(str(value)) > max_length:
        return [f"Field '{field_id}' must not exceed {max_length} characters"]

    return []


def run_validators(issue: Any, data: Dict[str, Any], transition: Any) -> List[str]:
    """
    Run all validators for a transition.

    Returns:
        List of error messages (empty if all validators pass)
    """
    all_errors = []

    for validator in transition.validators.all():
        validator_func = ValidatorRegistry.get(validator.validator_type)
        errors = validator_func(issue, data, validator.config)
        all_errors.extend(errors)

    return all_errors
