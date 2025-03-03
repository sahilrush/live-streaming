"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const livekit_server_sdk_1 = require("livekit-server-sdk");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const API_KEY = "";
const API_SECRET = "";
const SERVER_URL = "";
app.post("/create-meeting", (req, res) => {
    const { teacherId, room } = req.body;
    const token = new livekit_server_sdk_1.AccessToken(API_KEY, API_SECRET, { identity: teacherId });
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
    const token = new livekit_server_sdk_1.AccessToken(API_KEY, API_SECRET, { identity: studentId });
    token.addGrant({
        roomJoin: true,
        room,
        canPublish: false,
        canSubscribe: true,
    });
    res.json({ token: token.toJwt(), room, serverUrl: SERVER_URL });
});
app.listen(8000, () => console.log("Server started at 8000"));
