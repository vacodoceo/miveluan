import * as React from "react";

import { useMediaQuery } from "@/app/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import MedicalRecordForm from "./record-form";
import { Plus } from "lucide-react";

export function DrawerDialogRecordForm() {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg">
            <Plus className="h-5 w-5" /> Crear registro
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear registro</DialogTitle>
            <DialogDescription>
              Llena los campos para crear un nuevo registro.
            </DialogDescription>
          </DialogHeader>
          <MedicalRecordForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="w-full" size="lg">
          <Plus className="h-5 w-5" /> Crear registro
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Crear registro</DrawerTitle>
          <DrawerDescription>
            Llena los campos para crear un nuevo registro.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          <MedicalRecordForm onSuccess={() => setOpen(false)} />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
