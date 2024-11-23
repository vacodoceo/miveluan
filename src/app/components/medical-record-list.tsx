"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// This is a mock data structure. In a real application, you'd fetch this from your backend.
const mockData = [
  {
    id: 1,
    type: "text",
    content: "Visited Dr. Smith for annual checkup",
    date: "2023-05-15",
  },
  {
    id: 2,
    type: "file",
    content: "blood_test_results.pdf",
    date: "2023-05-16",
  },
  {
    id: 3,
    type: "text",
    content: "Started new medication for blood pressure",
    date: "2023-05-20",
  },
];

export default function MedicalRecordList() {
  const [records] = useState(mockData);
  const [summary, setSummary] = useState("");

  const generateSummary = () => {
    // In a real application, this would be an API call to your AI service
    setSummary(
      "Basado en los exámenes y entradas subidos, tu estado de salud parece estar bien. Se recomienda realizar revisiones regulares y adherencia a la medicación."
    );
  };

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <Card key={record.id}>
          <CardHeader>
            <CardTitle>{record.type === "text" ? "Note" : "File"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{record.content}</p>
            <p className="text-sm text-gray-500 mt-2">Fecha: {record.date}</p>
          </CardContent>
        </Card>
      ))}
      <Button onClick={generateSummary} className="w-full">
        Generar resumen con IA
      </Button>
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen con IA</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
