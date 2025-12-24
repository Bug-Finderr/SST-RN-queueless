import mongoose, { type Model, Schema } from "mongoose";
import type { IServiceDocument } from "../types";

const serviceSchema = new Schema<IServiceDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    avgServiceTimeMins: {
      type: Number,
      required: true,
      min: 1, // Fix: Validate min value (Python version didn't)
      max: 480, // 8 hours max
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Index for filtering active services
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

// Transform _id to id in JSON output
serviceSchema.set("toJSON", {
  virtuals: true,
  // biome-ignore lint/suspicious/noExplicitAny: mongoose toJSON transform requires any
  transform: (_doc: any, ret: any) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export const Service: Model<IServiceDocument> =
  mongoose.models.Service ||
  mongoose.model<IServiceDocument>("Service", serviceSchema);
