const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")

const userSchema = new mongoose.Schema({
  fname: {
    type: String,
  },
  lname: {
    type: String,
  },
  email: {
    type: String,
  },
  pass: {
    type: String,
  },
  phone: {
    type: Number,
  },
  address: {
    type: String
  },
  Tokens: [
    {
      token: {
        type: String,
      },
    },
  ],
});

userSchema.methods.genetateToken = async function () {
  try {

    const token = await jwt.sign({ _id: this._id }, process.env.UKEY)
    this.Tokens = this.Tokens.concat({ token });
    this.save()
    return token;

  } catch (error) {
    console.log(error);
  }
}

userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("pass")) {
      this.pass = await bcrypt.hash(this.pass, 10);
      next();
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = new mongoose.model("Shop", userSchema);


// node i nodemailer  