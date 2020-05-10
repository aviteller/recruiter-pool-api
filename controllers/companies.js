const path = require("path");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const geocoder = require("../utils/geocoder");
const Company = require("../models/Company");
const Image = require("../models/Image");
const auditLog = require("./audit");

// @desc    Get All Companies
// @route   GET /api/v1/companiess
// @access  Public
const getCompanies = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get Single companies
// @route   GET /api/v1/companies/:id
// @access  Public
const getCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id)
    .populate("user")
    .populate("jobs")
    .populate("images");

  if (!company) {
    return next(
      new ErrorResponse(`Company not found with id ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: company });
});

// @desc    Create new company
// @route   POST /api/v1/companies
// @access  Private
const createCompany = asyncHandler(async (req, res, next) => {
  // add user to req.body
  req.body.user = req.user;

  //check for published company
  const publishedCompany = await Company.findOne({ user: req.user.id });

  //if user not admin they can only add one company
  if (publishedCompany && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user.id} has already published a company`,
        400
      )
    );
  }

  const company = await Company.create(req.body);
  await auditLog("Company", company._id, "created", req.user);
  res.status(201).json({
    success: true,
    data: company,
  });
});
// @desc    Update  company
// @route   PUT /api/v1/companies/:id
// @access  Private
const updateCompany = asyncHandler(async (req, res, next) => {
  let company = await Company.findById(req.params.id);

  //check for published company
  const publishedCompany = await Company.findOne({
    user: req.body.user,
    _id: { $ne: req.params.id },
  });

  if (publishedCompany) {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user.id} has already published a company`,
        400
      )
    );
  }

  if (!company) {
    return next(
      new ErrorResponse(`Company not found with id ${req.params.id}`, 404)
    );
  }

  //make sure user is company owner
  if (company.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this content`,
        401
      )
    );
  }

  company = await Company.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await auditLog("Company", company._id, "updated", req.user);

  res.status(200).json({ success: true, data: company });
});

// @desc    get companies within radius
// @route   GET /api/v1/companies/radius/:zipcode/:distance/:unit?
// @access  Private
const getCompaniesInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance, unit } = req.params;
  //get lat and long from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  //calc radius using radians
  // divide dish by radius of earth
  // earth radius = 3,963 mi/ 6,378km
  const range = unit == "m" ? 3963 : 6378;
  const radius = distance / range;

  const companies = await Company.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    count: companies.length,
    data: companies,
  });
});

// @desc    Delete company
// @route   DELETE /api/v1/companies/:id
// @access  Private
const deleteCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    return next(
      new ErrorResponse(`Company not found with id ${req.params.id}`, 404)
    );
  }

  //make sure user is company owner
  if (company.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this content`,
        401
      )
    );
  }

  await Company.findByIdAndUpdate(req.params.id, {
    deleted: true,
  });

  await auditLog("Company", company._id, "deleted", req.user);

  res.status(200).json({ success: true, data: {} });
});

// @desc    Upload photo for company
// @route   PUT /api/v1/companies/:id/photo
// @access  Private
const companyPhotoUpload = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    return next(
      new ErrorResponse(`Company not found with id ${req.params.id}`, 404)
    );
  }

  //make sure user is company owner
  if (company.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to upload photo to this company`,
        401
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload file`, 400));
  }

  let file = req.files.file;

  // check if photo
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`File needs to be an image`, 400));
  }

  // check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(`MAX file size ${process.env.MAX_FILE_UPLOAD}`, 400)
    );
  }

  // create custom filename
  file.name = `company_${company._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.log(err);
      return next(new ErrorResponse(`PROBLEM with file upload`, 500));
    }

    await Company.findByIdAndUpdate(req.params.id, { photo: file.name });

    await auditLog("Company", req.params.id, "photo-uploaded", req.user);

    res.status(200).json({ success: true, data: file.name });
  });
});

// @desc    Upload photo for company
// @route   PUT /api/v1/companies/:id/teamphoto
// @access  Private
const companyImageUpload = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    return next(
      new ErrorResponse(`Company not found with id ${req.params.id}`, 404)
    );
  }

  //make sure user is company owner
  if (company.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to upload photo to this company`,
        401
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload file`, 400));
  }

  let file = req.files.file;

  // check if photo
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`File needs to be an image`, 400));
  }

  // check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(`MAX file size ${process.env.MAX_FILE_UPLOAD}`, 400)
    );
  }

  let newObj = {
    company: req.params.id,
    title: req.body.title,
    imageType: req.body.imageType,
  };

  let newImage = await Image.create(newObj);
  // create custom filename
  file.name = `${newImage._id}${path.parse(file.name).ext}`;

  file.mv(
    `${process.env.FILE_UPLOAD_PATH}/${req.body.imageType}/${file.name}`,
    async (err) => {
      if (err) {
        console.log(err);
        return next(new ErrorResponse(`PROBLEM with file upload`, 500));
      }

      await Image.findByIdAndUpdate(newImage._id, { image: file.name });

      await auditLog(
        "CompanyTeamImage",
        req.params.id,
        "photo-uploaded",
        req.user
      );

      res.status(200).json({ success: true, data: file.name });
    }
  );
});

module.exports = {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompaniesInRadius,
  companyPhotoUpload,
  companyImageUpload,
};
