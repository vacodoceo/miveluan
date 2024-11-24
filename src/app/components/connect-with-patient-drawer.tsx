"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Radio } from "lucide-react";
import { useRef, useState } from "react";
import { PropagateLoader } from "react-spinners";
import { checkRoomAction } from "../actions/check-room-action";

export default function ConnectWithPatientDrawer() {
  const [roomId, setRoomId] = useState(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newRoomId = [...roomId];
      newRoomId[index] = value;
      setRoomId(newRoomId);

      if (value && index < inputRefs.current.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const code = roomId.join("");

    try {
      await checkRoomAction(code);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setIsLoading(false);
      alert("Código incorrecto. Inténtalo de nuevo.");
    }
  };

  const handleDrawerChange = (isOpen: boolean) => {
    setIsDrawerOpen(isOpen);
    if (!isOpen) {
      setRoomId(Array(6).fill(""));
    }
  };

  return (
    <Drawer open={isDrawerOpen} onOpenChange={handleDrawerChange}>
      <DrawerTrigger asChild>
        <Button className="px-8 py-6 text-lg" variant="secondary">
          <Radio className="mr-2 h-5 w-5" />
          Conectar con paciente
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Código de verificación</DrawerTitle>
            <DrawerDescription>
              Ingrese el código de verificación del paciente para conectar.
            </DrawerDescription>
          </DrawerHeader>
          {isLoading ? (
            <div className="pb-8">
              <h2 className="text-xl font-semibold text-primary text-center">
                Conectando con el paciente...
              </h2>
              <div className="flex justify-center p-4">
                <PropagateLoader color="#80ED99" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 pb-8">
              <div className="flex items-center justify-center space-x-2">
                {roomId.map((num, index) => (
                  <input
                    key={index}
                    autoFocus={index === 0}
                    type="text"
                    value={num}
                    onChange={(e) => handleChange(e, index)}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    className="flex h-12 w-8 items-center justify-center rounded-lg bg-white text-3xl font-bold border-2 text-center"
                    maxLength={1}
                  />
                ))}
              </div>
              <div className="flex justify-center mt-4">
                <Button type="submit">Conectar</Button>
              </div>
            </form>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
