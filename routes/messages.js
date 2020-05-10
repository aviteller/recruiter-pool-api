const express = require("express");
const router = express.Router();
const { addMessage } = require("../controllers/messages");

const { protect, authorize } = require("../middleware/auth");

router.route("/").post(protect, addMessage);

module.exports = router;
