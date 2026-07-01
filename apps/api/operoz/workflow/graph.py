"""
Graph utilities for Workflow Engine

Converts between:
- Graph representation (JSON with nodes/edges) used by the visual editor
- Database models (Workflow, WorkflowTransition, etc.)
"""

from typing import Dict, Any, List
from django.db import transaction
from django.contrib.auth import get_user_model

from operoz.db.models import (
    Workflow,
    WorkflowTransition,
    TransitionCondition,
    TransitionValidator,
    TransitionPostFunction,
    TransitionScreen,
    State,
)

User = get_user_model()

STATE_GROUP_ORDER = {
    "backlog": 0,
    "unstarted": 1,
    "started": 2,
    "completed": 3,
    "cancelled": 4,
}

LAYOUT_COLUMNS = 4
LAYOUT_X_STEP = 280
LAYOUT_Y_STEP = 140


def default_node_position(index: int) -> Dict[str, float]:
    """Spread nodes on a grid so bootstrap/open workflows are readable in the editor."""
    column = index % LAYOUT_COLUMNS
    row = index // LAYOUT_COLUMNS
    return {"x": float(column * LAYOUT_X_STEP), "y": float(row * LAYOUT_Y_STEP)}


def layout_nodes_by_state_group(states: List[State]) -> Dict[Any, Dict[str, float]]:
    """Return state_id -> position for a stable left-to-right workflow layout."""
    ordered = sorted(
        states,
        key=lambda state: (
            STATE_GROUP_ORDER.get(state.group, 99),
            state.sequence,
            state.name.lower(),
        ),
    )
    return {state.id: default_node_position(index) for index, state in enumerate(ordered)}


def merge_editor_layout(computed: Dict[str, Any], layout_source: Dict[str, Any]) -> Dict[str, Any]:
    """Apply saved editor positions (and edge styling) onto a graph built from DB models."""
    layout_nodes = layout_source.get("nodes") or []
    positions_by_id = {node.get("id"): node.get("position") for node in layout_nodes if node.get("id")}
    positions_by_state = {
        str(node.get("data", {}).get("state_id")): node.get("position")
        for node in layout_nodes
        if node.get("data", {}).get("state_id")
    }

    for node in computed.get("nodes", []):
        position = positions_by_id.get(node.get("id"))
        if not position:
            state_id = node.get("data", {}).get("state_id")
            if state_id:
                position = positions_by_state.get(str(state_id))
        if position:
            node["position"] = position

    layout_edges = layout_source.get("edges") or []
    edge_meta_by_pair = {
        (edge.get("source"), edge.get("target")): edge
        for edge in layout_edges
        if edge.get("source") and edge.get("target")
    }

    for edge in computed.get("edges", []):
        layout_edge = edge_meta_by_pair.get((edge.get("source"), edge.get("target")))
        if not layout_edge:
            continue
        if layout_edge.get("type"):
            edge["type"] = layout_edge["type"]
        layout_data = layout_edge.get("data") or {}
        edge_data = edge.setdefault("data", {})
        if layout_data.get("pathOffset") is not None:
            edge_data["pathOffset"] = layout_data["pathOffset"]

    return computed


