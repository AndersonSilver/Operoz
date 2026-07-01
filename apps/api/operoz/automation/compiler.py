from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class CompiledNode:
    id: str
    kind: str
    catalog_key: str
    config: dict[str, Any]
    next_ids: list[str] = field(default_factory=list)


@dataclass
class CompiledEdge:
    id: str
    source: str
    target: str
    source_handle: str | None = None
    target_handle: str | None = None


@dataclass
class CompiledGraph:
    trigger: CompiledNode
    nodes: dict[str, CompiledNode]
    edges: list[CompiledEdge]
    execution_order: list[str]


def compile_graph(graph: dict[str, Any]) -> CompiledGraph:
    nodes_raw = graph.get("nodes") or []
    edges_raw = graph.get("edges") or []
    if not nodes_raw:
        raise ValueError("Grafo vazio")

    adjacency: dict[str, list[str]] = {n["id"]: [] for n in nodes_raw}
    compiled_edges: list[CompiledEdge] = []
    for edge in edges_raw:
        src = edge.get("source")
        tgt = edge.get("target")
        if src and tgt and src in adjacency:
            adjacency[src].append(tgt)
            compiled_edges.append(
                CompiledEdge(
                    id=edge.get("id") or f"{src}-{tgt}",
                    source=src,
                    target=tgt,
                    source_handle=edge.get("sourceHandle") or edge.get("source_handle"),
                    target_handle=edge.get("targetHandle") or edge.get("target_handle"),
                )
            )

    nodes: dict[str, CompiledNode] = {}
    trigger_node: CompiledNode | None = None
    for raw in nodes_raw:
        data = raw.get("data") or {}
        kind = data.get("kind") or raw.get("type", "")
        catalog_key = data.get("catalog_key") or data.get("key") or ""
        node = CompiledNode(
            id=raw["id"],
            kind=kind,
            catalog_key=catalog_key,
            config=data.get("config") or {},
            next_ids=adjacency.get(raw["id"], []),
        )
        nodes[node.id] = node
        if kind == "trigger":
            trigger_node = node

    if not trigger_node:
        raise ValueError("Grafo precisa de um nó trigger")

    execution_order: list[str] = []
    visited: set[str] = set()

    def walk(node_id: str) -> None:
        if node_id in visited:
            return
        visited.add(node_id)
        node = nodes.get(node_id)
        if not node:
            return
        if node.kind != "trigger":
            execution_order.append(node_id)
        for nxt in node.next_ids:
            walk(nxt)

    walk(trigger_node.id)

    return CompiledGraph(
        trigger=trigger_node,
        nodes=nodes,
        edges=compiled_edges,
        execution_order=execution_order,
    )


def get_outgoing_targets(
    compiled: CompiledGraph,
    node_id: str,
    *,
    source_handle: str | None = None,
) -> list[str]:
    targets: list[str] = []
    for edge in compiled.edges:
        if edge.source != node_id:
            continue
        if source_handle is not None:
            if edge.source_handle == source_handle:
                targets.append(edge.target)
        elif not edge.source_handle:
            targets.append(edge.target)
    return targets


def get_parallel_branch_targets(compiled: CompiledGraph, node_id: str) -> list[tuple[str | None, str]]:
    """Retorna (source_handle, target_id) para todos os ramos de um fan-out."""
    pairs: list[tuple[str | None, str]] = []
    for edge in compiled.edges:
        if edge.source == node_id:
            pairs.append((edge.source_handle, edge.target))
    return pairs
