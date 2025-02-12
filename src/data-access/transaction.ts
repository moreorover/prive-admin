"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  ActionResponse,
  Transaction,
  transactionSchema,
  transactionsSchema,
} from "@/lib/schemas";

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

export async function getTransaction(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return prisma.transaction.findFirst({ where: { id } });
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

export async function createTransaction(
  transaction: Transaction,
): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  try {
    const parse = transactionSchema.safeParse(transaction);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }

    const c = await prisma.transaction.create({
      data: {
        name: transaction.name,
        notes: transaction.notes,
        amount: transaction.amount * 100,
        type: transaction.type,
        orderId: transaction.orderId,
        customerId: transaction.customerId,
      },
    });
    revalidatePath("/transactions");
    return {
      message: `Created transaction: ${c.name}`,
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

    // console.log({ e: parse.error });

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

export async function updateTransaction(
  transaction: Transaction,
): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  try {
    const parse = transactionSchema.safeParse(transaction);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }
    const c = await prisma.transaction.update({
      data: {
        name: transaction.name,
        notes: transaction.notes,
        amount: transaction.amount * 100,
        type: transaction.type,
        orderId: transaction.orderId,
        customerId: transaction.customerId,
      },
      where: { id: transaction.id },
    });
    revalidatePath("/transactions");
    return {
      message: `Updated transaction: ${c.name}`,
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

export async function deleteTransaction(
  transaction: Transaction,
): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  try {
    const parse = transactionSchema.safeParse(transaction);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }
    const c = await prisma.transaction.delete({
      where: { id: transaction.id },
    });
    revalidatePath("/transactions");
    return {
      message: `Deleted transaction: ${c.name}`,
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
