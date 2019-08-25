const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../../src/models/user");

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
  name: "Alex",
  password: "1234567",
  email: "alex@gmail.com",
  _id: userOneId,
  tokens: [
    {
      token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
    }
  ]
};

const setupDatabase = async () => {
  await User.deleteMany();
  await new User(userOne).save();
};

module.exports = { userOneId, userOne, setupDatabase };