def build_graph_from_models(workflow: Workflow) -> Dict[str, Any]:
    """
    Convert workflow models to graph representation for the visual editor.
    
    Args:
        workflow: The Workflow model instance
    
    Returns:
        Dict with "nodes" and "edges" arrays
    """
    nodes = []
    edges = []
    
    # Create nodes from states
    # Note: States are not stored in the workflow, they're referenced by transitions
    # We need to collect all unique states from transitions
    state_ids = set()
    for transition in workflow.transitions.all():
        if transition.from_state:
            state_ids.add(transition.from_state.id)
        if transition.to_state:
            state_ids.add(transition.to_state.id)
    
    # Add initial state if set
    if workflow.initial_state:
        state_ids.add(workflow.initial_state.id)

    states: List[State] = []
    for state_id in state_ids:
        try:
            states.append(State.objects.get(id=state_id))
        except State.DoesNotExist:
            continue

    positions = layout_nodes_by_state_group(states)

    # Create nodes for each state
    for state in states:
        nodes.append({
            "id": f"state-{state.id}",
            "type": "state",
            "position": positions.get(state.id, default_node_position(0)),
            "data": {
                "state_id": str(state.id),
                "name": state.name,
                "color": state.color,
                "group": state.group,
                "is_initial": workflow.initial_state_id == state.id if workflow.initial_state_id else False,
            }
        })
    
    # Create edges from transitions
    for transition in workflow.transitions.all():
        from_state_id = str(transition.from_state.id) if transition.from_state else None
        to_state_id = str(transition.to_state.id)
        
        edge_data = {
            "name": transition.name,
            "is_global": transition.is_global,
            "conditions": [
                {
                    "condition_type": c.condition_type,
                    "config": c.config
                }
                for c in transition.conditions.all()
            ],
            "validators": [
                {
                    "validator_type": v.validator_type,
                    "config": v.config
                }
                for v in transition.validators.all()
            ],
            "post_functions": [
                {
                    "function_type": pf.function_type,
                    "config": pf.config,
                    "sort_order": pf.sort_order
                }
                for pf in transition.post_functions.all()
            ],
        }
        
        # Add screen if exists
        if hasattr(transition, 'screen') and transition.screen:
            edge_data["screen"] = {
                "fields": transition.screen.fields
            }
        
        if from_state_id:
            edges.append({
                "id": f"transition-{transition.id}",
                "source": f"state-{from_state_id}",
                "target": f"state-{to_state_id}",
                "type": "transition",
                "data": edge_data
            })
        else:
            # Global transition - create a special edge
            edges.append({
                "id": f"transition-{transition.id}",
                "source": "global",
                "target": f"state-{to_state_id}",
                "type": "transition",
                "data": edge_data
            })
    
    return {
        "nodes": nodes,
        "edges": edges
    }


def models_to_graph(workflow: Workflow) -> Dict[str, Any]:
    """
    Convert workflow models to graph representation for the visual editor.

    Node positions come from ``workflow.draft_graph`` when present; otherwise a
    default left-to-right layout is applied.
    """
    graph = build_graph_from_models(workflow)
    if workflow.draft_graph:
        graph = merge_editor_layout(graph, workflow.draft_graph)
    return graph


