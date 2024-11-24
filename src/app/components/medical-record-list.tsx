"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMedicalRecords } from "../contexts/medical-record.context";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const formatFileSize = (size: number) => {
  const units = ["bytes", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
};

export default function MedicalRecordList() {
  const { records } = useMedicalRecords();

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <Card key={record.id}>
          <CardHeader>
            <CardTitle>{record.title}</CardTitle>
            <CardDescription>
              {record.date.toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {record.description && <p>{record.description}</p>}
            {record.files.length > 0 && (
              <div className="flex gap-2 flex-col">
                {record.files.map((file) => (
                  <div key={file.name} className="flex gap-2 items-center">
                    <FileText className="w-5 h-5 text-primary" />
                    <p className="font-medium flex-1">{file.name}</p>
                    <div className="border border-border py-0.5 px-2 flex gap-2 items-center rounded-sm">
                      <p className="text-sm font-medium">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
