import type mongoose from "mongoose";
import type { Document } from "mongoose";

export interface IService {
  name: string;
  description: string;
  avgServiceTimeMins: number;
  isActive: boolean;
  createdAt: Date;
}

export interface IServiceDocument extends IService, Document {
  _id: mongoose.Types.ObjectId;
}
