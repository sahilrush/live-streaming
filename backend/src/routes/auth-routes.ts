import { Router } from "express";
import { login, register } from "../controllers/auth-controller";

export const AuthRouter = Router();

AuthRouter.post("/auth/register", register);
AuthRouter.post("/auth/login", login);

