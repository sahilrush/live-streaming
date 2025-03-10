import { RoomServiceClient } from "livekit-server-sdk";
import { Request, Response } from "express";

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL || "",
  process.env.LIVEKIT_API_KEY || "",
  process.env.LIVEKIT_API_SECRET || ""
);

export const createRoom = async (req: Request, res: Response) => {
  try{

    const {sessionId} = req.body ; 
  
  }
};
