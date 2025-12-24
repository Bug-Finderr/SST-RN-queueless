import mongoose, { type Model, Schema } from "mongoose";
import type { ITokenDocument } from "../types";

const tokenSchema = new Schema<ITokenDocument>(
  {
    tokenNumber: {
      type: Number,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for user's tokens lookup
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true, // Index for service queue lookup
    },
    status: {
      type: String,
      enum: ["waiting", "being_served", "completed", "skipped", "canceled"],
      default: "waiting",
      index: true, // Index for status filtering
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true, // Index for ordering
    },
    calledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

// Compound indexes for common query patterns
// Queue lookup: find waiting tokens for a service, ordered by creation
tokenSchema.index({ serviceId: 1, status: 1, createdAt: 1 });

// User's active tokens: check if user has active token for a service
tokenSchema.index({ userId: 1, serviceId: 1, status: 1 });

// Daily token number lookup (for generating next token number)
tokenSchema.index({ serviceId: 1, createdAt: -1 });

// Transform _id to id in JSON output
tokenSchema.set("toJSON", {
  virtuals: true,
  // biome-ignore lint/suspicious/noExplicitAny: mongoose toJSON transform requires any
  transform: (_doc: any, ret: any) => {
    ret.id = String(ret._id);
    ret.userId = ret.userId ? String(ret.userId) : undefined;
    ret.serviceId = ret.serviceId ? String(ret.serviceId) : undefined;
    delete ret._id;
    return ret;
  },
});

export const Token: Model<ITokenDocument> =
  mongoose.models.Token || mongoose.model<ITokenDocument>("Token", tokenSchema);

// Helper: Get start of today (UTC)
export function getTodayStart(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}
