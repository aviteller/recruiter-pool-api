const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const auditLog = require("./audit");

// @desc    Get All Users
// @route   GET /api/v1/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get Single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user)
    return next(
      new ErrorResponse(`User with ID ${req.params.id} Not Found`, 401)
    );

  res.status(200).json({ success: true, data: user });
});
// @desc    Create user
// @route   Post /api/v1/users/
// @access  Private/Admin

const createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);
  await auditLog("User", user._id, "created", req.user);

  res.status(201).json({ success: true, data: user });
});

// @desc    Update user
// @route   Put /api/v1/users/:id
// @access  Private/Admin

const updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);
  if (!user)
    return next(
      new ErrorResponse(`User with ID ${req.params.id} Not Found`, 401)
    );

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  await auditLog("User", user._id, "updated", req.user);
  res.status(200).json({ success: true, data: user });
});

// @desc    delete user
// @route   delete /api/v1/users/:id
// @access  Private/Admin

const deleteUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user)
    return next(
      new ErrorResponse(`User with ID ${req.params.id} Not Found`, 401)
    );

  //changing from perma delete to marking deleted as true
  // await user.remove();
  await User.findByIdAndUpdate(req.params.id, {
    deleted: true,
  });
  await auditLog("User", user._id, "deleted", req.user);
  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
