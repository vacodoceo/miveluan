"use client";

import MedicalRecordList from "./components/records/medical-record-list";
import { Chat } from "./components/chat/chat";
import { useAuth } from "./contexts/auth.context";
import MobileTabs from "./components/mobile-tabs";
import ShareMedicalRecordDrawer from "./components/share-medical-record-drawer";
import { DrawerDialogRecordForm } from "./components/records/record-form/drawer-dialog-record-form";
import ConnectWithPatientDrawer from "./components/connect-with-patient-drawer";
import { InitDialog } from "./components/init-dialog/init-dialog";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <main className="container mx-auto p-4 space-y-8 flex-grow">
        <div className="flex justify-center mt-8">
          <ConnectWithPatientDrawer />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 space-y-8">
      <InitDialog />
      <div className="flex flex-col sm:hidden flex-grow">
        <MobileTabs />
      </div>

      <div className="hidden sm:block">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col flex-grow gap-4">
            <h2 className="text-2xl font-semibold">Historial médico</h2>
            <MedicalRecordList />
            <div className="grid grid-cols-2 gap-2">
              <ShareMedicalRecordDrawer />
              <DrawerDialogRecordForm />
            </div>
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
