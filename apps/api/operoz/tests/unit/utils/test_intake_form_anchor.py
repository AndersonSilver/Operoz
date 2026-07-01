from operoz.utils.intake_form_anchor import is_legacy_uuid_anchor, slugify_intake_form_anchor


def test_slugify_intake_form_anchor():
    assert slugify_intake_form_anchor("Chamado Sustentação") == "chamado-sustentacao"
    assert slugify_intake_form_anchor("   ") == "formulario"


def test_is_legacy_uuid_anchor():
    assert is_legacy_uuid_anchor("3b4fdf9ab3e48dfa8ee28352abf88a")
    assert not is_legacy_uuid_anchor("chamado-sustentacao")
    assert not is_legacy_uuid_anchor("chamado-sustentacao-2")
