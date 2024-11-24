import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BounceLoader } from "react-spinners";

const getVerificationCode = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

export default function ShareMedicalRecordDrawer() {
  const [verificationCode, setVerificationCode] = useState("");
  const [hasFoundConnection, setHasFoundConnection] = useState(false);

  useEffect(() => {
    setVerificationCode(getVerificationCode());
  }, []);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button className="px-8 py-6 text-lg">
          <Share2 className="mr-2 h-5 w-5" />
          Compartir ficha
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Código de verificación</DrawerTitle>
            <DrawerDescription>
              Ingresa este código en el dispositivo del médico tratante para
              compartir.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-2">
              <div className="text-4xl font-bold gap-2 flex">
                {Array.from(verificationCode).map((num, index) => (
                  <div
                    key={index}
                    className="flex h-12 w-8 items-center justify-center rounded-lg bg-white text-3xl font-bold border-2"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DrawerFooter>
            {hasFoundConnection ? (
              <div>
                <div>
                  <h2 className="text-xl font-semibold text-primary text-center">
                    Conexión encontrada
                  </h2>
                  <h2 className="text-sm text-muted-foreground mb-4 text-center">
                    📌 Cerca de Providencia, Santiago
                  </h2>
                </div>
                <div className="flex flex-row gap-4 justify-center">
                  <Button variant="destructive">Rechazar</Button>
                  <Button variant="secondary">Aceptar</Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center p-4">
                <BounceLoader color="#80ED99" />
              </div>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
