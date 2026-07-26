export function getHairAssignedSource(item: { appointmentId?: string | null }) {
  return item.appointmentId ? { color: "blue", label: "Appointment" } : { color: "grape", label: "Individual" }
}
