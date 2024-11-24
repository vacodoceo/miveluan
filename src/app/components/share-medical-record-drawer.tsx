import { useCallback, useState } from "react";
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
import { useWebRTC } from "@/hooks/use-web-rtc";
import { Share2 } from "lucide-react";
import { useAuth } from "../contexts/auth.context";
import { getExamPDF, listExamsPDFs } from "@/lib/repositories/exams";
import { BounceLoader } from "react-spinners";

const SERVER_URL =
  process.env.NEXT_PUBLIC_WEBRTC_SERVER_URL || "http://localhost:8081";

const getRandomRoomId = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const blobToFile = ({
  blob,
  fileName,
}: {
  blob: Blob;
  fileName: string;
}): File => {
  const file = new File([blob], fileName, { type: blob.type });
  return file;
};

export default function ShareMedicalRecordDrawer() {
  const { accessToken } = useAuth();
  const [roomId] = useState(getRandomRoomId);
  const [isLoading, setIsLoading] = useState(false);
  const {
    connected,
    connectionStatus,
    filesProgress,
    isReceiverConnected,
    sendFiles,
  } = useWebRTC({
    serverUrl: SERVER_URL,
    role: "sender",
    roomId,
  });
  const [files, setFiles] = useState<File[]>([]);

  const getFiles = useCallback(async () => {
    if (!accessToken) {
      return [];
    }

    setIsLoading(true);
    try {
      const exams = await listExamsPDFs(accessToken);
      const files = (
        await Promise.all(
          exams.map((exam) => getExamPDF(exam.name, accessToken))
        )
      ).filter((file) => file !== null) as { blob: Blob; fileName: string }[];

      return files.map(blobToFile);
    } catch (error) {
      console.error("Error fetching files:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const handleDrawerOpen = async () => {
    const fetchedFiles = await getFiles();
    setFiles(fetchedFiles);
  };

  return (
    <Drawer
      onOpenChange={(isOpen) => {
        if (isOpen) {
          handleDrawerOpen();
        }
      }}
    >
      <DrawerTrigger asChild>
        <Button size="lg" variant="outline">
          <Share2 className="mr-2 h-5 w-5" />
          Compartir ficha
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        {isLoading || files?.length === 0 ? (
          <div className="flex justify-center items-center p-4">
            <span className="text-gray-500">
              Espere mientras cargamos sus archivos...
            </span>
            <BounceLoader color="#80ED99" />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Enviar archivos</DrawerTitle>
              <DrawerDescription>
                Pídele a tu médico ingresar este código
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-4 pb-0">
              <div className="flex items-center justify-center space-x-2">
                <div className="text-4xl font-bold gap-2 flex">
                  {Array.from(roomId).map((num, index) => (
                    <div
                      key={index}
                      className="flex h-12 w-10 items-center justify-center rounded-lg bg-white text-3xl font-bold border-2"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4">
              <div
                className={`w-3 h-3 rounded-full ${
                  connected ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <span className="text-sm text-center text-gray-600">
                {connectionStatus}
              </span>
            </div>

            {filesProgress.length > 0 && (
              <div className="p-4 space-y-2">
                {filesProgress.map((file) => (
                  <div key={file.fileName} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate max-w-[200px]">
                        {file.fileName}
                      </span>
                      <span>
                        {file.status === "completed"
                          ? "100%"
                          : `${Math.round(file.progress)}%`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <DrawerFooter>
              <Button
                onClick={() => sendFiles(files)}
                disabled={
                  !connected || !isReceiverConnected || files?.length === 0
                }
              >
                Enviar
              </Button>
            </DrawerFooter>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
