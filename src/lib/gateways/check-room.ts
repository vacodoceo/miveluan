import "server-only";

const SERVER_URL =
  process.env.NEXT_PUBLIC_WEBRTC_SERVER_URL || "http://localhost:8081";

export const checkRoom = async (
  roomId: string
): Promise<{ hasSender: boolean; hasReceiver: boolean }> => {
  const room = await fetch(`${SERVER_URL}/rooms/${roomId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!room.ok) {
    throw new Error("Error checking room");
  }

  const data = await room.json();

  return data;
};
