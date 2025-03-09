"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
const livekit_server_sdk_1 = require("livekit-server-sdk");
const cors_1 = __importDefault(require("cors"));
dotenv.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const SERVER_URL = process.env.LIVEKIT_URL;
if (!SERVER_URL) {
    console.error("Server URL is missing");
}
console.log("Server URL configured:", SERVER_URL);
console.log("API credentials loaded:", API_KEY ? "Yes" : "No", API_SECRET ? "Yes" : "No");
app.post("/create-meeting", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const token = new livekit_server_sdk_1.AccessToken(API_KEY, API_SECRET, {
            identity: teacherId,
        });
        token.addGrant({
            roomJoin: true,
            room,
            canPublish: true,
            canSubscribe: true,
        });
        const jwtToken = yield token.toJwt();
        console.log("Generated JWT:", jwtToken);
        console.log(`Token generated successfully for teacher: ${teacherId} in room: ${room}`);
        res.status(200).json({ token: jwtToken, room, serverUrl: SERVER_URL });
    }
    catch (err) {
        console.error("Token Generation Error:", err);
        res.status(500).json({ error: "Failed to generate token" });
    }
}));
app.post("/join- ", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const token = new livekit_server_sdk_1.AccessToken(API_KEY, API_SECRET, {
            identity: studentId,
        });
        token.addGrant({
            roomJoin: true,
            room,
            canPublish: false,
            canSubscribe: true,
        });
        const jwtToken = yield token.toJwt();
        console.log(`Token generated successfully for student: ${studentId} in room: ${room}`);
        res.status(200).json({ token: jwtToken, room, serverUrl: SERVER_URL });
    }
    catch (err) {
        console.error("Token Generation Error:", err);
        res.status(500).json({ error: "Failed to generate token" });
    }
}));
app.listen(8000, () => console.log("Server started at port 8000"));
