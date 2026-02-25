const eventService = require("../services/event.service");
const { success } = require("../utils/apiResponse");

const createEvent = async (req, res) => {
  const event = await eventService.createEvent(req.body, req.user._id);
  return success(res, 201, "Event created", event);
};

const getEvents = async (req, res) => {
  const result = await eventService.listEvents(req.query);
  return success(res, 200, "Events fetched", result);
};

const getMyEvents = async (req, res) => {
  const result = await eventService.listMyEvents(req.user._id, req.query);
  return success(res, 200, "My events fetched", result);
};

const getEventById = async (req, res) => {
  const event = await eventService.getEventById(req.params.eventId);
  return success(res, 200, "Event fetched", event);
};

const updateEvent = async (req, res) => {
  const event = await eventService.updateEvent(req.params.eventId, req.body, req.user._id);
  return success(res, 200, "Event updated", event);
};

const deleteEvent = async (req, res) => {
  await eventService.deleteEvent(req.params.eventId, req.user._id);
  return success(res, 200, "Event deleted");
};

module.exports = {
  createEvent,
  getEvents,
  getMyEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
