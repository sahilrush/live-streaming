// Make sure you're importing Request from express
import { Request, Response } from 'express';
import { User,Role } from '@prisma/client'; // Or wherever your User type is defined

// Correctly extend the Request interface
export interface AuthRequest extends Request {
  user?: User;
}

export interface JwtPayload {

  id:string;
  role:Role 
}