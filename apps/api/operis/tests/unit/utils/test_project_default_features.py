from operis.utils.project_default_features import (
    DEFAULT_PROJECT_FEATURE_FIELDS,
    apply_default_project_features,
)


def test_apply_default_project_features_fills_missing():
    data = {"name": "Cliente X"}
    apply_default_project_features(data)
    for field, value in DEFAULT_PROJECT_FEATURE_FIELDS.items():
        assert data[field] is value


def test_apply_default_project_features_respects_explicit_false():
    data = {"cycle_view": False}
    apply_default_project_features(data)
    assert data["cycle_view"] is False
    assert data["module_view"] is True
