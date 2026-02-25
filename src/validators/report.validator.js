const { Joi, objectId } = require("./common.validator");

const exportReportQuerySchema = Joi.object({
  eventId: objectId.optional()
});

module.exports = {
  exportReportQuerySchema
};
