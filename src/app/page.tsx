"use client";

import MedicalRecordForm from "./components/medical-record-form";
import MedicalRecordList from "./components/medical-record-list";
import { Chat } from "./components/chat/chat";
import { useAuth } from "./contexts/auth.context";
import { Button } from "@/components/ui/button";
import { Radio } from "lucide-react";
import MobileTabs from "./components/mobile-tabs";
import ShareMedicalRecordDrawer from "./components/share-medical-record-drawer";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <main className="container mx-auto p-4 space-y-8 flex-grow">
        <div className="flex justify-center mt-8">
          <Button className="px-8 py-6 text-lg" variant="secondary">
            <Radio className="mr-2 h-5 w-5" />
            Conectar con paciente
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 space-y-8">
      <div className="flex justify-center">
        <ShareMedicalRecordDrawer />
      </div>

      <div className="block sm:hidden">
        <MobileTabs />
      </div>

      <div className="hidden sm:block">
        <MedicalRecordForm />
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Historial médico</h2>
            <MedicalRecordList />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Chat con tu IA</h2>
            <Chat />
          </div>
        </div>
      </div>
    </main>
  );
}
