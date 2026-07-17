const express = require("express");
const sendSuccess = require("../utils/sendSuccess");

const router = express.Router();

router.get("/", (_req, res) => {
  sendSuccess(res, { status: "ok", service: "khabaradda-api" }, "Healthy");
});

module.exports = router;
