"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth-controller");
exports.AuthRouter = (0, express_1.Router)();
exports.AuthRouter.post("/auth/register", auth_controller_1.register);
exports.AuthRouter.post("/auth/login", auth_controller_1.login);
