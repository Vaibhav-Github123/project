const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  cid: {
    type: mongoose.Schema.Types.ObjectId,
  },
  pname: {
    type: String,
  },
  price: {
    type: Number,
  },
  qty: {
    type: Number,
  },
  imgname: {
    type: String,
  },
});
// Better Buys
module.exports = new mongoose.model("Product", productSchema);
