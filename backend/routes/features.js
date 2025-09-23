const express = require("express");
const router = express.Router();
const { summarizeJobDescription } = require("../controllers/summarizeJobDescription");

router.post("/summarizeJobDescription", summarizeJobDescription);

module.exports = router;