const mongoose = require("mongoose");
const { usersDB } = require("../database/connection");

// User Schema
const usersSchema = new mongoose.Schema({
  is_subscribed:{type:Boolean,require:false},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  credits:{type:Number,require:false}
});

module.exports = usersDB.model("users", usersSchema);
