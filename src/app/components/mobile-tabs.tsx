import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chat } from "./chat/chat";
import MedicalRecordList from "./records/medical-record-list";
import { DrawerDialogRecordForm } from "./records/record-form/drawer-dialog-record-form";
import ShareMedicalRecordDrawer from "./share-medical-record-drawer";

export default function MobileTabs() {
  return (
    <Tabs defaultValue="record" className="flex flex-col flex-grow">
      <TabsList className="grid w-full h-auto grid-cols-2 rounded-xl">
        <TabsTrigger
          className="text-base font-medium rounded-lg"
          value="record"
        >
          Ficha Médica
        </TabsTrigger>
        <TabsTrigger className="text-base font-medium rounded-lg" value="chat">
          Chat
        </TabsTrigger>
      </TabsList>
      <TabsContent value="record" className="flex flex-col flex-grow gap-4">
        <MedicalRecordList />
        <div className="grid grid-cols-2 gap-2">
          <ShareMedicalRecordDrawer />
          <DrawerDialogRecordForm />
        </div>
      </TabsContent>
      <TabsContent value="chat">
        <Chat />
      </TabsContent>
    </Tabs>
  );
}
