import { model, Schema } from "mongoose";

export const Role = {
  TENANT: "tenant",
  OWNER: "owner",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
};

const userSchema = new Schema(
  {
    // ===== Auth =====
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.TENANT,
    },

    // ===== Profile =====
    profile: {
      phone: { type: String, default: "" },
      company: { type: String, default: "" },
      bio: { type: String, default: "" },

      address: {
        street: { type: String, default: "" },
        city: { type: String, default: "" },
        country: { type: String, default: "" },
      },

      avatar: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User = model("User", userSchema);
