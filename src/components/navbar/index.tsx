"use client";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/app/contexts/auth/auth.context";

export const Navbar = () => {
  const { user, signIn, signOut, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <nav className="flex items-center justify-between p-4 bg-white shadow-sm">
        <Link href="/" className="text-xl font-bold">
          VITA
        </Link>
        <Button variant="outline" onClick={signIn}>
          Sign In
        </Button>
      </nav>
    );
  }

  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-sm">
      <Link href="/" className="text-xl font-bold">
        VITA
      </Link>
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">{user.displayName}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.photoURL ?? ""}
                  alt={user.displayName!}
                />
                <AvatarFallback>{user.displayName!.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.displayName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};
