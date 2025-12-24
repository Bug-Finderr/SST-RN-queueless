import mongoose, { type Model, Schema } from "mongoose";
import type { IUserDocument } from "../types";

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Optimize queries
    timestamps: false,
    // Don't include __v version key
    versionKey: false,
  },
);

// Index for email lookups (unique constraint creates index automatically)
// Additional compound indexes can be added here if needed

// Transform _id to id in JSON output
userSchema.set("toJSON", {
  virtuals: true,
  // biome-ignore lint/suspicious/noExplicitAny: mongoose toJSON transform requires any
  transform: (_doc: any, ret: any) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.passwordHash; // Never expose password hash
    return ret;
  },
});

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
