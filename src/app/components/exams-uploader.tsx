import { FileCheck, Loader2 } from "lucide-react";

import { useCallback, useState } from "react";
import { useControllableState } from "../hooks/use-controllable-state";
import Dropzone, { type FileRejection } from "react-dropzone";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useChatWorker } from "@/app/context/chat-worker-context";

interface ExamsUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: File[];
  onValueChange?: (files: File[]) => void;
  sses?: Record<string, number>;
  disabled?: boolean;
}

export function ExamsUploader(props: ExamsUploaderProps) {
  const {
    value: valueProp,
    onValueChange,
    disabled = false,
    className,
    ...dropzoneProps
  } = props;

  const { isLoading, embedPDF } = useChatWorker();
  const { toast } = useToast();

  const [filesLoading, setFilesLoading] = useState<string[]>([]);
  const [files, setFiles] = useControllableState({
    prop: valueProp,
    onChange: onValueChange,
  });

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const updatedFiles = files ? [...files, ...acceptedFiles] : acceptedFiles;
      setFiles(updatedFiles);
      setFilesLoading([
        ...filesLoading,
        ...acceptedFiles.map((file) => file.name),
      ]);

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file }) => {
          toast({
            title: "File rejected",
            description: `File ${file.name} was rejected`,
          });
        });
      }

      acceptedFiles.forEach(async (file) => {
        await embedPDF(file).then(() => {
          setFilesLoading(filesLoading.filter((name) => name !== file.name));
        });
      });
    },

    [files, setFiles, toast, embedPDF, filesLoading]
  );

  function onRemove(index: number) {
    if (!files) return;
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onValueChange?.(newFiles);
  }

  const isDisabled = disabled || isLoading;
  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      <Dropzone
        onDrop={onDrop}
        accept={{ "application/pdf": [] }}
        disabled={isDisabled}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={cn(
              "group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25",
              "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isDragActive && "border-muted-foreground/50",
              isDisabled && "pointer-events-none opacity-60",
              className
            )}
            {...dropzoneProps}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                <div className="rounded-full border border-dashed p-3">
                  <Upload
                    className="size-7 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-medium text-muted-foreground">
                  Drop the files here
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                <div className="rounded-full border border-dashed p-3">
                  <Upload
                    className="size-7 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex flex-col gap-px">
                  <p className="font-medium text-muted-foreground">
                    Drag {`'n'`} drop files here, or click to select files
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Puedes subir tus exámenes en formato PDF
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Dropzone>
      {files?.length ? (
        <ScrollArea className="h-fit w-full px-3">
          <div className="flex max-h-48 flex-col gap-4">
            {files?.map((file, index) => (
              <FileCard
                key={index}
                file={file}
                onRemove={() => onRemove(index)}
                loading={filesLoading.includes(file.name)}
              />
            ))}
          </div>
        </ScrollArea>
      ) : null}
    </div>
  );
}

const formatBytes = (
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: "accurate" | "normal";
  } = {}
) => {
  const { decimals = 0, sizeType = "normal" } = opts;

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === "accurate" ? accurateSizes[i] ?? "Bytes" : sizes[i] ?? "Bytes"
  }`;
};

interface FileCardProps {
  file: File;
  onRemove: () => void;
  loading: boolean;
}

function FileCard({ file, loading, onRemove }: FileCardProps) {
  return (
    <div className="relative flex items-center gap-2.5">
      <div className="flex flex-1 gap-2.5">
        {loading ? (
          <Loader2
            className="size-10 text-muted-foreground animate-spin"
            aria-hidden="true"
          />
        ) : (
          <FileCheck
            className="size-10 text-muted-foreground"
            aria-hidden="true"
          />
        )}
        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-col gap-px">
            <p className="line-clamp-1 text-sm font-medium text-foreground/80">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-7"
          onClick={onRemove}
        >
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Remove file</span>
        </Button>
      </div>
    </div>
  );
}