def graph_to_models(workflow: Workflow, graph: Dict[str, Any], user: User) -> None:
    """
    Convert graph representation to workflow models.
    
    This is a destructive operation - it replaces all transitions in the workflow
    with the ones from the graph.
    
    Args:
        workflow: The Workflow model instance to update
        graph: Dict with "nodes" and "edges" arrays
        user: The user making the changes (for audit)
    
    Raises:
        ValueError: If graph is invalid or states don't exist
    """
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    
    # Validate that all referenced states exist and belong to the same workspace
    state_ids = set()
    for node in nodes:
        state_id = node.get("data", {}).get("state_id")
        if state_id:
            state_ids.add(state_id)
    
    for edge in edges:
        target = edge.get("target", "")
        if target.startswith("state-"):
            state_id = target.replace("state-", "")
            state_ids.add(state_id)
    
    # Verify all states exist and belong to the workspace
    for state_id in state_ids:
        try:
            state = State.objects.get(id=state_id)
            if state.project.workspace != workflow.workspace:
                raise ValueError(f"State {state.name} belongs to a different workspace")
        except State.DoesNotExist:
            raise ValueError(f"State with id {state_id} does not exist")
    
    with transaction.atomic():
        # Delete existing transitions
        workflow.transitions.all().delete()
        
        # Create transitions from edges
        for edge in edges:
            edge_data = edge.get("data", {})
            
            # Get source and target states
            target = edge.get("target", "")
            source = edge.get("source", "")
            
            if not target.startswith("state-"):
                continue
            
            to_state_id = target.replace("state-", "")
            from_state_id = None
            
            if source.startswith("state-"):
                from_state_id = source.replace("state-", "")
            elif source != "global":
                continue
            
            # Get state objects
            try:
                to_state = State.objects.get(id=to_state_id)
                from_state = State.objects.get(id=from_state_id) if from_state_id else None
            except State.DoesNotExist:
                continue
            
            # Create transition
            transition = WorkflowTransition.objects.create(
                workflow=workflow,
                from_state=from_state,
                to_state=to_state,
                name=edge_data.get("name", "Transition"),
                is_global=edge_data.get("is_global", False),
                sort_order=edge_data.get("sort_order", 10000),
                created_by=user,
                updated_by=user,
            )
            
            # Create conditions
            for condition_data in edge_data.get("conditions", []):
                TransitionCondition.objects.create(
                    transition=transition,
                    condition_type=condition_data.get("condition_type"),
                    config=condition_data.get("config", {}),
                    created_by=user,
                    updated_by=user,
                )
            
            # Create validators
            for validator_data in edge_data.get("validators", []):
                TransitionValidator.objects.create(
                    transition=transition,
                    validator_type=validator_data.get("validator_type"),
                    config=validator_data.get("config", {}),
                    created_by=user,
                    updated_by=user,
                )
            
            # Create post-functions
            for pf_data in edge_data.get("post_functions", []):
                TransitionPostFunction.objects.create(
                    transition=transition,
                    function_type=pf_data.get("function_type"),
                    config=pf_data.get("config", {}),
                    sort_order=pf_data.get("sort_order", 10000),
                    created_by=user,
                    updated_by=user,
                )
            
            # Create screen if present
            screen_data = edge_data.get("screen")
            if screen_data:
                TransitionScreen.objects.create(
                    transition=transition,
                    fields=screen_data.get("fields", []),
                    created_by=user,
                    updated_by=user,
                )
        
        # Set initial state if specified in nodes
        # Look for a node marked as initial (this would be set by the editor)
        for node in nodes:
            if node.get("data", {}).get("is_initial"):
                state_id = node.get("data", {}).get("state_id")
                try:
                    initial_state = State.objects.get(id=state_id)
                    workflow.initial_state = initial_state
                    workflow.save(update_fields=["initial_state"])
                except State.DoesNotExist:
                    pass

        # Persist editor layout (node positions, edge styling)
        base_graph = build_graph_from_models(workflow)
        workflow.draft_graph = merge_editor_layout(base_graph, graph)
        workflow.save(update_fields=["draft_graph", "updated_at"])


def validate_graph(graph: Dict[str, Any]) -> List[str]:
    """
    Validate a workflow graph for consistency.
    
    Args:
        graph: Dict with "nodes" and "edges" arrays
    
    Returns:
        List of error messages (empty if valid)
    """
    errors = []
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    
    # Check that there's at least one node
    if not nodes:
        errors.append("Workflow must have at least one state")
    
    # Check that there's at least one initial state
    initial_nodes = [n for n in nodes if n.get("data", {}).get("is_initial")]
    if len(initial_nodes) == 0:
        errors.append("Workflow must have exactly one initial state")
    elif len(initial_nodes) > 1:
        errors.append("Workflow must have exactly one initial state")
    
    # Check that all edges have valid source/target
    node_ids = {n.get("id") for n in nodes}
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        
        if target not in node_ids and not target.startswith("state-"):
            errors.append(f"Edge {edge.get('id')} has invalid target: {target}")
        
        if source != "global" and source not in node_ids and not source.startswith("state-"):
            errors.append(f"Edge {edge.get('id')} has invalid source: {source}")
    
    # Check that all states are reachable (basic check)
    if nodes:
        # Collect all states that have incoming edges
        reachable_state_ids = set()
        for edge in edges:
            target = edge.get("target", "")
            if target.startswith("state-"):
                reachable_state_ids.add(target.replace("state-", ""))
        
        # Initial state should be reachable if there are transitions
        if initial_nodes and edges:
            initial_state_id = initial_nodes[0].get("data", {}).get("state_id")
            if initial_state_id not in reachable_state_ids:
                # This is only an error if there are outgoing transitions from initial
                has_outgoing = any(
                    e.get("source", "").startswith(f"state-{initial_state_id}")
                    for e in edges
                )
                if not has_outgoing:
                    errors.append("Initial state has no outgoing transitions")
    
    return errors
