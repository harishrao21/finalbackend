const express = require("express");
const asyncHandler = require("../middlewares/asyncHandler.middleware");
const { protect } = require("../middlewares/auth.middleware");
const userController = require("../controllers/user.controller");

const router = express.Router();

router.get("/me", protect, asyncHandler(userController.getMyProfile));

module.exports = router;
