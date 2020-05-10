const express = require("express");
const router = express.Router();
const {
  getMessageRooms,
  getMessageRoom,
  addMessageRoom,
  deleteMessageRoom
} = require("../controllers/messagerooms");


const { protect, authorize } = require("../middleware/auth");

const MessageRoom = require("../models/MessageRoom");
const advancedResults = require("../middleware/advancedResults");

router
  .route("/")
  .get(advancedResults(MessageRoom, "messages,users"), getMessageRooms)
  .post(protect, addMessageRoom);

router.route("/:id").get(getMessageRoom).delete(deleteMessageRoom);
router.route("/slug/:slug").get(getMessageRoom)

module.exports = router;