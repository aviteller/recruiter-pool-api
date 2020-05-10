const express = require("express");
const router = express.Router({ mergeParams: true });

const Job = require("../models/Job");
const advancedResults = require("../middleware/advancedResults");

const {
  getJobs,
  getJob,
  addJob,
  updateJob,
  deleteJob,
} = require("../controllers/jobs");

const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(
    advancedResults(Job, {
      path: "company",
      select: "name description",
    }),
    getJobs
  )
  .post(protect, authorize("company", "admin"), addJob);

router
  .route("/:id")
  .get(getJob)

  .put(protect, authorize("company", "admin"), updateJob)
  .delete(protect, authorize("company", "admin"), deleteJob);

module.exports = router;
