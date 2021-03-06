const express = require("express");
const router = express.Router();
const {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompaniesInRadius,
  companyPhotoUpload,
  companyImageUpload
} = require("../controllers/companies");

const Company = require("../models/Company");
const advancedResults = require("../middleware/advancedResults");

const { protect, authorize } = require("../middleware/auth");

// //include other resource routers
const jobRouter = require("./jobs");
// const reviewRouter = require("./reviews");

// //re-route into other resource router
router.use("/:companyId/jobs", jobRouter);
// router.use("/:bootcampId/reviews", reviewRouter);

router.route("/radius/:zipcode/:distance/:unit?").get(getCompaniesInRadius);

//file upload
router
  .route("/:id/photo")
  .put(protect, authorize("company", "admin"), companyImageUpload);

router
  .route("/")
  .get(advancedResults(Company, "jobs,user"), getCompanies)
  .post(protect, authorize("company", "admin"), createCompany);

router
  .route("/:id")
  .get(getCompany)
  .put(protect, authorize("company", "admin"), updateCompany)
  .delete(protect, authorize("company", "admin"), deleteCompany);

module.exports = router;
