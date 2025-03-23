const Joi = require("joi");

// Completion Validation
const completionSchema = Joi.object({
  classId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
  courseId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
});

exports.validateCompletion = (req, res, next) => {
  const { classId, courseId } = req.params;
  const { error } = completionSchema.validate({ classId, courseId });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};
