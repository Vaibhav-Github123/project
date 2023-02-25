const router = require("express").Router();
const Shop = require("../model/Shop");
const Category = require("../model/Category");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Product = require("../model/Product");
const uauth = require("../middleware/uauth");
const Cart = require("../model/Cart");

router.get("/", async (req, resp) => {
  try {
    const cat = await Category.find();
    const prod = await Product.find();

    resp.render("index", { cdata: cat, pdata: prod });
  } catch (error) {}
});

router.get("/cart", uauth, async (req, resp) => {
  const uid = req.shop._id;
  try {
    const cartdata = await Cart.aggregate([
      { $match: { uid: uid } },
      {
        $lookup: {
          from: "products",
          localField: "pid",
          foreignField: "_id",
          as: "products",
        },
      },
    ]);

    let sum = 0;
    for (var i = 0; i < cartdata.length; i++) {
      sum = sum + cartdata[i].total;
    }
    // console.log(sum);
    // console.log(cartdata);
    resp.render("shoping-cart", { cartd: cartdata, carttotal: sum });
  } catch (error) {
    console.log(error);
  }
});

router.get("/contact", (req, resp) => {
  resp.render("contact");
});

router.get("/shopdetails", (req, resp) => {
  resp.render("shop-details");
});

router.get("/shopgrid", async (req, resp) => {
  try {
    const cat = await Category.find();
    const prod = await Product.find();
    resp.render("shop-grid", { cdata: cat, pdata: prod });
  } catch (error) {}
});

router.get("/findByCat", async (req, resp) => {
  const catid = req.query.catid;
  // console.log(catid);
  try {
    const cat = await Category.find();
    const prod = await Product.find({ cid: catid });
    // console.log(prod);
    resp.render("shop-grid", { cdata: cat, pdata: prod });
  } catch (error) {}
});

router.get("/loginpage", async (req, resp) => {
  resp.render("login");
});

router.post("/login", async (req, resp) => {
  try {
    // console.log(req.body.pass);
    const data = await Shop.findOne({ email: req.body.email });
    // console.log(data);
    const isvalid = await bcrypt.compare(req.body.pass, data.pass);
    // console.log(isvalid);

    if (isvalid) {
      const token = await data.genetateToken();
      resp.cookie("ujwt", token);
      resp.render("index");
    } else {
      resp.render("login", { msg: "Invalid email or password" });
    }
  } catch (error) {
    resp.render("login", { msg: "Invalid email or password" });
  }
});

router.get("/userlogout", (req, resp) => {
  resp.redirect("loginpage");
});
router.get("/reg", (req, resp) => {
  resp.render("registration");
});

router.post("/userreg", async (req, resp) => {
  try {
    const user = await Shop(req.body);
    // console.log(user);
    await user.save();
    resp.render("registration", { msg: "registration successfully..!!" });
  } catch (error) {
    console.log(error);
  }
});

//*******************************Cart***********************************/

