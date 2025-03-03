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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const livekit_server_sdk_1 = require("livekit-server-sdk");
const dotenv = __importStar(require("dotenv"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
dotenv.config();
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const SERVER_URL = process.env.LIVEKIT_URL;
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
