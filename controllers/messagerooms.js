const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const MessageRoom = require("../models/MessageRoom");
const auditLog = require("./audit");
const slugify = require("slugify");

// @desc    Get All jobs
// @route   GET /api/v1/messagerooms
// @access  Public
const getMessageRooms = asyncHandler(async (req, res, next) => {
  return res.status(200).json(res.advancedResults);
});

// @desc    Get All jobs
// @route   GET /api/v1/messagerooms/:id ? slug
// @access  Public
const getMessageRoom = asyncHandler(async (req, res, next) => {
  let messageroom;
  if (req.params.id) {
    messageroom = await MessageRoom.findOne({ slug: req.params.slug })
      .populate({
        path: "messages",
        options: { limit: 50, sort: "-createdAt" },
      })
      .populate({
        path: "users",
        select: "name _id",
      });
  } else {
    messageroom = await MessageRoom.findOne({ slug: req.params.slug })
      .populate({
        path: "messages",
        options: { limit: 50, sort: "-createdAt" },
      })
      .populate({
        path: "users",
        select: "name _id",
      });
  }

  if (!messageroom) {
    return next(
      new ErrorResponse(`message room not found with id ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: messageroom });
});

// @desc    Add job
// @route   POST /api/v1/companies/:companyId/jobs
// @access  Private
const addMessageRoom = asyncHandler(async (req, res, next) => {
  let users = req.body.users.map((user) => user.user);
  let names = req.body.users.map((user) => user.name);

  names = names.join(" ");

  const existingRoom = await MessageRoom.findOne({
    users: users,
    deleted: false,
  });

  if (existingRoom) {
    return next(
      new ErrorResponse(`messsage room with users already exsits`, 404)
    );
  }

  let messageroom = await MessageRoom.create({
    users: users,
    slug: slugify(names, { lower: true }),
  });

  await auditLog("MessageRoom", messageroom._id, "created", req.user);
  res.status(200).json({ success: true, data: messageroom });
});

// @desc    update job
// @route   Put /api/v1/jobs/:id
// @access  Private
const updateJob = asyncHandler(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  //make sure user is company owner
  if (job.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update job : ${job._id}`,
        401
      )
    );
  }

  if (!job) {
    return next(
      new ErrorResponse(`Job not found with id ${req.params.id}`, 404)
    );
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await auditLog("Job", job._id, "updated", req.user, {
    parentModel: "Company",
    parentId: job.company,
  });

  
  res.status(200).json({ success: true, data: job });
});

// @desc    Delete jobs
// @route   DELETE /api/v1/jobs/:id
// @access  Private
const deleteMessageRoom = asyncHandler(async (req, res, next) => {
  const messageRoom = await MessageRoom.findById(req.params.id);

  if (!messageRoom) {
    return next(
      new ErrorResponse(`Job not found with id ${req.params.id}`, 404)
    );
  }

  //make sure user is company owner
  // if (job.user.toString() !== req.user.id && req.user.role !== "admin") {
  //   return next(
  //     new ErrorResponse(
  //       `User ${req.user.id} is not authorized to delete job  ${job._id}`,
  //       401
  //     )
  //   );
  // }
  await MessageRoom.findByIdAndUpdate(req.params.id, {
    deleted: true,
  });
  // await job.remove();
  await auditLog("MessageRoom", messageRoom._id, "deleted", req.user);
  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  getMessageRooms,
  getMessageRoom,
  addMessageRoom,
  deleteMessageRoom,
};
