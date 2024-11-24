"use client";

import MedicalRecordForm from "./components/medical-record-form";
import MedicalRecordList from "./components/medical-record-list";
import ShareButton from "./components/share-button";
import { Chat } from "./components/chat/chat";
import { useAuth } from "./contexts/auth.context";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <main className="container mx-auto p-4 space-y-8">
        <div className="flex justify-center">
          Esta aplicación proporciona a los pacientes una plataforma segura y
          centralizada para gestionar sus registros médicos, almacenando
          documentos en su Google Drive. Permite la compartición de información
          médica entre pacientes y proveedores de salud de manera fácil y
          rápida, mejorando la comunicación y el acceso a datos críticos.
          Además, utiliza inteligencia artificial para interpretar documentos
          médicos y ofrecer retroalimentación personalizada, empoderando a los
          usuarios en su proceso de atención médica.
        </div>
      </main>
    );
  }

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
