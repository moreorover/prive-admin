"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResponse, Transaction, transactionsSchema } from "@/lib/schemas";

import { z } from "zod";

export async function getTransactions() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return prisma.transaction.findMany();
}

export async function getTransactionsByOrderId(orderId: string | null) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return prisma.transaction.findMany({ where: { orderId: orderId } });
}

export async function createTransactions(
  transactions: Transaction[],
): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  try {
    const parse = transactionsSchema.safeParse(transactions);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }

    const c = await prisma.transaction.createMany({
      data: transactions,
      skipDuplicates: true,
    });
    revalidatePath("/transactions");
    return {
      message: `Created transactions: ${c.count}`,
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

export async function linkTransactionsWithOrders(
  transactions: string[],
  orderId: string,
): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  if (!orderId) {
    return {
      type: "ERROR",
      message: "Order ID is required.",
    };
  }

  try {
    const parse = z.array(z.string()).safeParse(transactions);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }

    const c = await prisma.transaction.updateMany({
      where: { id: { in: transactions } },
      data: {
        orderId,
      },
    });
    revalidatePath("/transactions");
    return {
      message: `Updated transactions: ${c.count}`,
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
