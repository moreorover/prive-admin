import { db } from "@prive-admin/db";
import { entityHistory } from "@prive-admin/db/schema/entity-history";

export async function recordChanges(opts: {
  entityType: "customer" | "hair_order";
  entityId: string;
  changedById: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}): Promise<void> {
  const rows: (typeof entityHistory.$inferInsert)[] = [];

  for (const key of Object.keys(opts.newValues)) {
    if (key === "updatedAt") continue;

    const oldVal = opts.oldValues[key];
    const newVal = opts.newValues[key];

    if (oldVal === newVal) continue;

    const oldStr = oldVal == null ? null : String(oldVal);
    const newStr = newVal == null ? null : String(newVal);

    if (oldStr === newStr) continue;

    rows.push({
      entityType: opts.entityType,
      entityId: opts.entityId,
      changedById: opts.changedById,
      fieldName: key,
      oldValue: oldStr,
      newValue: newStr,
    });
  }

  if (rows.length > 0) {
    await db.insert(entityHistory).values(rows);
  }
}
