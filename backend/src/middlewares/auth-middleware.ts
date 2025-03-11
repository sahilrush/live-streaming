import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JwtPayload } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "No token, authorization denied" });
      return;
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dsfjsnjf"
    ) as JwtPayload;

    // Find user by id
   const user = await prisma.user.findUnique({
    where: { id: decoded.id },
   }) 

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    req.user = userWithoutPassword as any;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};
