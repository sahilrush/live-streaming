import express, { Request, Response } from "express";
import * as dotenv from "dotenv";
import { AccessToken } from "livekit-server-sdk";
import cors from "cors";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const SERVER_URL = process.env.LIVEKIT_URL;

if (!SERVER_URL) {
  console.error("Server URL is missing");
}

console.log("Server URL configured:", SERVER_URL);
console.log(
  "API credentials loaded:",
  API_KEY ? "Yes" : "No",
  API_SECRET ? "Yes" : "No"
);

interface CreateMeeting {
  teacherId: string;
  room: string;
}

interface JoinMeeting {
  studentId: string;
  room: string;
}

app.post(
  "/create-meeting",
  async (
    req: Request<{}, any, CreateMeeting>,
    res: Response
  ): Promise<void> => {
    console.log("hitting the postman");
    const { teacherId, room } = req.body;

    if (!API_KEY || !API_SECRET) {
      res.status(500).json({ error: "LiveKit API credentials are missing" });
      return;
    }

    if (!teacherId || !room) {
      res.status(400).json({ error: "teacherId and room are required" });
      return;
    }

    try {
      const token = new AccessToken(API_KEY, API_SECRET, {
        identity: teacherId,
      });
      token.addGrant({
        roomJoin: true,
        room,
        canPublish: true,
        canSubscribe: true,
      });

      const jwtToken = await token.toJwt();
      console.log("Generated JWT:", jwtToken);
      console.log(
        `Token generated successfully for teacher: ${teacherId} in room: ${room}`
      );

      res.status(200).json({ token: jwtToken, room, serverUrl: SERVER_URL });
    } catch (err) {
      console.error("Token Generation Error:", err);
      res.status(500).json({ error: "Failed to generate token" });
    }
  }
);

app.post(
  "/join- ",
  async (req: Request<{}, JoinMeeting>, res: Response): Promise<void> => {
    const { studentId, room } = req.body;

    if (!API_KEY || !API_SECRET) {
      res.status(500).json({ error: "LiveKit API credentials are missing" });
      return;
    }
    console.log(API_KEY, API_SECRET);

    if (!studentId || !room) {
      res.status(400).json({ error: "studentId and room are required" });
      return;
    }

    
    try {
      const token = new AccessToken(API_KEY, API_SECRET, {
        identity: studentId,
      });
      token.addGrant({
        roomJoin: true,
        room,
        canPublish: false,
        canSubscribe: true,
      });

      const jwtToken = await token.toJwt();

      console.log(
        `Token generated successfully for student: ${studentId} in room: ${room}`
      );

      res.status(200).json({ token: jwtToken, room, serverUrl: SERVER_URL });
    } catch (err) {
      console.error("Token Generation Error:", err);
      res.status(500).json({ error: "Failed to generate token" });
    } 
  }
);

app.listen(8000, () => console.log("Server started at port 8000"));
