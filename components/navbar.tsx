import { auth } from "@/lib/auth";
import { AirVent } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, buttonVariants } from "./ui/button";

export default async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  async function signOut() {
    "use server";
    await auth.api.signOut({
      headers: await headers(),
    });
    redirect("/");
  }

  return (
    <div className="border-b px-4">
      <div className="flex items-center justify-between mx-auto max-w-4xl h-16">
        <Link href="/" className="flex items-center gap-2">
          <AirVent className="h-6 w-6" />
          <span className="font-bold">nextsecure.</span>
        </Link>

        <div>
          {session ? (
            <form action={signOut}>
              <Button type="submit">Sign Out</Button>
            </form>
          ) : (
            <Link href="/signin" className={buttonVariants()}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
