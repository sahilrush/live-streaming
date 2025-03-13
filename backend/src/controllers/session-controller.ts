import { Role, SessionStatus } from "@prisma/client";
import { AuthRequest } from "../types";
import { Response } from "express";
import { prisma } from "../utils/config";

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, startTime } = req.body;

    if (!req.user) {
      res.status(401).json({ message: "UnAuthorized" });
      return;
    }

    if (req.user.role !== Role.TEACHER) {
      res.status(403).json({ message: "Only teachers can create sessions" });
      return;
    }

    if (!title) {
      res.status(400).json({ message: "Title is required" });
      return;
    }

    const session = await prisma.session.create({
      data: {
        title,
        description: description || null,
        startTime: startTime ? new Date(startTime) : null,
        status: SessionStatus.SCHEDULED,
        teacherId: req.user.id,
      },
    });
    res.send(201).json(session);
  } catch (error: any) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: "Failed to create session" });
  }
};

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const { status, teacherId, upcoming, past } = req.query;

    if (!req.user) {
      res.status(401).json({ message: "Unauthorixzed" });
    }

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (teacherId) {
      where.teacherId = teacherId as string;
    }

    if (upcoming == "true") {
      where.startTime = { gte: new Date() };
    }

    if (past == "true") {
      where.endTime = { lt: new Date() };
    }

    // If user is a student, show both sessions they're enrolled in
    // and sessions that are available to join

    if (req.user?.role === Role.STUDENT) {
      where.OR = [
        { participants: { some: { studentId: req.user.id } } },
        { status: SessionStatus.SCHEDULED },
      ];
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
        _count: {
          select: { participants: true },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    res.status(200).json(sessions);
  } catch (err) {
    console.error("Error getting sessions:", err);
    res.status(500).json({ message: "Failed to get sessions" });
  }
};
