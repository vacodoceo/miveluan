"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Dropzone from "@/components/ui/dropzone";

export default function MedicalRecordForm() {
  const [textEntry, setTextEntry] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Submitting:", { textEntry, file });
    // Reset form
    setTextEntry("");
    setFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text-entry">Título</Label>
        <Input
          id="text-entry"
          placeholder="Resultado de la prueba de sangre"
          value={textEntry}
          onChange={(e) => setTextEntry(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="text-entry">Descripción (opcional)</Label>
        <Textarea
          id="text-entry"
          placeholder="La prueba de sangre salió positiva para anemia"
          value={textEntry}
          onChange={(e) => setTextEntry(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file-upload">Exámenes médicos</Label>
        <Dropzone
          id="file-upload"
          type="file"
          dropMessage="Arrastra y suelta tus exámenes médicos aquí"
          handleOnDrop={(fileList) => setFile(fileList ? fileList[0] : null)}
        />
      </div>
      <Button type="submit">Agregar entrada</Button>
    </form>
  );
}
