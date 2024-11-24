import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chat } from "./chat/chat";
import MedicalRecordList from "./medical-record-list";

export default function MobileTabs() {
  return (
    <Tabs defaultValue="record">
      <div className="flex justify-center w-full">
        <TabsList className="inline-flex">
          <TabsTrigger value="record">Ficha Médica</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="record">
        <MedicalRecordList />
      </TabsContent>
      <TabsContent value="chat">
        <Chat />
      </TabsContent>
    </Tabs>
  );
}
