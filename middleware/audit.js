const Audit = require("../models/Audit");

// @desc  saves action to audit table
const logAudit = (model, modelId, action) => async (req, res, next) => {
  let auditBody = {
    model,
    modelId,
    action,
  };

  await Audit.create(auditBody);

  next();
};

module.exports = logAudit;
