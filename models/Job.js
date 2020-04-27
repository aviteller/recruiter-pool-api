const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "Please add a job title"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    // weeks: {
    //   type: String,
    //   required: [true, "Please add a number of weeks"]
    // },
    pay: {
      type: String,
      // required: [true, "Please add a tuition cost"]
    },
    minimumSkill: {
      type: String,
      required: [true, "Please add a skills"],
      // enum: ["beginner", "intermediate", "advanced"]
    },
    company: {
      type: mongoose.Schema.ObjectId,
      ref: "Company",
      required: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: { createdAt: "createdAt" } }
);

// // static method to get averagee course turitions
// JobSchema.statics.getAverageCost = async function (bootcampId) {
//   const obj = await this.aggregate([
//     {
//       $match: { bootcamp: bootcampId },
//     },
//     {
//       $group: {
//         _id: "$bootcamp",
//         averageCost: { $avg: "$tuition" },
//       },
//     },
//   ]);
//   try {
//     await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
//       averageCost: Math.ceil(obj[0].averageCost / 10) * 10,
//     });
//   } catch (err) {
//     console.error(err);
//   }
// };

// // call getAverageCost after save
// JobSchema.post("save", function () {
//   this.constructor.getAverageCost(this.bootcamp);
// });

// // call getAverageCost before remove
// JobSchema.pre("remove", function () {
//   this.constructor.getAverageCost(this.bootcamp);
// });

module.exports = mongoose.model("Job", JobSchema);
