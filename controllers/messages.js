const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Message = require("../models/Message");
const MessageRoom = require("../models/MessageRoom");
const auditLog = require("./audit");
const slugify = require("slugify");

const addMessage = asyncHandler(async (req, res, next) => {


  let messageRoom = await MessageRoom.findById(req.body.room);

  if(!messageRoom.users.includes(req.user._id)) {
    return next(
      new ErrorResponse(`User not in room ${req.body.room}`, 404)
    );
  }

  req.body.user = req.user;


  let message = await Message.create(req.body);

  await auditLog("Message", message._id, "created", req.user);
  res.status(200).json({ success: true, data: message });
});

module.exports = {
  addMessage,
};
