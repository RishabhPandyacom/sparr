"""In-memory `Database` used by the tests: no network, no Supabase."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone


class MemoryDB:
    def __init__(self) -> None:
        self.tables: dict[str, list[dict]] = {}

    @staticmethod
    def _match(row, filters):
        return all(str(row.get(k)) == str(v) for k, v in (filters or {}).items())

    async def select(self, table, *, filters=None, order=None, limit=None):
        rows = [dict(r) for r in self.tables.get(table, []) if self._match(r, filters)]
        if order:
            column, _, direction = order.partition(".")
            rows.sort(key=lambda r: str(r.get(column)), reverse=direction == "desc")
        return rows[:limit] if limit else rows

    async def insert(self, table, row):
        now = datetime.now(timezone.utc).isoformat()
        stored = {
            "id": str(uuid.uuid4()),
            "created_at": now,
            "updated_at": now,
            "current_step": 1,
            "status": "draft",
            "resume_data": {},
            "salary_data": {},
            "plan": None,
            "readiness_score": None,
            **row,
        }
        self.tables.setdefault(table, []).append(stored)
        return dict(stored)

    async def update(self, table, filters, values):
        out = []
        for row in self.tables.get(table, []):
            if self._match(row, filters):
                row.update(values)
                row["updated_at"] = datetime.now(timezone.utc).isoformat()
                out.append(dict(row))
        return out

    async def delete(self, table, filters):
        rows = self.tables.get(table, [])
        keep = [r for r in rows if not self._match(r, filters)]
        removed = len(rows) - len(keep)
        self.tables[table] = keep
        return removed
