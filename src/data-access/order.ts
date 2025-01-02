"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResponse, Order, orderSchema } from "@/lib/schemas";

export async function getOrders() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const orders = await prisma.order.findMany({
    include: { customer: true },
  });

  return Promise.all(
    orders.map(async (order) => ({
      ...order,
      total: await getOrderTotal(order.id),
    })),
  );
}

export async function getOrdersByCustomerId(customerId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return prisma.order.findMany({ where: { customerId } });
}

export async function getOrder(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return prisma.order.findFirst({ where: { id } });
}

export async function getOrderTotal(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const orderItems = await prisma.orderItem.findMany({
    where: { orderId: id },
  });

  const total = orderItems.reduce((n, { totalPrice }) => n + totalPrice, 0);
  return total / 100;
}

export async function createOrder(order: Order): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  try {
    const parse = orderSchema.safeParse(order);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }
    const c = await prisma.order.create({
      data: {
        customerId: parse.data.customerId,
        placedAt: order.placedAt,
        status: order.status,
        type: order.type,
      },
    });
    revalidatePath("/orders");
    return {
      message: `Created order: ${c.placedAt}`,
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

export async function updateOrder(order: Order): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  try {
    const parse = orderSchema.safeParse(order);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }
    const c = await prisma.order.update({
      data: {
        customerId: parse.data.customerId,
        placedAt: order.placedAt,
        status: order.status,
        type: order.type,
      },
      where: { id: order.id },
    });
    revalidatePath("/orders");
    return {
      message: `Updated order: ${c.placedAt}`,
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

export async function deleteOrder(order: Order): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  try {
    const parse = orderSchema.safeParse(order);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }
    const c = await prisma.order.delete({
      where: { id: order.id },
    });
    revalidatePath("/orders");
    return {
      message: `Deleted order: ${c.placedAt}`,
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
