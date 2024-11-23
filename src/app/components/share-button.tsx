"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export default function ShareButton() {
  const handleShare = () => {
    console.log("Sharing medical record...");
  };

  return (
    <Button onClick={handleShare} className="px-8 py-6 text-lg">
      <Share2 className="mr-2 h-5 w-5" /> Compartir historial médico
    </Button>
  );
}