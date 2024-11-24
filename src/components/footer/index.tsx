"use client";

import Link from "next/link";
import Image from "next/image";

export const Footer = () => {
  return (
    <div className="text-sm flex flex-col items-center">
      <Link href="/" className="text-xl font-bold mb-2">
        <Image
          src="/GitHub_Invertocat_Logo.png"
          width={30}
          height={30}
          alt="Github logo"
        />
      </Link>
      <div className="flex flex-col items-center space-y-4">
        <Link href="/" className="text-primary">
          Términos y Condiciones
        </Link>
        © 2024 All rights reserved
      </div>
    </div>
  );
};
