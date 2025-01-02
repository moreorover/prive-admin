"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResponse, Transaction, transactionSchema } from "@/lib/schemas";

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
    console.log({ transaction });
    const c = await prisma.transaction.create({
      data: {
        name: transaction.name,
        type: transaction.type,
        direction: transaction.direction,
        orderId: transaction.orderId,
        total: transaction.total * 100,
        isProductCost: transaction.isProductCost,
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
        type: transaction.type,
        direction: transaction.direction,
        orderId: transaction.orderId,
        total: transaction.total * 100,
        isProductCost: transaction.isProductCost,
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
