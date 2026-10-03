import { trpc } from "@/utils/trpc"

export function salonQueryOptions(salonId: string) {
  return trpc.salons.get.queryOptions({ id: salonId })
}
