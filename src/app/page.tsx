import { Metadata } from "next";
import MedicalRecordForm from "./components/medical-record-form";
import MedicalRecordList from "./components/medical-record-list";
import ShareButton from "./components/share-button";

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
      <h1 className="text-3xl font-bold text-center mb-8">Historial médico</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Agregar nueva entrada</h2>
          <MedicalRecordForm />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Historial médico</h2>
          <MedicalRecordList />
        </div>
      </div>
    </main>
  );
}
