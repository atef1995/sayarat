const Joi = require('joi');
const data = require('../cars.json');
const logger = require('../utils/logger');

const carSchema = Joi.object({
  title: Joi.string().max(200).required(),
  make: Joi.string().max(40).required(),
  model: Joi.string().max(40).required(),
  year: Joi.number().integer().min(1886).max(new Date().getFullYear()).required(),
  price: Joi.number().positive().required(),
  mileage: Joi.number().min(0).required(),
  description: Joi.string().max(1000).required(),
  location: Joi.string().required(),
  car_type: Joi.string().valid('بيكأب', 'جبلية', 'سيدان', 'هاتشباك', 'بابين', 'كشف', '(ستيشن) واغن').required(),
  color: Joi.string().valid(...data.colors),
  transmission: Joi.string().valid('يدوي', 'اوتوماتيك').required(),
  fuel: Joi.string().valid('بنزين', 'ديزل', 'كهرباء', 'هايبرد').required(),
  currency: Joi.string().valid('usd', 'syp').required(),
  specs: Joi.alternatives().try(Joi.string().max(100), Joi.array().items(Joi.string().max(100))),
  engine_cylinders: Joi.string().max(3),
  engine_liters: Joi.number().min(0),
  hp: Joi.number().integer().min(0),
  highlight: Joi.boolean().default(false),
  autoRelist: Joi.boolean().default(false),
  products: Joi.alternatives().try(Joi.array().items(Joi.string().max(100)), Joi.string().max(100)),
  clientSecret: Joi.string().max(100)
});

const validateCarDetails = carDetails => {
  logger.info('Validating car details', {
    keys: Object.keys(carDetails),
    title: carDetails.title?.substring(0, 50),
    make: carDetails.make,
    model: carDetails.model,
    year: carDetails.year,
    price: carDetails.price,
    mileage: carDetails.mileage,
    currency: carDetails.currency,
    car_type: carDetails.car_type,
    transmission: carDetails.transmission,
    fuel: carDetails.fuel,
    color: carDetails.color,
    engine_cylinders: carDetails.engine_cylinders,
    specsType: typeof carDetails.specs,
    specsValue: Array.isArray(carDetails.specs) ? `Array(${carDetails.specs.length})` : carDetails.specs
  });

  const { error } = carSchema.validate(carDetails);
  if (error) {
    logger.error('Car details validation failed', {
      error: error.details[0].message,
      field: error.details[0].path.join('.'),
      value: error.details[0].context?.value,
      carDetails: {
        ...carDetails,
        description: carDetails.description?.substring(0, 100)
      }
    });
    throw new Error(error.details[0].message);
  }
  return true;
};

/**
 * Validate image file type.
 * This function checks if the provided file type is one of the allowed image types.
 * @param {string} fileType - The MIME type of the file to validate.
 * @returns {boolean} - Returns true if the file type is valid.
 */
const validateImageFileType = fileType => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  logger.info(`Validating file type: ${fileType}`, { type: typeof fileType });

  if (typeof fileType !== 'string') {
    logger.info('File type must be a string');
    throw new Error('File type must be a string');
  }
  if (!allowedTypes.includes(fileType)) {
    logger.info(`Invalid file type: ${fileType}`);
    throw new Error(`Invalid file type. Allowed types are: ${allowedTypes.join(', ')}`);
  }
  return true;
};

