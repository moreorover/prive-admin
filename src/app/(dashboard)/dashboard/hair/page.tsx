import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrateClient } from "@/trpc/server";
import { HairsView } from "@/modules/hair/ui/views/HairsView";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return (
    <HydrateClient>
      <HairsView />
    </HydrateClient>
  );
}
