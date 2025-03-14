import { Router } from "express";
import {
  createSession,
  getSessions,
  getSessionsById,
  joinSession,
  leaveSession,
  updateSession,
} from "../controllers/session-controller";
import { authenticate } from "../middlewares/auth-middleware";

export const SessionRoute = Router();

SessionRoute.post("/session/create", authenticate, createSession);
SessionRoute.get("/session/", authenticate, getSessions);
SessionRoute.get("/session/:id", authenticate, getSessionsById);
SessionRoute.put("/session/:id", authenticate, updateSession);
SessionRoute.post("/session/:id/join", authenticate, joinSession);
SessionRoute.post("/session/:id/leave", authenticate, leaveSession);
