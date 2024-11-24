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
import { useEffect, useRef, useState } from "react";
import { PropagateLoader } from "react-spinners";

const getVerificationCode = () => {
  return String(999999);
};

export default function ConnectWithPatientDrawer() {
  const [verificationCode, setVerificationCode] = useState("");
  const [inputCode, setInputCode] = useState(Array(6).fill(""));
  const [hasFoundConnection, setHasFoundConnection] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setVerificationCode(getVerificationCode());
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newInputCode = [...inputCode];
      newInputCode[index] = value;
      setInputCode(newInputCode);

      if (value && index < inputRefs.current.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputCode.join("");
    if (code === verificationCode) {
      setHasFoundConnection(true);
    } else {
      alert("Código incorrecto. Inténtalo de nuevo.");
    }
  };

  const handleDrawerChange = (isOpen: boolean) => {
    setIsDrawerOpen(isOpen);
    if (!isOpen) {
      setInputCode(Array(6).fill(""));
      setHasFoundConnection(false);
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
          {hasFoundConnection ? (
            <div className="pb-8">
              <h2 className="text-xl font-semibold text-primary text-center">
                Esperando confirmación del paciente
              </h2>
              <div className="flex justify-center p-4">
                <PropagateLoader color="#80ED99" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 pb-8">
              <div className="flex items-center justify-center space-x-2">
                {inputCode.map((num, index) => (
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
