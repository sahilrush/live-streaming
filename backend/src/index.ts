import express from "express";
import { AccessToken } from "livekit-server-sdk";
import * as dotenv from "dotenv";

const app = express();
app.use(express.json());
dotenv.config();

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const SERVER_URL = process.env.LIVEKIT_URL;

app.post("/create-meeting", (req, res) => {
  const { teacherId, room } = req.body;

  const token = new AccessToken(API_KEY, API_SECRET, { identity: teacherId });
  token.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
  });

  res.json({ token: token.toJwt(), room, serverUrl: SERVER_URL });
});

app.post("/join-meeting", (req, res) => {
  const { studentId, room } = req.body;
  const token = new AccessToken(API_KEY, API_SECRET, { identity: studentId });
  token.addGrant({
    roomJoin: true,
    room,
    canPublish: false,
    canSubscribe: true,
  });
  res.json({ token: token.toJwt(), room, serverUrl: SERVER_URL });
});

app.listen(8000, () => console.log("Server started at 8000"));
