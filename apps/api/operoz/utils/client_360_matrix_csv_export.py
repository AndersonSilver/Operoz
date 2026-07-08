from __future__ import annotations

import csv
import io


def build_client360_matrix_csv_content(
    *,
    clients: list[dict],
    weeks: list[dict],
    delimiter: str = ",",
) -> str:
    output = io.StringIO()
    writer = csv.writer(output, delimiter=delimiter, lineterminator="\n")
    header = [
        "client",
        "identifier",
        "board",
        "week_start",
        "week_end",
        "coverage",
        "modules_total",
        "modules_published",
    ]
    writer.writerow(header)
    for client in clients:
        cells_by_start = {cell["period_start"]: cell for cell in client.get("cells") or []}
        for week in weeks:
            cell = cells_by_start.get(week["period_start"])
            if not cell:
                continue
            writer.writerow(
                [
                    client.get("name") or "",
                    client.get("identifier") or "",
                    (client.get("board") or {}).get("name") or "",
                    week["period_start"],
                    week["period_end"],
                    cell.get("coverage") or "",
                    cell.get("modules_total") or 0,
                    cell.get("modules_published") or 0,
                ]
            )
    return output.getvalue()


def matrix_csv_filename(workspace_slug: str, anchor_period_end: str) -> str:
    safe = workspace_slug.replace(" ", "-")
    return f"{safe}-visao-360-matriz-{anchor_period_end}"
