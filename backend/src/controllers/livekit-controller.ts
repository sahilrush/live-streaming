import {
  RoomServiceClient,
  CreateOptions,
  AccessToken,
} from "livekit-server-sdk";
import { Response } from "express";
import { AuthRequest } from "../types";
import { prisma } from "../utils/config";
import { Role, SessionStatus } from "@prisma/client";

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
        .json({ message: "Only the session teacher can create a room" });
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
        creationTime: room.creationTime.toString(),
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
        .json({ message: "This session does not have an active room" });
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
      res.status(403).json({ message: "You do not have access to this room" });
      return;
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
    res.status(500).json({ message: "Failed to get room details" });
  }
};

// Generate token
export const generateToken = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { metadata } = req.body;

    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          where: { studentId: req.user.id }, // Fixed: Changed from sessionId to studentId
        },
      },
    });

    if (!session) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    if (!session.livekitRoom) {
      if (session.teacherId === req.user.id) {
        try {
          const roomName = `session-${sessionId}`; // Fixed: Changed from session= to session-
          await roomService.createRoom({
            name: roomName,
            emptyTimeout: 10 * 60,
            maxParticipants: 100,
            metadata: JSON.stringify({
              sessionId,
              teacherId: session.teacherId,
              title: session.title,
            }),
          });

          await prisma.session.update({
            where: { id: sessionId },
            data: {
              livekitRoom: roomName,
              status: SessionStatus.LIVE,
              startTime: new Date(),
            },
          });

          // Update our local copy of session
          session.livekitRoom = roomName;
        } catch (err) {
          console.error("Error auto-creating room:", err);
          res.status(500).json({ message: "Failed to create room" });
          return;
        }
      } else {
        res
          .status(404)
          .json({ message: "This session does not have an active room yet" });
        return;
      }
    }

    const roomName = session.livekitRoom;

    const isTeacher = session.teacherId === req.user.id;
    const isParticipant = session.participants.length > 0; // Fixed: This checks if the user is a participant

    if (req.user.role === Role.STUDENT && !isParticipant && !isTeacher) {
      try {
        await prisma.sessionParticipant.create({
          data: {
            studentId: req.user.id,
            sessionId: sessionId,
          },
        });
      } catch (err) {
        console.error("Error adding participant", err);
      }
    }

    // Determine user's role in this room
    const isPublisher = isTeacher;

    // Create identity with userInfo
    const identity = {
      userId: req.user.id,
      name: req.user.name,
      role: req.user.role,
      isTeacher,
    };

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY || "",
      process.env.LIVEKIT_API_SECRET || "",
      {
        identity: JSON.stringify(identity),
        name: req.user.name,
        metadata: JSON.stringify({
          ...identity,
          profilePicture: req.user.profilePicture,
          ...(metadata || {}),
        }),
      }
    );

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: isPublisher, // Only teachers can publish by default
      canSubscribe: true, // Everyone can subscribe
      canPublishData: true, // Everyone can send data - for chat, etc.
    });

    const jwt = token.toJwt();
    res.status(200).json({ token: jwt });
  } catch (err) {
    console.error("Error generating token", err);
    res.status(500).json({ message: "Failed to generate token" });
  }
};

export const endRoom = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    if (session.teacherId !== req.user.id) {
      res
        .status(403)
        .json({ message: "Only the session teacher can end the session" });
      return;
    }

    if (!session.livekitRoom) {
      res
        .status(404)
        .json({ message: "This session does not have an active room" });
      return;
    }

    await roomService.deleteRoom(session.livekitRoom);

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        endTime: new Date(),
        livekitRoom: null, // Clear the room name
      },
    });

    res.status(200).json({ message: "Room ended successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to end the session" });
  }
};
