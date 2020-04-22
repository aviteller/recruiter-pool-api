const path = require("path");
const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
// const logger = require('./middleware/logger')
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");

// route files
const companies = require("./routes/companies");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
const users = require("./routes/users");
const reviews = require("./routes/reviews");

// load env vars
dotenv.config({ path: "./config/config.env" });

// connect to db
connectDB();

const app = express();
//body parser
app.use(express.json());
// Dev Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// file upploading
app.use(fileupload());

//santize data
app.use(mongoSanitize());
//set security headers
app.use(helmet());
//prevent cros site scripting attacks
app.use(xss());
//prevent http param pollution
app.use(hpp());
//Rate limiting
const limter = rateLimit({
  windowMs: 10 * 60 * 1000, //10 mins
  max: 100
});

app.use(limter);
//cookie middleware
app.use(cookieParser());
//enable cors
app.use(cors());

//set static folder maybe for front end stuff
app.use(express.static(path.join(__dirname, "public")));

//mount router
app.use("/api/v1/companies", companies);
// app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);

app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// handle unhandled promise rejections

process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  //close server & exit proccess
  server.close(() => process.exit(1));
});
