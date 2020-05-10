const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [2000, "Text can not be more than 2000 characters"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: mongoose.Schema.ObjectId,
      ref: "MessageRoom",
      required: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "createdAt" },
  }
);

module.exports = mongoose.model("Message", MessageSchema);
