"use client";

import Link from "next/link";
import Image from "next/image";
import GitHub_Invertocat_Logo from "../../assets/github-logo.png";

export const Footer = () => {
  return (
    <div className="text-sm flex flex-col items-center sm:my-8 mb-4 mt-2">
      <Link
        href="https://github.com/vacodoceo/miveluan"
        className="text-xl font-bold mb-2"
      >
        <Image
          src={GitHub_Invertocat_Logo}
          width={30}
          height={30}
          alt="Github logo"
        />
      </Link>
      <div className="flex flex-col items-center space-y-4">
        <Link href="/terms-and-conditions" className="text-primary">
          Términos y Condiciones
        </Link>
        Vita © 2024 All rights reserved
      </div>
    </div>
  );
};
