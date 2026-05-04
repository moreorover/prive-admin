import { Group, Select, Skeleton, Text } from "@mantine/core"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"

import { getActiveLegalEntityId } from "@/functions/get-active-legal-entity"
import { listLegalEntities } from "@/functions/legal-entities"
import { setActiveLegalEntity } from "@/functions/user-settings"
import { COUNTRY_FLAGS, type Country } from "@/lib/legal-entity"

const ALL_VALUE = "__all__"

export function LegalEntitySwitcher() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const legalEntitiesQuery = useQuery({
    queryKey: ["legal-entities"],
    queryFn: () => listLegalEntities(),
  })
  const activeQuery = useQuery({
    queryKey: ["active-legal-entity"],
    queryFn: () => getActiveLegalEntityId(),
  })

  const setActive = useMutation({
    mutationFn: (legalEntityId: string | null) => setActiveLegalEntity({ data: { legalEntityId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["active-legal-entity"] })
      router.invalidate()
    },
  })

  if (legalEntitiesQuery.isPending || activeQuery.isPending) {
    return <Skeleton height={32} width={200} />
  }
  if (legalEntitiesQuery.isError || activeQuery.isError) {
    return (
      <Text size="sm" c="red">
        LE switcher failed
      </Text>
    )
  }

  const data = [
    { value: ALL_VALUE, label: "All legal entities" },
    ...legalEntitiesQuery.data.map((le) => ({
      value: le.id,
      label: `${COUNTRY_FLAGS[le.country as Country] ?? ""} ${le.name}`,
    })),
  ]

  const value = activeQuery.data ?? ALL_VALUE

  return (
    <Group gap="xs" wrap="nowrap">
      <Select
        size="sm"
        w={220}
        data={data}
        value={value}
        onChange={(next) => {
          if (next === null) return
          setActive.mutate(next === ALL_VALUE ? null : next)
        }}
        allowDeselect={false}
        aria-label="Active legal entity"
      />
    </Group>
  )
}
