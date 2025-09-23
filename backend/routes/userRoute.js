const express = require("express");
const router = express.Router();
const usersController = require("../controllers/userAuth");

router.post("/signup", usersController.usersSignup);
router.post("/login", usersController.usersLogin);

module.exports = router;