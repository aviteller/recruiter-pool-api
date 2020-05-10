const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Audit = require("./Audit");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add a email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    role: {
      type: String,
      enum: ["user", "recruiter", "company", "admin"],
      default: "user",
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    deleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: { createdAt: "createdAt" } }
);

// // call logAudit after save
// UserSchema.post("save", async function () {

//   let auditBody = {
//     model:"User",
//     modelId:this._id,
//     User:{},
//     action:"Updated"
//   };
//   await Audit.create(auditBody);
// });

// encrypt using bcrypt
UserSchema.pre("save", async function (next) {
  //little hack

  if (!this.isModified("password")) next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// // set updated at
// UserSchema.pre("findOneAndUpdate", async function (next) {
//   let now = await new Date(Date.now()).toISOString();
//   this.updatedAt = now;
//   this.update();
//   next();
// });

// jwt siogn and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// match user entered password to hashed password in db
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  //hash token and set to resetPasswordTokenField
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // set expire to 15 min
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
