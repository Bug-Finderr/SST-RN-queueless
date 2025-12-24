import type mongoose from "mongoose";
import type { Document } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUser {
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
}
