import { Router } from "express";
import { authenticate } from "../middlewares/auth-middleware";
import {
  createRoom,
  endRoom,
  generateToken,
  getRoomDetails,
} from "../controllers/livekit-controller";

export const LivekitRouter = Router();

LivekitRouter.post("/rooms/sessionId", authenticate, createRoom);
LivekitRouter.get("/rooms/sessionId", authenticate, getRoomDetails);
LivekitRouter.post("/token/:sessionId", authenticate, generateToken);
LivekitRouter.post("/rooms/:sessionId/end", authenticate, endRoom);
