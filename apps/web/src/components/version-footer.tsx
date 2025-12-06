import { AlertCircle } from "lucide-react";
import { trpc } from "@/utils/trpc";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {useQuery} from "@tanstack/react-query";

export function VersionFooter() {
	const frontendVersion = import.meta.env.VITE_APP_VERSION;

  const { data: backendData, isLoading, isError } = useQuery(
    trpc.version.get.queryOptions(),
  );

	const backendVersion = backendData?.version ?? "unknown";
	const hasMismatch =
		!isLoading &&
		!isError &&
		frontendVersion !== backendVersion &&
		backendVersion !== "unknown";

	return (
		<div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
			<span>v{frontendVersion}</span>

			{hasMismatch && (
				<Tooltip>
					<TooltipTrigger asChild>
						<AlertCircle className="h-3.5 w-3.5 text-amber-500" />
					</TooltipTrigger>
					<TooltipContent side="top" className="max-w-xs">
						<p>Version mismatch detected</p>
						<p className="text-muted-foreground mt-1">
							Frontend: v{frontendVersion}
							<br />
							Backend: v{backendVersion}
						</p>
						<p className="text-muted-foreground mt-1">
							Please refresh the page to get the latest version.
						</p>
					</TooltipContent>
				</Tooltip>
			)}

			{isLoading && (
				<span className="text-muted-foreground/50">checking...</span>
			)}

			{isError && !isLoading && (
				<Tooltip>
					<TooltipTrigger asChild>
						<AlertCircle className="h-3.5 w-3.5 text-destructive cursor-help" />
					</TooltipTrigger>
					<TooltipContent side="top">
						<p>Failed to check backend version</p>
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
}
