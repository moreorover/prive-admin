"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  ActionResponse,
  ProductVariant,
  productVariantSchema,
} from "@/lib/schemas";

export async function createProductVariant(
  productVariant: ProductVariant,
): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  try {
    const parse = productVariantSchema.safeParse(productVariant);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }
    const c = await prisma.productVariant.create({
      data: {
        productId: productVariant.productId,
        size: productVariant.size,
        price: productVariant.price * 100,
        stock: productVariant.stock,
      },
    });
    revalidatePath("/productVariants");
    return {
      message: `Created productVariant: ${c.size}`,
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

export async function updateProductVariant(
  productVariant: ProductVariant,
): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  try {
    const parse = productVariantSchema.safeParse(productVariant);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }
    const c = await prisma.productVariant.update({
      data: {
        productId: productVariant.productId,
        size: productVariant.size,
        price: productVariant.price * 100,
        stock: productVariant.stock,
      },
      where: { id: productVariant.id },
    });
    revalidatePath("/productVariants");
    return {
      message: `Updated productVariant: ${c.size}`,
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
