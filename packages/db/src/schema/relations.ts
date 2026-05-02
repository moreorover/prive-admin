import { relations } from "drizzle-orm"

import { appointment, personnelOnAppointments } from "./appointment"
import { user, session, account } from "./auth"
import { customer } from "./customer"
import { hairAssigned, hairOrder } from "./hair"
import { note } from "./note"
import { userSettings } from "./user-settings"
import { order, orderItem } from "./order"
import { product, productVariant } from "./product"
import { transaction } from "./transaction"

// Auth relations
export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  hairOrdersCreated: many(hairOrder),
  hairAssignedCreated: many(hairAssigned),
  notesCreated: many(note),
  settings: one(userSettings, { fields: [user.id], references: [userSettings.userId] }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

// Customer relations
export const customerRelations = relations(customer, ({ many }) => ({
  orders: many(order),
  transactions: many(transaction),
  appointmentsAsCustomer: many(appointment),
  appointmentsAsPersonnel: many(personnelOnAppointments),
  hairOrders: many(hairOrder),
  hairAssigned: many(hairAssigned),
  notes: many(note),
}))

// Product relations
export const productRelations = relations(product, ({ many }) => ({
  variants: many(productVariant),
}))

export const productVariantRelations = relations(productVariant, ({ one, many }) => ({
  product: one(product, { fields: [productVariant.productId], references: [product.id] }),
  items: many(orderItem),
}))

// Order relations
export const orderRelations = relations(order, ({ one, many }) => ({
  customer: one(customer, { fields: [order.customerId], references: [customer.id] }),
  items: many(orderItem),
  transactions: many(transaction),
}))

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, { fields: [orderItem.orderId], references: [order.id] }),
  productVariant: one(productVariant, { fields: [orderItem.productVariantId], references: [productVariant.id] }),
}))

// Appointment relations
export const appointmentRelations = relations(appointment, ({ one, many }) => ({
  client: one(customer, { fields: [appointment.clientId], references: [customer.id] }),
  personnel: many(personnelOnAppointments),
  transactions: many(transaction),
  hairAssigned: many(hairAssigned),
  notes: many(note),
}))

export const personnelOnAppointmentsRelations = relations(personnelOnAppointments, ({ one }) => ({
  appointment: one(appointment, { fields: [personnelOnAppointments.appointmentId], references: [appointment.id] }),
  personnel: one(customer, { fields: [personnelOnAppointments.personnelId], references: [customer.id] }),
}))

// Transaction relations
export const transactionRelations = relations(transaction, ({ one }) => ({
  customer: one(customer, { fields: [transaction.customerId], references: [customer.id] }),
  order: one(order, { fields: [transaction.orderId], references: [order.id] }),
  appointment: one(appointment, { fields: [transaction.appointmentId], references: [appointment.id] }),
}))

// Hair relations
export const hairOrderRelations = relations(hairOrder, ({ one, many }) => ({
  customer: one(customer, { fields: [hairOrder.customerId], references: [customer.id] }),
  createdBy: one(user, { fields: [hairOrder.createdById], references: [user.id] }),
  hairAssigned: many(hairAssigned),
  notes: many(note),
}))

export const hairAssignedRelations = relations(hairAssigned, ({ one }) => ({
  appointment: one(appointment, { fields: [hairAssigned.appointmentId], references: [appointment.id] }),
  hairOrder: one(hairOrder, { fields: [hairAssigned.hairOrderId], references: [hairOrder.id] }),
  client: one(customer, { fields: [hairAssigned.clientId], references: [customer.id] }),
  createdBy: one(user, { fields: [hairAssigned.createdById], references: [user.id] }),
}))

// Note relations
export const noteRelations = relations(note, ({ one }) => ({
  customer: one(customer, { fields: [note.customerId], references: [customer.id] }),
  appointment: one(appointment, { fields: [note.appointmentId], references: [appointment.id] }),
  hairOrder: one(hairOrder, { fields: [note.hairOrderId], references: [hairOrder.id] }),
  createdBy: one(user, { fields: [note.createdById], references: [user.id] }),
}))

// UserSettings relations
export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, { fields: [userSettings.userId], references: [user.id] }),
}))
