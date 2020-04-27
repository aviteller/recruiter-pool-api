const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  logout,
} = require("../controllers/auth");
const { protect } = require("../middleware/auth");

const User = require("../models/User");

router.post("/register", register);
router.get("/logout", logout);
router.get("/test", (req, res) => {
  console.log(req.cookies);
  res.status(200).json({ success: true, data: {} });
});
router.put("/test", (req, res) => {
  console.log("Put", req.cookies);
  res.status(200).json({ success: true, data: {} });
});
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/updatedetails", protect, updateDetails);
router.put("/updatepassword", protect, updatePassword);
router.post("/forgotPassword", forgotPassword);
router.put("/resetPassword/:resettoken", resetPassword);

module.exports = router;
