import pytest

from operoz.workflow.graph import (
    default_node_position,
    layout_nodes_by_state_group,
    merge_editor_layout,
    validate_graph,
)


@pytest.mark.unit
def test_default_node_position_spreads_on_grid():
    assert default_node_position(0) == {"x": 0.0, "y": 0.0}
    assert default_node_position(1) == {"x": 280.0, "y": 0.0}
    assert default_node_position(4) == {"x": 0.0, "y": 140.0}


@pytest.mark.unit
def test_layout_nodes_by_state_group_orders_by_group():
    class FakeState:
        def __init__(self, state_id, group, sequence, name):
            self.id = state_id
            self.group = group
            self.sequence = sequence
            self.name = name

    states = [
        FakeState("done", "completed", 4, "Done"),
        FakeState("todo", "unstarted", 2, "Todo"),
        FakeState("backlog", "backlog", 1, "Backlog"),
    ]
    positions = layout_nodes_by_state_group(states)
    assert positions["backlog"]["x"] < positions["todo"]["x"] < positions["done"]["x"]


@pytest.mark.unit
def test_merge_editor_layout_preserves_custom_positions():
    computed = {
        "nodes": [
            {"id": "state-1", "data": {"state_id": "1"}, "position": {"x": 0, "y": 0}},
            {"id": "state-2", "data": {"state_id": "2"}, "position": {"x": 280, "y": 0}},
        ],
        "edges": [
            {"id": "edge-1", "source": "state-1", "target": "state-2", "type": "transition"},
        ],
    }
    layout_source = {
        "nodes": [
            {"id": "state-1", "data": {"state_id": "1"}, "position": {"x": 120, "y": 340}},
            {"id": "state-2", "data": {"state_id": "2"}, "position": {"x": 520, "y": 80}},
        ],
        "edges": [
            {"source": "state-1", "target": "state-2", "type": "step"},
        ],
    }

    merged = merge_editor_layout(computed, layout_source)

    assert merged["nodes"][0]["position"] == {"x": 120, "y": 340}
    assert merged["nodes"][1]["position"] == {"x": 520, "y": 80}
    assert merged["edges"][0]["type"] == "step"


@pytest.mark.unit
def test_validate_graph_requires_initial_state():
    graph = {
        "nodes": [
            {"id": "state-1", "data": {"state_id": "1", "is_initial": False}},
        ],
        "edges": [],
    }
    errors = validate_graph(graph)
    assert any("initial state" in err.lower() for err in errors)


@pytest.mark.unit
def test_validate_graph_accepts_single_initial_node():
    graph = {
        "nodes": [
            {"id": "state-1", "data": {"state_id": "1", "is_initial": True}},
        ],
        "edges": [],
    }
    errors = validate_graph(graph)
    assert errors == []


@pytest.mark.unit
def test_validate_graph_rejects_multiple_initial_states():
    graph = {
        "nodes": [
            {"id": "state-1", "data": {"state_id": "1", "is_initial": True}},
            {"id": "state-2", "data": {"state_id": "2", "is_initial": True}},
        ],
        "edges": [],
    }
    errors = validate_graph(graph)
    assert any("exactly one initial" in err.lower() for err in errors)