router.get("/addtocart", uauth, async (req, resp) => {
  const pid = req.query.pid;
  const uid = req.shop._id;
  const qty = req.query.qty;
  try {
    const allCartProduct = await Cart.find({ uid: uid });
    const productdata = await Product.findOne({ _id: pid });
    const newqty = Number(productdata.qty) + Number(qty);
    console.log(newqty);
    const duplicate = allCartProduct.find((ele) => {
      return ele.pid == pid;
    });
    if (duplicate) {
      this.delete;
      resp.send("Product alredy exist in cart !!");
    } else {
      const cart = new Cart({
        pid: pid,
        uid: uid,
        total: productdata.price,
      });
      // console.log(cart);
      await Product.findByIdAndUpdate({ _id: pid }, { qty: newqty });
      await cart.save();
      resp.send("Product added into cart");
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/removeCart", uauth, async (req, resp) => {
  const cartid = req.query.cartid;
  try {
    await Cart.findByIdAndDelete(cartid);
    // console.log(Cart);
    resp.send("Product removed from cart!!");
  } catch (error) {
    console.log(error);
  }
});

router.get("/changeCartQty", uauth, async (req, resp) => {
  try {
    const cartid = req.query.cartid;
    const qty = req.query.qty;

    const cartProduct = await Cart.findOne({ _id: cartid });
    const productdata = await Product.findOne({ _id: cartProduct.pid });
    const newqty = Number(cartProduct.qty) + Number(qty);
    const newtotal = newqty * productdata.price;
    const lqty = Number(productdata.qty) - Number(qty);

    if (newqty < 1 || newqty > productdata.qty) {
      return;
    }

    const updatedata = await Cart.findByIdAndUpdate(cartid, {
      qty: newqty,
      total: newtotal,
    });
    await Product.findByIdAndUpdate({ _id: productdata._id }, { qty: lqty });
    resp.send("ok");
  } catch (error) {
    console.log(error);
  }
});

//*******************************payment******************************//

const Razorpay = require("razorpay");

router.get("/payment", (req, resp) => {
  const amt = Number(req.query.amt);
  // console.log(amt);
  var instance = new Razorpay({
    key_id: "rzp_test_WOONFY9u511Byr",
    key_secret: "t9ROVnSqZbzNZr59d3KLWzJO",
  });

  var options = {
    amount: amt * 100, // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_11",
  };
  instance.orders.create(options, function (err, order) {
    resp.send(order);
  });
});

//*************************Order***************************/

const Order = require("../model/Order");
const nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mathukiyavaibhav0809@gmail.com",
    pass: "ticxzrgrjncyktap",
  },
});

router.get("/order", uauth, async (req, resp) => {
  const pid = req.query.pid;
  // console.log(pid);
  const shop = req.shop;
  const cartProduct = await Cart.find({ uid: shop._id });

  var prod = [];
  for (var i = 0; i < cartProduct.length; i++) {
    prod[i] = {
      pid: cartProduct[i].pid,
      qty: cartProduct[i].qty,
    };
  }
  // console.log(prod);
  try {
    const or = new Order({
      pid: pid,
      uid: shop._id,
      product: prod,
    });
    // console.log(or);
    const orderdata = await or.save();

    var row = "";
    for (var i = 0; i < prod.length; i++) {
      const product = await Product.findOne({ _id: prod[i].pid });
      row =
        row +
        "<div>" +
        "<ul>" +
        "<span>pname: </span>" +
        product.pname +
        "<br>" +
        "<span>price: </span>" +
        product.price +
        "<br>" +
        "<span>qty: </span>" +
        prod[i].qty +
        "</ul>" +
        "</div>";
      // row = row + "<span> pname: " + product.pname + " " +"<br>" + "price: " + product.price + " "+"<br>" + "qty: " + prod[i].qty + "</span><br> "
    }
    console.log(row);

    var msg = {
      from: "mathukiyavaibhav0809@gmail.com",
      to: shop.email,
      subject: "Order conformation",
      html:
        "<h1>Eshop</h1>" +
        "<div>" +
        "<ul>" +
        "<span>Fname: </span>" +
        shop.fname +
        "<br>" +
        "<span>Lname: </span>" +
        shop.lname +
        "<br>" +
        "<span>email: </span>" +
        shop.email +
        "<br>" +
        "<span>phone: </span>" +
        shop.phone +
        "<br>" +
        "<span>address: </span>" +
        shop.address +
        "<br>" +
        " </ul>" +
        "</div>" +
        "<div>" +
        row +
        "</div>" +
        "<div>" +
        "<ul>" +
        "<span>payment ID: </span>" +
        pid +
        "<span><br></span>" +
        "<span>user ID: </span>" +
        orderdata._id +
        " </ul>" +
        "</div>",
      //html: "<h1>ESHOP</h1>payment id: <span>" + pid + "<span><br> user id:  </span>" + orderdata._id + "<span><br></span>" + shop.fname + " " + shop.lname + " " + "<br>phone:  " + shop.phone + "<span><br></span>" + row
    };
    // console.log(msg);
    transporter.sendMail(msg, (error, success) => {
      if (error) {
        console.log(error);
        return;
      }
      resp.send("your order confirmed..!!!");
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
