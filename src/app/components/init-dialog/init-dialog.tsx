import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const InitDialog = () => {
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cargar ficha</DialogTitle>
          <DialogDescription>
            Carga tu ficha desde tu dispositivo o desde Google Drive.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Button>Cargar desde dispositivo</Button>
          <Button variant="outline">Cargar desde Google Drive</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
