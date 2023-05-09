import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    requestee: {
      type: String,
      required: true,
    },
    targetUser: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Requests", requestSchema);
