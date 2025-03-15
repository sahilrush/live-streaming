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
      res.status(403).json({ message: "Only teacher`s can create sessions" });
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
    res.status(201).json(session);
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

export const getSessionsById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
        participants: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      res.status(404).json({ message: "session not found" });
      return;
    }
    res.status(200).json(session);
  } catch (err) {
    console.log(err);
    console.error("Error getting session:", err);
    res.status(500).json({ message: "Failed to get session" });
  }
};

export const updateSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, startTime, status } = req.body;

    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      res.status(403).json({ message: "Session not found" });
      return;
    }

    if (session.teacherId !== req.user.id) {
      res
        .status(403)
        .json({ message: "only the session teacher can update the session" });
      return;
    }

    if (session.status === SessionStatus.COMPLETED || SessionStatus.CANCELLED) {
      res
        .status(400)
        .json({ message: "cannot updated a completed or cancelled session" });
      return;
    }

    const updateSession = await prisma.session.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(status && { status: status as SessionStatus }),
      },
    });

    res.status(200).json(updateSession);
  } catch (err) {
    console.error("Error updating session:", err);
    res.status(500).json({ message: "Failed to update session" });
  }
};
export const joinSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Only students can join sessions
    if (req.user.role !== Role.STUDENT) {
      res.status(403).json({ message: "Only students can join sessions" });
      return;
    }

    // Get the session
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    // Check if session is available to join
    if (
      session.status !== SessionStatus.SCHEDULED &&
      session.status !== SessionStatus.LIVE
    ) {
      res
        .status(400)
        .json({ message: "This session is not available for joining" });
      return;
    }

    // Check if student is already a participant
    const existingParticipant = await prisma.sessionParticipant.findUnique({
      where: {
        studentId_sessionId: {
          studentId: req.user.id,
          sessionId: id,
        },
      },
    });

    if (existingParticipant) {
      res
        .status(200)
        .json({ message: "You are already a participant in this session" });
      return;
    }

    // Add student as a participant
    const participant = await prisma.sessionParticipant.create({
      data: {
        studentId: req.user.id,
        sessionId: id,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Successfully joined the session",
      participant,
    });
  } catch (error) {
    console.error("Error joining session:", error);
    res.status(500).json({ message: "Failed to join session" });
  }
};

export const leaveSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(403).json({ messaage: "Unauthorized" });
      return;
    }

    const particiapnt = await prisma.sessionParticipant.findUnique({
      where: {
        studentId_sessionId: {
          studentId: req.user.id,
          sessionId: id,
        },
      },
    });

    if (!particiapnt) {
      res
        .status(404)
        .json({ message: "You are not participant in this session" });
      return;
    }

    await prisma.sessionParticipant.delete({
      where: {
        id: particiapnt.id,
      },
    });

    res.status(200).json({ message: "Successfully  left the session" });
  } catch (err) {
    console.error("Error leaving session:", err);
    res.status(500).json({ message: "Failed to leave session" });
  }
};
