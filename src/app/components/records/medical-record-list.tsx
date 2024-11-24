"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMedicalRecords } from "@/app/contexts/medical-record.context";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// const formatFileSize = (size: number) => {
//   const units = ["bytes", "KB", "MB", "GB"];
//   let value = size;
//   let unitIndex = 0;

//   while (value >= 1024 && unitIndex < units.length - 1) {
//     value /= 1024;
//     unitIndex++;
//   }

//   return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
// };

export default function MedicalRecordList() {
  const { records } = useMedicalRecords();

  const sortedRecords = records.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <ScrollArea className="flex flex-col bg-muted rounded-xl p-2 h-[calc(100vh-20rem)] sm:h-[calc(100vh-25rem)]">
      <div className="space-y-2">
        {sortedRecords.map((record) => (
          <Card key={record.id} className="shadow-none rounded-lg border-none">
            <CardHeader className="p-4 space-y-0.5 pb-2">
              <CardTitle>{record.title}</CardTitle>
              <CardDescription className="text-sm">
                {record.date.toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 p-4 pt-0">
              {record.description && (
                <p className="text-sm">{record.description}</p>
              )}
              {record.files.length > 0 && (
                <div className="flex gap-2 flex-col">
                  {record.files.map((file) => (
                    <div key={file.name} className="flex gap-2 items-center">
                      <FileText className="w-4 h-4 text-primary" />
                      <p className="font-medium flex-1 text-sm">{file.name}</p>
                      {/* <div className="border border-border py-0.5 px-2 flex gap-2 items-center rounded-sm">
                      <p className="text-sm font-medium text-ellipsis overflow-hidden">
                        {formatFileSize(file.size)}
                      </p>
                    </div> */}
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
    </ScrollArea>
  );
}
