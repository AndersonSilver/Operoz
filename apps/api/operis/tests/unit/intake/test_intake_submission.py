import pytest

from operis.db.models.intake_form import default_intake_form_fields
from operis.utils.intake_submission import (
    IntakeSubmissionError,
    _normalize_uuid_list,
    _validate_submission_fields,
)


class _FormStub:
    fields = default_intake_form_fields()


def test_validate_submission_requires_name():
    with pytest.raises(IntakeSubmissionError) as exc:
        _validate_submission_fields(_FormStub(), {"field-description": "Detalhe"})
    assert "field-name" in exc.value.field_errors


def test_validate_submission_maps_name_and_description():
    parsed = _validate_submission_fields(
        _FormStub(),
        {
            "field-name": "Pedido Webapp",
            "field-description": "Descrição do pedido",
        },
    )
    assert parsed["issue"]["name"] == "Pedido Webapp"
    assert "Descrição do pedido" in parsed["issue"]["description_html"]


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        (None, []),
        ("", []),
        ([], []),
        ("0d5e245b-64ae-4987-a4da-1193e6fb84d1", ["0d5e245b-64ae-4987-a4da-1193e6fb84d1"]),
        (["a", "b"], ["a", "b"]),
    ],
)
def test_normalize_uuid_list_accepts_scalar_or_list(raw, expected):
    assert _normalize_uuid_list(raw) == expected
