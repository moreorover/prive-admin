import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HistoryGroup {
  changedBy: { id: string; name: string; email: string };
  changedAt: Date;
  changes: Array<{
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
  }>;
}

interface EntityHistoryCardProps {
  history: HistoryGroup[] | undefined;
  title?: string;
}

export function EntityHistoryCard({
  history,
  title = "Change History",
}: EntityHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!history || history.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            No changes recorded
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((group, index) => (
              <div key={index} className="border-muted border-l-2 pl-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{group.changedBy.name}</span>
                    <Badge variant="secondary">{group.changedBy.email}</Badge>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {format(new Date(group.changedAt), "PPpp")}
                  </div>
                </div>
                <div className="space-y-1">
                  {group.changes.map((change, changeIndex) => (
                    <div key={changeIndex} className="text-sm">
                      <span className="font-medium capitalize">
                        {change.fieldName}:
                      </span>{" "}
                      <span className="text-muted-foreground line-through">
                        {change.oldValue || "empty"}
                      </span>{" "}
                      →{" "}
                      <span className="text-green-600">
                        {change.newValue || "empty"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
