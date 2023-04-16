import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
    },
    members: {
        type: Array,
        default: [],
        required: true,
    },
    admin: {
        type: Array,
        default: [],
        required: true,
    },
    latestMessage: {
        type: String,
        trim: true,
    },
},
{
    timestamps: true,
},
);

export default mongoose.model("Groups", groupSchema);