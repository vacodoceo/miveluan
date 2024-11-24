import { Metadata } from "next";
import MedicalRecordForm from "./components/medical-record-form";
import MedicalRecordList from "./components/medical-record-list";
import ShareButton from "./components/share-button";
import { Chat } from "./components/chat/chat";

export const metadata: Metadata = {
  title: "Vita",
  description: "Lleva un seguimiento de tu historial médico y exámenes",
};

export default function Home() {
  return (
    <main className="container mx-auto p-4 space-y-8">
      <div className="flex justify-center">
        <ShareButton />
      </div>
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
    </main>
  );
}
