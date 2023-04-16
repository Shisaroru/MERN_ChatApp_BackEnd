import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    friendList: {
        type: Array,
        default: [],
    },
    groupList: {
        type: Array,
        default: [],
    },
},
{
    timestamps: true,
},
);

export default mongoose.model("Users", userSchema);