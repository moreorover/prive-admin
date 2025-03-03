import React from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface Props {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/signin");
  }

  const user = session.user;

  const version = process.env.VERSION;

  return (
    <DashboardShell
      profile={{ name: user.name, email: user.email }}
      version={version}
    >
      {children}
    </DashboardShell>
  );
}
