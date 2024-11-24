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

const formSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().optional(),
});

export default function MedicalRecordForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <strong>Conversa con tu IA</strong>
              </FormLabel>
              <FormControl>
                <Textarea placeholder="Escribe tu mensaje aquí" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ExamsUploader />

        <Button type="submit">Agregar entrada</Button>
      </form>
    </Form>
  );
}
