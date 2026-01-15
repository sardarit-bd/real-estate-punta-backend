import { model, Schema } from "mongoose";

export const Role = {
    TENANT: 'tenant',
    OWNER: 'owner',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
}

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
    avatar: {
        type: String,
    },
}, {
    timestamps: true,
    versionKey: false
})

const tenantSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    phoneNumber: {
        type: String,
    },
    address: {
        type: String,
    },
    country: {
        type: String,
    },
    city: {
        type: String,
    },
    phone: {
        type: String,
    },
    documents: [{
        name: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
}, {
    timestamps: true,
    versionKey: false
})

const ownerSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    phoneNumber: {
        type: String,
    },
    address: {
        type: String,
    },
    country: {
        type: String,
    },
    city: {
        type: String,
    },
    phone: {
        type: String,
    },
    documents: [{
        name: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
}, {
    timestamps: true,
    versionKey: false
})

      avatar: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User = model("User", userSchema)
export const Tenant = model("Tenant", tenantSchema)
export const Owner = model("Owner", ownerSchema)
