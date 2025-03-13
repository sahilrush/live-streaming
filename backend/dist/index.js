"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const livekit_routes_1 = require("./routes/livekit-routes");
const auth_routes_1 = require("./routes/auth-routes");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api", auth_routes_1.AuthRouter);
app.use("/api", livekit_routes_1.LivekitRouter);
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
    console.log(`error the server is running on part ${PORT}`);
});
