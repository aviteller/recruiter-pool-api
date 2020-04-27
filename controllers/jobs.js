const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Job = require("../models/Job");
const Company = require("../models/Company");
const auditLog = require("./audit");

// @desc    Get All jobs
// @route   GET /api/v1/jobs
// @route   GET /api/v1/companies/:companyId/jobs
// @access  Public
const getJobs = asyncHandler(async (req, res, next) => {
  if (req.params.companyId) {
    const jobs = await Job.find({ company: req.params.companyId });
    return res
      .status(200)
      .json({ success: true, count: jobs.length, data: jobs });
  } else {
    return res.status(200).json(res.advancedResults);
  }
});

// @desc    Get All jobs
// @route   GET /api/v1/jobs/:id
// @access  Public
const getJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate({
    path: "job",
    select: "name description",
  });

  if (!job) {
    return next(
      new ErrorResponse(`Job not found with id ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: job });
});

// @desc    Add job
// @route   POST /api/v1/companies/:companyId/jobs
// @access  Private
const addJob = asyncHandler(async (req, res, next) => {
  // adding company to req.body
  req.body.company = req.params.companyId;

  // add user to req.body
  req.body.user = req.user;

  const company = await Company.findById(req.params.companyId);

  if (!company) {
    return next(
      new ErrorResponse(
        `Company not found with id ${req.params.companyId}`,
        404
      )
    );
  }

  //make sure user is company owner
  if (company.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a job to company: ${req.params.companyId}`,
        401
      )
    );
  }

  const job = await Job.create(req.body);
  await auditLog("Job", job._id, "created", req.user, {
    parentModel: "Company",
    parentId: company._id,
  });
  res.status(200).json({ success: true, data: job });
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
const deleteJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return next(
      new ErrorResponse(`Job not found with id ${req.params.id}`, 404)
    );
  }

  //make sure user is company owner
  if (job.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete job  ${job._id}`,
        401
      )
    );
  }
  await Job.findByIdAndUpdate(req.params.id, {
    deleted: true,
  });
  // await job.remove();
  await auditLog("Job", job._id, "deleted", req.user, {
    parentModel: "Company",
    parentId: job.company,
  });
  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  getJobs,
  getJob,
  addJob,
  updateJob,
  deleteJob,
};
