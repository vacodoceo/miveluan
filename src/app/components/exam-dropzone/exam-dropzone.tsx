"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
export const ExamDropzone = () => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setUploadProgress(0);

      const blob = new Blob([file], { type: "application/pdf" });

      const loader = new WebPDFLoader(blob, {});
      const docs = await loader.load();
      console.log(docs[0].pageContent);

      // Create embeddings
      // const embeddings = new HuggingFaceTransformersEmbeddings({
      //   model: "Xenova/all-MiniLM-L6-v2",
      // });
      const embeddings = new OpenAIEmbeddings({
        apiKey: "ultra_secret",
      });
      // Create the Voy store.
      const store = new MemoryVectorStore(embeddings);

      // // Add two documents with some metadata.
      await store.addDocuments(docs);

      const query = await embeddings.embedQuery("What's the patient's name?");

      // Perform a similarity search.
      const resultsWithScore = await store.similaritySearchVectorWithScore(
        query,
        1
      );

      // // Print the results.
      console.log(JSON.stringify(resultsWithScore, null, 2));
    } catch (error) {
      console.error("Error processing file:", error);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300"}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? "Drop the PDF file here"
            : "Drag & drop a PDF file here, or click to select"}
        </p>
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Processing: {Math.round(uploadProgress)}%
          </p>
        </div>
      )}
    </div>
  );
};
