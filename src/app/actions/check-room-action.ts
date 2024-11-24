"use server";

import { checkRoom } from "@/lib/repositories/rooms";
import { redirect } from "next/navigation";

export const checkRoomAction = async (roomId: string) => {
  const roomState = await checkRoom(roomId);

  if (!roomState.hasSender || roomState.hasReceiver) {
    throw new Error("Room not found");
  }

  redirect(`/doctor/${roomId}`);
};
