import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrateClient, trpc } from "@/trpc/server";
import { HairView } from "@/modules/hair/ui/views/HairView";

type Props = {
  params: Promise<{ hairId: string }>;
};

export default async function Page({ params }: Props) {
  const { hairId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  void trpc.hair.getById.prefetch({ hairId });

  return (
    <HydrateClient>
      <HairView hairId={hairId} />
    </HydrateClient>
  );
}
