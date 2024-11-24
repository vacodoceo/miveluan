"use client";

import { saveUserData } from "@/lib/repositories/user";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth.context";

export interface MedicalRecord {
  id: string;
  date: Date;
  title: string;
  description?: string;
  files: { name: string; size: number }[];
}

interface MedicalRecordsContextType {
  records: MedicalRecord[];
  addRecord: (record: Omit<MedicalRecord, "id">) => void;
  importRecords: (records: MedicalRecord[]) => void;
}

// Create the context
const MedicalRecordsContext = createContext<
  MedicalRecordsContextType | undefined
>(undefined);

// Provider component
export function MedicalRecordsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  const addRecord = (record: Omit<MedicalRecord, "id">) => {
    const newRecord: MedicalRecord = {
      ...record,
      id: Math.random().toString(36).substring(2),
    };
    setRecords((prev) => [...prev, newRecord]);
  };

  const importRecords = (newRecords: MedicalRecord[]) => {
    setRecords(newRecords);
  };

  const value = {
    records,
    addRecord,
    importRecords,
  };

  useEffect(() => {
    if (accessToken && records.length > 0) {
      saveUserData(records, accessToken);
    }
  }, [records, accessToken]);

  return (
    <MedicalRecordsContext.Provider value={value}>
      {children}
    </MedicalRecordsContext.Provider>
  );
}

// Custom hook to use the context
export function useMedicalRecords() {
  const context = useContext(MedicalRecordsContext);

  if (context === undefined) {
    throw new Error(
      "useMedicalRecords must be used within a MedicalRecordsProvider"
    );
  }

  return context;
}
