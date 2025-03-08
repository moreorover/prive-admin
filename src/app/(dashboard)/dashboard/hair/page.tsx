import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrateClient, trpc } from "@/trpc/server";
import { HairsView } from "@/modules/hair/ui/views/HairsView";

interface Props {
  searchParams: Promise<{
    color?: string;
    description?: string;
    upc?: string;
    length?: number;
    weight?: number;
  }>;
}

export default async function Page({ searchParams }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const sp = await searchParams;

  const parsedSearchParams = {
    ...sp,
    length: sp.length ? Number(sp.length) : undefined,
    weight: sp.weight ? Number(sp.weight) : undefined,
  };

  void trpc.hair.getAll.prefetch({ ...parsedSearchParams });

  return (
    <HydrateClient>
      <HairsView searchParams={parsedSearchParams} />
    </HydrateClient>
  );
}
