import { RoomServiceClient, CreateOptions } from "livekit-server-sdk";
import { Response } from "express";
import { AuthRequest } from "../types";

import { PrismaClient, SessionStatus } from "@prisma/client";

const prisma = new PrismaClient();

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL || "",
  process.env.LIVEKIT_API_KEY || "",
  process.env.LIVEKIT_API_SECRET || ""
);

export const createRoom = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { teacher: true },
    });

    if (!session) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    if (session.teacherId != req.user.id) {
      res
        .status(403)
        .json({ message: "only the sesssion teacher can create a room " });
      return;
    }

    const roomName = `session-${sessionId}`;

    const roomOptions: CreateOptions = {
      name: roomName,
      emptyTimeout: 10 * 60,
      maxParticipants: 10,
      metadata: JSON.stringify({
        sessionId,
        teacherId: session.teacherId,
        title: session.title,
      }),
    };

    const room = await roomService.createRoom(roomOptions);

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        livekitRoom: roomName,
        status: SessionStatus.LIVE,
        startTime: new Date(),
      },
    });

    res.status(201).json({
      message: "Room created Successfully",
      room: {
        name: room.name,
        emptyTimeout: room.emptyTimeout,
        maxParticipants: room.maxParticipants,
        creationTime: room.creationTime,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create room" });
  }
};

export const getRoomDetails = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
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
      res.status(404).json({ message: "Session not found" });
      return;
    }

    if (!session.livekitRoom) {
      res
        .status(404)
        .json({ message: "This session does not have an active rooms" });
      return;
    }

    const rooms = await roomService.listRooms();

    const room = rooms.find((e) => e.name === session.livekitRoom);

    if (!room) {
      console.log("Room not found");
    }

    const isTeacher = session.teacherId === req.user.id;
    const isParticipant = session.participants.some(
      (p) => p.studentId === req.user?.id
    );

    if (!isTeacher && !isParticipant) {
      res
        .status(403)
        .json({ message: "you do not have the access to this room" });
    }

    const participantCount = session.participants.length;
    res.status(200).json({
      room: {
        name: room?.name,
        numParticipants: participantCount,
        maxParticipants: room?.maxParticipants,
        activeRecording: room?.activeRecording,
        creationTime: room?.creationTime,
      },
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        status: session.status,
        teacher: session.teacher,
        participantCount,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get  room details" });
  }
};


