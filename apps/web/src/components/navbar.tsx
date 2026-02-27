import { Link, useRouteContext, useRouter } from "@tanstack/react-router"
import { LogOutIcon, ShieldIcon, UserIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function Navbar() {
  const router = useRouter()
  const { session } = useRouteContext({ from: "__root__" })

  return (
    <header className="border-b">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="text-sm font-semibold">
          Prive Admin
        </Link>

        <nav className="flex items-center gap-2">
          {session?.user?.role === "admin" && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/dashboard">
                <ShieldIcon data-icon="inline-start" />
                Admin
              </Link>
            </Button>
          )}

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs">
                      {session.user.name ? (
                        getInitials(session.user.name)
                      ) : (
                        <UserIcon className="size-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  <div className="truncate">{session.user.name}</div>
                  <div className="text-muted-foreground truncate text-xs font-normal">
                    {session.user.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await authClient.signOut()
                    router.invalidate()
                  }}
                >
                  <LogOutIcon />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/signin">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
