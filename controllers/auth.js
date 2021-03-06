const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const Company = require("../models/Company");
const auditLog = require("./audit");
// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  //create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  await auditLog("User", user._id, "created");

  sendTokenResponse(user, 200, res);
});

// @desc    login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //validate email and password
  if (!email || !password) {
    return next(new ErrorResponse(`Please provide email and password`, 400));
  }

  // check for user
  const user = await User.findOne({ email }).select`+password`;

  if (!user) return next(new ErrorResponse(`Invalid credititals `, 401));

  //check password matchs

  const isMatch = await user.matchPassword(password);

  if (!isMatch) return next(new ErrorResponse(`Invalid credititals `, 401));

  sendTokenResponse(user, 200, res);
});

// @desc    Reset password
// @route   Put /api/v1/auth/resetpassword/:resettoken
// @access  Pulic
const resetPassword = asyncHandler(async (req, res, next) => {
  //get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse(`Invalid Token `, 400));
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   Get /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.user.id);

  const company = await Company.findOne({ user: req.user.id });
  if (company) {
    user = user.toObject();
    user.company = company;
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});
// @desc    logout /clear cookie
// @route   Get /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc   Update Password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
const updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  //check current password
  if (!(await user.matchPassword(req.body.currentPassword)))
    return next(new ErrorResponse(`Password Incorrect`, 401));

  user.password = req.body.newPassword;

  await user.save();

  await auditLog("User", user._id, "updated", req.user);

  sendTokenResponse(user, 200, res);
});

// @desc    Update user deets
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
const updateDetails = asyncHandler(async (req, res, next) => {
  let fieldsToUpdate = {};
  const { name, email } = req.body;

  if (name) fieldsToUpdate.name = name;
  if (email) fieldsToUpdate.email = email;

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  await auditLog("User", user._id, "updated", req.user);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Forgot password
// @route   Post /api/v1/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse(`No user with email ${req.body.email}`, 404));
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  //create reset url
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email becuase you (or soneome else) has requested the reset of a password. Please make a PUT request to \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });

    res.status(200).json({
      success: true,
      data: "Email Sent",
    });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse(`Emnail could not be sent`, 500));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

const sendTokenResponse = (user, statusCode, res) => {
  //create token
  const token = user.getSignedJwtToken();
  // console.log('user :>> ', user);
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  let userToSend = {
    name: user.name,
    email: user.email,
    role: user.role,
    token,
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, data: userToSend });
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  logout,
};
