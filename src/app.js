const mongoose = require("mongoose");
const express = require("express");
const app = express();
const hbs = require("hbs");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT;
const DBURL = process.env.DBURL;

mongoose
  .connect(DBURL)
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const viewpath = path.join(__dirname, "../templetes/views");
const partialsPath = path.join(__dirname, "../templetes/partials");
const publicpath = path.join(__dirname, "../public");
app.set("view engine", "hbs");
app.set("views", viewpath);
app.use(express.static(publicpath));
hbs.registerPartials(partialsPath);

const shoprouter = require("../router/shoprouter");
app.use("/", shoprouter);
const adminrouter = require("../router/adminrouter");
app.use("/", adminrouter);

app.listen(PORT, () => {
  console.log(`server runing on port :${PORT}`);
});

// addmin panel