const validateSearchParameters = params => {
  const schema = Joi.object({
    // make can be a string or an array of strings
    make: Joi.alternatives().try(Joi.string().max(40), Joi.array().items(Joi.string().max(40))),
    model: Joi.alternatives().try(Joi.string().max(40), Joi.array().items(Joi.string().max(40))),
    year: Joi.number().integer().min(1886).max(new Date().getFullYear()),
    price_min: Joi.number().positive(),
    price_max: Joi.number().positive().greater(Joi.ref('price_min')),
    makeYear_min: Joi.number().integer().min(1886).max(new Date().getFullYear()),
    makeYear_max: Joi.number()
      .integer()
      .min(1886)
      .max(new Date().getFullYear() + 1)
      .greater(Joi.ref('makeYear_min')),
    carMileage_min: Joi.number().min(0),
    carMileage_max: Joi.number().min(0).greater(Joi.ref('carMileage_min')),
    // #TODO: should validate keys and values of carType
    carType: Joi.alternatives().try(
      Joi.string().valid('بيكأب', 'جبلية', 'سيدان', 'هاتشباك', 'بابين', 'كشف', '(ستيشن) واغن'),
      Joi.array().items(Joi.string().valid('بيكأب', 'جبلية', 'سيدان', 'هاتشباك', 'بابين', 'كشف', '(ستيشن) واغن'))
    ),
    priceRange: Joi.array().items(Joi.number().positive()).length(2),
    currency: Joi.string().valid('usd', 'syp'),
    mileageRange: Joi.array().items(Joi.number().min(0)).length(2),
    color: Joi.string().valid(...data.colors),
    transmission: Joi.alternatives().try(
      Joi.string().valid('يدوي', 'اوتوماتيك'),
      Joi.array().items(Joi.string().valid('يدوي', 'اوتوماتيك'))
    ),
    fuel: Joi.alternatives().try(
      Joi.string().valid('بنزين', 'ديزل', 'كهرباء', 'هايبرد', 'غاز'),
      Joi.array().items(Joi.string().valid('بنزين', 'ديزل', 'كهرباء', 'هايبرد', 'غاز'))
    ),
    location: Joi.alternatives().try(Joi.string().max(100), Joi.array().items(Joi.string().max(100))),
    engine_cylinders: Joi.alternatives().try(Joi.string().max(10), Joi.array().items(Joi.string().max(10))),
    engine_liters: Joi.alternatives().try(Joi.number().positive(), Joi.array().items(Joi.number().positive())),
    hp: Joi.number().integer().min(0),
    keyword: Joi.string().max(100),
    specs: Joi.alternatives().try(Joi.string().max(100), Joi.array().items(Joi.string().max(100))),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    username: Joi.string().max(50)
  });

  const { error } = schema.validate(params);
  if (error) {
    logger.error('Search parameters validation error:', {
      error: error
    });
    throw new Error(error.details[0].message);
  }
  return true;
};

const validateEmail = email => {
  const emailSchema = Joi.string().email().max(100).required();
  const { error } = emailSchema.validate(email);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return true;
};

const validatePassword = password => {
  const passwordSchema = Joi.string()
    .min(8)
    .max(100)
    .custom((value, helpers) => {
      // Check for lowercase letter
      if (!/[a-z]/.test(value)) {
        return helpers.error('password.lowercase');
      }

      // Check for uppercase letter
      if (!/[A-Z]/.test(value)) {
        return helpers.error('password.uppercase');
      }

      // Check for number
      if (!/\d/.test(value)) {
        return helpers.error('password.number');
      }

      // Check for special character (more comprehensive set)
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(value)) {
        return helpers.error('password.special');
      }

      return value;
    })
    .messages({
      'password.lowercase': 'Password must contain at least one lowercase letter',
      'password.uppercase': 'Password must contain at least one uppercase letter',
      'password.number': 'Password must contain at least one number',
      'password.special': 'Password must contain at least one special character',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 100 characters'
    })
    .required();

  const { error } = passwordSchema.validate(password);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return true;
};

const vaidateSignUpData = data => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().max(100).required(),
    password: Joi.string().min(8).max(100).required(),
    firstName: Joi.string().max(50).required(),
    lastName: Joi.string().max(50).required(),
    phone: Joi.string()
      .pattern(/^\+?[0-9\s]+$/)
      .max(20)
      .required(),
    dateOfBirth: Joi.date().less('now').required()
  });

  const { error } = schema.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return true;
};

module.exports = {
  validateCarDetails,
  validateImageFileType,
  validateSearchParameters,
  validateEmail,
  validatePassword,
  vaidateSignUpData
};
