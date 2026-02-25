const express = require("express");
const asyncHandler = require("../middlewares/asyncHandler.middleware");
const validate = require("../middlewares/validate.middleware");
const { protect } = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const eventController = require("../controllers/event.controller");
const {
  eventBodySchema,
  eventUpdateBodySchema,
  eventIdParamSchema
} = require("../validators/event.validator");

const router = express.Router();

router.get("/", asyncHandler(eventController.getEvents));
router.get("/mine", protect, allowRoles("admin"), asyncHandler(eventController.getMyEvents));
router.get("/:eventId", validate(eventIdParamSchema, "params"), asyncHandler(eventController.getEventById));

router.post(
  "/",
  protect,
  allowRoles("admin"),
  validate(eventBodySchema),
  asyncHandler(eventController.createEvent)
);

router.patch(
  "/:eventId",
  protect,
  allowRoles("admin"),
  validate(eventIdParamSchema, "params"),
  validate(eventUpdateBodySchema),
  asyncHandler(eventController.updateEvent)
);

router.delete(
  "/:eventId",
  protect,
  allowRoles("admin"),
  validate(eventIdParamSchema, "params"),
  asyncHandler(eventController.deleteEvent)
);

module.exports = router;
