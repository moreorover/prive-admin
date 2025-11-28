// lib/history.ts
import { db } from "@prive-admin/db";
import { entityHistory } from "@prive-admin/db/schema/entityHistory";
import { and, desc, eq } from "drizzle-orm";

type EntityType = "contact" | "booking" | "hair_order" | "hair_assigned";

export interface HistoryGroup {
  changedBy: { id: string; name: string; email: string };
  changedAt: Date;
  changes: Array<{
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
  }>;
}

/**
 * Fetch and group history records for any entity
 * Groups changes by user and timestamp (same transaction = same group)
 */
export async function getEntityHistory(
  entityType: EntityType,
  entityId: string,
): Promise<HistoryGroup[]> {
  // Fetch all history records for this entity from unified history table
  // Filter by entity type and specific entity ID
  // Sort by most recent first (newest changes at top)
  // Include user details who made each change via relation
  const records = await db.query.entityHistory.findMany({
    where: and(
      eq(entityHistory.entityType, entityType),
      eq(entityHistory.entityId, entityId),
    ),
    orderBy: desc(entityHistory.changedAt),
    with: {
      changedBy: {
        columns: { id: true, name: true, email: true },
      },
    },
  });

  // Group records by user and timestamp
  // Since updates happen in transactions, all field changes from one update
  // will have the exact same timestamp and user
  // We group them to show as a single "edit event" in the UI
  const grouped: Record<string, HistoryGroup> = {};

  for (const record of records) {
    // Create unique key from userId and timestamp
    // This ensures changes from same user at same time are grouped together
    const key = `${record.changedById}-${record.changedAt}`;

    // If this key doesn't exist yet, create a new group
    if (!grouped[key]) {
      grouped[key] = {
        changedBy: record.changedBy, // User who made the change
        changedAt: record.changedAt, // When the change happened
        changes: [], // Array to hold all field changes in this group
      };
    }

    // Add this field change to the group
    grouped[key].changes.push({
      fieldName: record.fieldName, // Which field was changed
      oldValue: record.oldValue, // Previous value
      newValue: record.newValue, // New value
    });
  }

  // Convert grouped object to array for easier iteration in UI
  // Each array item represents one "edit session" with multiple field changes
  return Object.values(grouped);
}

/**
 * Track field changes in history during updates
 * Call this for each field that changed
 */
export async function trackFieldChange(
  tx: any, // Transaction instance
  entityType: EntityType,
  entityId: string,
  changedById: string,
  fieldName: string,
  oldValue: string | null | undefined,
  newValue: string | null | undefined,
) {
  await tx.insert(entityHistory).values({
    entityType,
    entityId,
    changedById,
    fieldName,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
  });
}
