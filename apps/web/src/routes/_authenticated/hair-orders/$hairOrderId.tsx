import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"

import { useHairAssignmentActions } from "../-actions/hair-assignment-actions"
import { useHairOrderDetailActions } from "./-actions/hair-order-actions"
import { HairOrderDetailPage } from "./-components/hair-order-id-page"
import {
  availableHairOrdersListQueryOptions,
  hairOrderDetailQueryOptions,
  useHairOrderDetailData,
} from "./-data/hair-order-detail-data"

export const Route = createFileRoute("/_authenticated/hair-orders/$hairOrderId")({
  component: routeComponent,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(hairOrderDetailQueryOptions(params.hairOrderId)),
      context.queryClient.prefetchQuery(availableHairOrdersListQueryOptions()),
    ])
  },
})

function routeComponent() {
  const { hairOrderId } = Route.useParams()
  const [editItem, setEditItem] = useState<HairAssignedRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedRow | null>(null)
  const detailData = useHairOrderDetailData(hairOrderId)
  const relatedQueryKeys = [
    { queryKey: detailData.hairOrderQueryOptions.queryKey },
    ...detailData.assignedClientSummaryKeys,
  ]
  const { recalculatePrices, updateHairOrder } = useHairOrderDetailActions({
    hairOrderId,
    invalidateKeys: relatedQueryKeys,
  })
  const { createHairAssigned, updateHairAssigned, deleteHairAssigned } = useHairAssignmentActions({
    invalidateKeys: relatedQueryKeys,
    selectedEditItem: editItem,
    selectedDeleteItem: deleteItem,
  })

  return (
    <HairOrderDetailPage
      detailData={detailData}
      editItem={editItem}
      deleteItem={deleteItem}
      recalculatePending={recalculatePrices.isPending}
      updateOrderPending={updateHairOrder.isPending}
      createPending={createHairAssigned.isPending}
      updatePending={updateHairAssigned.isPending}
      deletePending={deleteHairAssigned.isPending}
      onEditItemChange={setEditItem}
      onDeleteItemChange={setDeleteItem}
      onRecalculate={() => recalculatePrices.mutate({ hairOrderId })}
      onUpdateOrder={(values) => updateHairOrder.mutate(values)}
      onCreate={(values) => createHairAssigned.mutate(values)}
      onUpdate={(values) => updateHairAssigned.mutate(values)}
      onDelete={(id) => deleteHairAssigned.mutate({ id })}
    />
  )
}
