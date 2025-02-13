"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResponse, Appointment, appointmentSchema } from "@/lib/schemas";

export async function getAppointments() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return prisma.appointment.findMany();
}

export async function getAppointment(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return prisma.appointment.findFirst({ where: { id } });
}

export async function getAppointmentsByCustomerId(customerId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  return prisma.appointment.findMany({
    where: { clientId: customerId },
    orderBy: [{ startsAt: "desc" }],
  });
}

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
    console.log({ e });
    return {
      type: "ERROR",
      message: "Something went wrong!",
    };
  }
}

export async function updateAppointment(
  appointment: Appointment,
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
    const c = await prisma.appointment.update({
      data: {
        name: appointment.name,
        notes: appointment.notes,
        startsAt: appointment.startsAt,
      },
      where: { id: appointment.id },
    });
    revalidatePath("/appointments");
    return {
      message: `Updated appointment: ${c.name}`,
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

export async function deleteAppointment(
  appointment: Appointment,
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
    const c = await prisma.appointment.delete({
      where: { id: appointment.id },
    });
    revalidatePath("/appointments");
    return {
      message: `Deleted appointment: ${c.name}`,
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
