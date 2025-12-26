import type mongoose from "mongoose";
import type { Document } from "mongoose";

export type TokenStatus =
  | "waiting"
  | "being_served"
  | "completed"
  | "skipped"
  | "canceled";

export interface IToken {
  tokenNumber: number;
  userId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  status: TokenStatus;
  createdAt: Date;
  calledAt?: Date;
  completedAt?: Date;
}

export interface ITokenDocument extends IToken, Document {
  _id: mongoose.Types.ObjectId;
}

// Token with populated service (after .populate())
export interface PopulatedToken extends Omit<IToken, "serviceId"> {
  _id: mongoose.Types.ObjectId;
  serviceId: {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    avgServiceTimeMins?: number;
  };
}
