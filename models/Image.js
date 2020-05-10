const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a title"],
    // unique: true,
    trim: true,
    maxlength: [50, "Title can not be more than 50 characters"],
  },
  image: {
    type: String,
    default: "no-photo.jpg",
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: "Company",
  },
  job: {
    type: mongoose.Schema.ObjectId,
    ref: "Job",
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  imageType: {
    type: String,
    required: true,
    enum: ["logos", "teams", "sites", "users"],
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Image", ImageSchema);
