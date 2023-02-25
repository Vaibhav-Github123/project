const express = require("express");
const router = express.Router();
const Admin = require("../model/admin");
const jwt = require("jsonwebtoken");
const Category = require("../model/Category");
const auth = require("../middleware/auth");
const fs = require("fs");
const path = require("path");
const Product = require("../model/Product");
const multer = require("multer");
const Shop = require("../model/Shop");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/productimg");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + ".jpg");
  },
});

const upload = multer({ storage: storage });

router.get("/dashboard", auth, (req, resp) => {
  resp.render("dashboard");
});

router.get("/adminlogin", (req, resp) => {
  resp.render("adminlogin");
});

router.post("/alogin", async (req, resp) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email });

    if (admin.password == req.body.password) {
      const token = await jwt.sign({ _id: admin._id }, process.env.AKEY);
      // console.log(token);
      resp.cookie("jwt", token);
      resp.redirect("dashboard");
    } else {
      resp.render("adminlogin", { msg: "Invalid credentials" });
    }
  } catch (error) {
    resp.render("adminlogin", { msg: "Invalid credentials" });
  }
});

router.get("/alogout", auth, (req, resp) => {
  resp.clearCookie("jwt");
  resp.redirect("adminlogin");
});

router.get("/signin", (req, resp) => {
  resp.render("adminlogin");
});

router.get("/signup", (req, resp) => {
  resp.render("signup");
});

//*************************Product Category******************/
router.get("/category", auth, async (req, resp) => {
  try {
    const cat = await Category.find();
    resp.render("productcategory", { cdata: cat });
  } catch (error) {}
});

router.post("/addcategory", async (req, resp) => {
  try {
    const cat = new Category(req.body);
    await cat.save();
    resp.redirect("category");
  } catch (error) {
    console.log(error);
  }
});

router.get("/deletecat", auth, async (req, resp) => {
  const _id = req.query.did;
  try {
    const data = await Category.findByIdAndDelete(_id);
    // fs.unlinkSync(path.join(data))
    resp.redirect("category");
  } catch (error) {
    console.log(error);
  }
});

/*************************Product************************/

router.get("/products", auth, async (req, resp) => {
  try {
    const cat = await Category.find();
    const prod = await Product.find();
    resp.render("products", { cdata: cat, pdata: prod });
  } catch (error) {
    console.log(error);
  }
});

router.post("/addproduct", upload.single("file"), async (req, resp) => {
  try {
    const prod = new Product({
      cid: req.body.cid,
      pname: req.body.pname,
      price: req.body.price,
      qty: req.body.qty,
      imgname: req.file.filename,
    });
    await prod.save();
    resp.redirect("products");
  } catch (error) {
    console.log(error);
  }
});

router.get("/updateprod", async (req, resp) => {
  const _id = req.query.uid;
  try {
    const data = await Product.findOne({ _id: _id })
    console.log(data);
    resp.render("products", { pdata: data })
  } catch (error) {
    console.log(error);
  }
});
router.post("/addproduct", upload.single("file"), async (req, resp) => {
  
  try {
    const prod = await Product.findByIdAndUpdate( {
      cid: req.body.cid,
      pname: req.body.pname,
      price: req.body.price,
      qty: req.body.qty,
      imgname: req.file.filename,
    });
    fs.unlinkSync(path.join(__dirname, `../public/productimg/${prod.imgname}`));
    resp.send("products");
  } catch (error) {
    console.log(error);
  }
});

router.get("/deleteprod", auth, async (req, resp) => {
  const _id = req.query.did;
  try {
    const data = await Product.findByIdAndDelete(_id);
    fs.unlinkSync(path.join(__dirname, `../public/productimg/${data.imgname}`));
    resp.redirect("products");
  } catch (error) {
    console.log(error);
  }
});

//****************************Userdetail******************************/

router.get("/viewuser", async (req, resp) => {
  const user = await Shop.find();
  resp.render("userdetail", { udata: user });
});

//***********************Order***********************/

const Order = require("../model/Order");

router.get("/viewOrder", async (req, resp) => {
  try {
    const order = await Order.find();
    resp.render("orderdetails", { odata: order });
  } catch (error) {}
});

module.exports = router;
