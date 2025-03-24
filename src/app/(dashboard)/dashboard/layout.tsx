import React from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { redirect } from "next/navigation";
import { Container } from "@mantine/core";
import { auth } from "@/lib/auth";

interface Props {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: Props) {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  const user = session.user;

  if (!user) {
    return redirect("/signin");
  }

  const version = process.env.VERSION;

  return (
    <DashboardShell
      profile={{ name: user.name!, email: user.email! }}
      version={version}
    >
      <Container fluid>{children}</Container>
    </DashboardShell>
  );
}
