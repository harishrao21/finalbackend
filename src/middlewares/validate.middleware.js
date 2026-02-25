const validate = (schema, source = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });

  if (error) {
    return next(error);
  }

  req[source] = value;
  return next();
};

module.exports = validate;
