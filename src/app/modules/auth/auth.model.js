import { model, Schema } from "mongoose";


const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    role: {
        type: String,
        default: 'owner'
    },

}, {
    timestamps: true,
    versionKey: false
})


export const User = model("User", userSchema)
