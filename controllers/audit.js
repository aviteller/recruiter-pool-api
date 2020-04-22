const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Audit = require("../models/Audit");

const auditLog = async (model, id, action, user) => {
  // console.log("user :>> ", user);
  let auditBody = {
    model,
    modelId: id,
    user: user,
    action,
  };

  await Audit.create(auditBody);
};

module.exports = auditLog;
