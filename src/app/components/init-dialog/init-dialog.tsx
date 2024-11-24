import { useAuth } from "@/app/contexts/auth.context";
import {
  MedicalRecord,
  useMedicalRecords,
} from "@/app/contexts/medical-record.context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getUserData } from "@/lib/repositories/user";
import { useEffect, useState } from "react";
import { BounceLoader } from "react-spinners";

export const InitDialog = () => {
  const [isOpen, setIsOpen] = useState(true);

  const { importRecords } = useMedicalRecords();
  const { accessToken } = useAuth();
  const [driveImportState, setDriveImportState] = useState<
    "loading" | "success" | "error"
  >("loading");

  useEffect(() => {
    if (accessToken) {
      getUserData<MedicalRecord[]>(accessToken)
        .then((records) => {
          if (records && records.length > 0) {
            importRecords(
              records.map((record) => ({
                ...record,
                date: new Date(record.date),
              }))
            );
            setDriveImportState("success");
            setIsOpen(false);
          } else {
            setDriveImportState("error");
          }
        })
        .catch(() => {
          setDriveImportState("error");
        });
    }
  }, [accessToken]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Cargar ficha</DialogTitle>
          <DialogDescription>
            {driveImportState === "loading"
              ? "Cargando ficha desde Google Drive..."
              : driveImportState === "success"
              ? "Cargando ficha desde Google Drive..."
              : "No pudimos cargar la ficha desde Google Drive. Cárgala desde tu dispositivo o empieza desde cero."}
          </DialogDescription>
        </DialogHeader>
        {driveImportState === "error" && (
          <div className="flex flex-col gap-4">
            <Button>Cargar desde dispositivo</Button>
            <DialogClose asChild>
              <Button variant="outline">Empezar desde cero</Button>
            </DialogClose>
          </div>
        )}
        {driveImportState === "loading" && (
          <div className="flex justify-center p-4">
            <BounceLoader color="#80ED99" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
