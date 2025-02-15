"use server";

import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

export async function getAppointmentPersonnel(appointmentId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const personnelOnAppointment = await prisma.personnelOnAppointments.findMany({
    where: { appointmentId },
    include: { personnel: true },
  });

  return personnelOnAppointment.map((poa) => poa.personnel);
}

export async function linkPersonnelWithAppointment(
  personnel: string[],
  appointmentId: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  if (!appointmentId) {
    return {
      type: "ERROR",
      message: "Appointment ID is required.",
    };
  }

  try {
    const parse = z.array(z.string()).safeParse(personnel);

    if (!parse.success) {
      return {
        type: "ERROR",
        message: "Incorrect data received.",
      };
    }

    await prisma.personnelOnAppointments.deleteMany({
      where: { appointmentId },
    });

    const data = personnel.map((p) => ({
      appointmentId,
      personnelId: p,
    }));

    console.log({ data });

    const c = await prisma.personnelOnAppointments.createMany({ data });

    return {
      message: `Updated personnel: ${c.count}`,
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
