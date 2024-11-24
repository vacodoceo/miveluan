"use client";
import Link from "next/link";
import Image from "next/image";

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
import { useAuth } from "@/app/contexts/auth.context";
import Vita_Logo_No_Bg from "../../assets/vita-logo-no-bg.png";
import Google_Logo from "../../assets/google-logo.svg";

export const Navbar = () => {
  const { user, signIn, signOut, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <nav className="flex items-end justify-between p-4">
        <Link href="/" className="text-xl font-bold">
          <Image
            src={Vita_Logo_No_Bg}
            width={100}
            height={100}
            alt="Vita logo"
          />
        </Link>
        <Button variant="outline" className="m-0" onClick={signIn}>
          Ingresa como paciente
        </Button>
      </nav>
    );
  }

  return (
    <nav className="flex items-center justify-between p-4">
      <Link href="/" className="text-xl font-bold">
        <Image src={Vita_Logo_No_Bg} width={100} height={100} alt="Vita logo" />
      </Link>
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="relative">
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8 border-2 border-primary">
                  <AvatarImage
                    src={user.photoURL ?? ""}
                    alt={user.displayName!}
                  />
                  <AvatarFallback>{user.displayName!.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
              <Image
                src={Google_Logo}
                alt="Google logo"
                width={16}
                height={16}
                className="absolute bottom-0 right-0"
              />
            </div>
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
            <DropdownMenuItem onClick={signOut}>Desconectarse</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};
