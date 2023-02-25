const jwt = require("jsonwebtoken");
const Shop = require("../model/Shop");

const uauth = async (req, resp, next) => {
  const token = req.cookies.ujwt;

  try {
    const shopInfo = await jwt.verify(token, process.env.UKEY);

    const shop = await Shop.findOne({ _id: shopInfo._id });

    const tk = shop.Tokens.filter((ele) => {
      return ele.token == token;
    });

    if (tk[0] == undefined) {
      resp.render("login", { msg: "Please Login first" });
    } else {
      req.token = token;
      req.shop = shop;
      next();
    }
  } catch (error) {
    resp.render("login", { msg: "Please Login first" });
  }
};

module.exports = uauth;
