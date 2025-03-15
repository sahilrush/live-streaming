"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveSession = exports.joinSession = exports.updateSession = exports.getSessionsById = exports.getSessions = exports.createSession = void 0;
const client_1 = require("@prisma/client");
const config_1 = require("../utils/config");
const createSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, startTime } = req.body;
        if (!req.user) {
            res.status(401).json({ message: "UnAuthorized" });
            return;
        }
        if (req.user.role !== client_1.Role.TEACHER) {
            res.status(403).json({ message: "Only teacher`s can create sessions" });
            return;
        }
        if (!title) {
            res.status(400).json({ message: "Title is required" });
            return;
        }
        const session = yield config_1.prisma.session.create({
            data: {
                title,
                description: description || null,
                startTime: startTime ? new Date(startTime) : null,
                status: client_1.SessionStatus.SCHEDULED,
                teacherId: req.user.id,
            },
        });
        res.status(201).json(session);
    }
    catch (error) {
        console.error("Error creating session:", error);
        res.status(500).json({ message: "Failed to create session" });
    }
});
exports.createSession = createSession;
const getSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { status, teacherId, upcoming, past } = req.query;
        if (!req.user) {
            res.status(401).json({ message: "Unauthorixzed" });
        }
        const where = {};
        if (status) {
            where.status = status;
        }
        if (teacherId) {
            where.teacherId = teacherId;
        }
        if (upcoming == "true") {
            where.startTime = { gte: new Date() };
        }
        if (past == "true") {
            where.endTime = { lt: new Date() };
        }
        // If user is a student, show both sessions they're enrolled in
        // and sessions that are available to join
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === client_1.Role.STUDENT) {
            where.OR = [
                { participants: { some: { studentId: req.user.id } } },
                { status: client_1.SessionStatus.SCHEDULED },
            ];
        }
        const sessions = yield config_1.prisma.session.findMany({
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
    }
    catch (err) {
        console.error("Error getting sessions:", err);
        res.status(500).json({ message: "Failed to get sessions" });
    }
});
exports.getSessions = getSessions;
const getSessionsById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!req.user) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        const session = yield config_1.prisma.session.findUnique({
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
    }
    catch (err) {
        console.log(err);
        console.error("Error getting session:", err);
        res.status(500).json({ message: "Failed to get session" });
    }
});
exports.getSessionsById = getSessionsById;
const updateSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description, startTime, status } = req.body;
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const session = yield config_1.prisma.session.findUnique({
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
        if (session.status === client_1.SessionStatus.COMPLETED || client_1.SessionStatus.CANCELLED) {
            res
                .status(400)
                .json({ message: "cannot updated a completed or cancelled session" });
            return;
        }
        const updateSession = yield config_1.prisma.session.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign({}, (title && { title })), (description !== undefined && { description })), (startTime && { startTime: new Date(startTime) })), (status && { status: status })),
        });
        res.status(200).json(updateSession);
    }
    catch (err) {
        console.error("Error updating session:", err);
        res.status(500).json({ message: "Failed to update session" });
    }
});
exports.updateSession = updateSession;
const joinSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        // Only students can join sessions
        if (req.user.role !== client_1.Role.STUDENT) {
            res.status(403).json({ message: "Only students can join sessions" });
            return;
        }
        // Get the session
        const session = yield config_1.prisma.session.findUnique({
            where: { id },
        });
        if (!session) {
            res.status(404).json({ message: "Session not found" });
            return;
        }
        // Check if session is available to join
        if (session.status !== client_1.SessionStatus.SCHEDULED &&
            session.status !== client_1.SessionStatus.LIVE) {
            res
                .status(400)
                .json({ message: "This session is not available for joining" });
            return;
        }
        // Check if student is already a participant
        const existingParticipant = yield config_1.prisma.sessionParticipant.findUnique({
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
        const participant = yield config_1.prisma.sessionParticipant.create({
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
    }
    catch (error) {
        console.error("Error joining session:", error);
        res.status(500).json({ message: "Failed to join session" });
    }
});
exports.joinSession = joinSession;
const leaveSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!req.user) {
            res.status(403).json({ messaage: "Unauthorized" });
            return;
        }
        const particiapnt = yield config_1.prisma.sessionParticipant.findUnique({
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
        yield config_1.prisma.sessionParticipant.delete({
            where: {
                id: particiapnt.id,
            },
        });
        res.status(200).json({ message: "Successfully  left the session" });
    }
    catch (err) {
        console.error("Error leaving session:", err);
        res.status(500).json({ message: "Failed to leave session" });
    }
});
exports.leaveSession = leaveSession;
