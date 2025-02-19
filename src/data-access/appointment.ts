"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResponse, Appointment, appointmentSchema } from "@/lib/schemas";

export async function createAppointment(
  appointment: Appointment,
  clientId: string,
): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  try {
    const parse = appointmentSchema.safeParse(appointment);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }

    if (!clientId) {
      return {
        type: "ERROR",
        message: "Client ID is missing.",
      };
    }

    const c = await prisma.appointment.create({
      data: {
        name: appointment.name,
        notes: appointment.notes,
        startsAt: appointment.startsAt,
        clientId: clientId,
      },
    });
    revalidatePath("/appointments");
    return {
      message: `Created appointment: ${c.name}`,
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
