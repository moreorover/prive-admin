"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResponse, OrderItem, orderItemSchema } from "@/lib/schemas";

export async function getOrderItems() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return prisma.orderItem.findMany();
}

export async function getOrderItemsByOrderId(orderId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const orderItems = await prisma.orderItem.findMany({
    where: { orderId: orderId },
    include: { productVariant: { include: { product: true } } },
  });

  return orderItems.map((orderItem) => ({
    ...orderItem,
    unitPrice: orderItem.unitPrice / 100,
    totalPrice: orderItem.totalPrice / 100,
  }));
}

export async function getOrderItem(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return prisma.orderItem.findFirst({ where: { id } });
}

export async function createOrderItem(
  orderItem: OrderItem,
): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  try {
    const parse = orderItemSchema.safeParse(orderItem);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }
    const c = await prisma.orderItem.create({
      data: {
        orderId: orderItem.orderId,
        productVariantId: orderItem.productVariantId,
        quantity: orderItem.quantity,
        unitPrice: orderItem.unitPrice * 100,
        totalPrice: orderItem.quantity * orderItem.unitPrice * 100,
      },
    });
    revalidatePath("/orderItems");
    return {
      message: `Created orderItem: ${c.quantity}`,
      type: "SUCCESS",
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return {
      type: "ERROR",
      message: "Something went wrong!",
    };
  }
}

export async function updateOrderItem(
  orderItem: OrderItem,
): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  try {
    const parse = orderItemSchema.safeParse(orderItem);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }
    const c = await prisma.orderItem.update({
      data: {
        orderId: orderItem.orderId,
        productVariantId: orderItem.productVariantId,
        quantity: orderItem.quantity,
        unitPrice: orderItem.unitPrice * 100,
        totalPrice: orderItem.quantity * orderItem.unitPrice * 100,
      },
      where: { id: orderItem.id },
    });
    revalidatePath("/orderItems");
    return {
      message: `Updated orderItem: ${c.quantity}`,
      type: "SUCCESS",
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return {
      type: "ERROR",
      message: "Something went wrong!",
    };
  }
}

export async function deleteOrderItem(
  orderItem: OrderItem,
): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  try {
    const parse = orderItemSchema.safeParse(orderItem);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }
    const c = await prisma.orderItem.delete({
      where: { id: orderItem.id },
    });
    revalidatePath("/orderItems");
    return {
      message: `Deleted orderItem: ${c.quantity}`,
      type: "SUCCESS",
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return {
      type: "ERROR",
      message: "Something went wrong!",
    };
  }
}
