const express = require("express");
const router = express.Router();
const {updateCredits}=require("../controllers/updateCredits");

router.post("/addCredits",updateCredits);

module.exports = router;