const mongoose = require("mongoose");
const slugify = require("slugify");

const MessageRoomSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
    slug: String,
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "createdAt" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// MessageRoomSchema.post("save", async function (next) {
// console.log('this.users :>> ', this.users);
//   userNames = userNames.join(" ");
//   console.log('object :>> ', userNames);
//   this.slug = slugify(this.users, { lower: true });

//   next();
// });

// reverse populate with virtuals
MessageRoomSchema.virtual("messages", {
  ref: "Message",
  localField: "_id",
  foreignField: "room",
  justOne: false,
  match: { deleted: false },
});

module.exports = mongoose.model("MessageRoom", MessageRoomSchema);
