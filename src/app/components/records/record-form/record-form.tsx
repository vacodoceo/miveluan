"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import {
  Form,
  FormLabel,
  FormItem,
  FormField,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ExamsUploader } from "./exams-uploader";
import { useMedicalRecords } from "@/app/contexts/medical-record.context";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().optional(),
  files: z.array(z.any()),
});

export default function MedicalRecordForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const { addRecord } = useMedicalRecords();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      files: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    addRecord({
      title: values.title,
      description: values.description,
      files: values.files
        ? values.files.map((file) => ({ name: file.name, size: file.size }))
        : [],
      date: new Date(),
    });

    form.reset();
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="files"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exámenes</FormLabel>
              <FormControl>
                <ExamsUploader
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full" type="submit">
          <Plus className="h-5 w-5" />
          Crear registro
        </Button>
      </form>
    </Form>
  );
}
