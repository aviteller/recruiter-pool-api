const mongoose = require("mongoose");

const AuditSchema = new mongoose.Schema(
  {
    model: String,
    modelId: String,
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    action: { type: String, default: "" },
  },
  { timestamps: { createdAt: "createdAt" } }
);

module.exports = mongoose.model("Audit", AuditSchema);
