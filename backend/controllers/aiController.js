const OpenAI = require('openai');
const carData = require('../cars.json');
const logger = require('../utils/logger');
const { getSellerByUsername, getSellerById } = require('../dbQueries/sellers');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Translation mappings
const translations = {
  colors: {
    white: 'أبيض',
    black: 'أسود',
    red: 'أحمر',
    blue: 'أزرق',
    yellow: 'أصفر',
    green: 'أخضر',
    orange: 'برتقالي',
    brown: 'بني',
    beige: 'بيج',
    gold: 'ذهبي',
    gray: 'رمادي',
    grey: 'رمادي',
    silver: 'فضي',
    navy: 'كحلي',
    cream: 'كريمي'
  },
  bodyTypes: {
    sedan: 'سيدان',
    suv: 'جبلية',
    hatchback: 'هاتشباك',
    coupe: 'بابين',
    convertible: 'كشف',
    pickup: 'بيكأب',
    truck: 'بيكأب',
    'station wagon': '(ستيشن) واغن',
    wagon: '(ستيشن) واغن'
  },
  fuelTypes: {
    gasoline: 'بنزين',
    petrol: 'بنزين',
    diesel: 'ديزل',
    electric: 'كهرباء',
    hybrid: 'هايبرد',
    gas: 'غاز'
  },
  transmissions: {
    automatic: 'اوتوماتيك',
    manual: 'يدوي'
  }
};

// Helper function to translate values to Arabic
const translateToArabic = (value, category) => {
  if (!value) {
    return null;
  }
  const lowerValue = value.toLowerCase();
  return translations[category][lowerValue] || value;
};

// Helper function to check if make/model exists in database
const checkMakeModelInDatabase = async(make, model, knex) => {
  try {
    // Check if make exists
    const makeExists = await knex('all_cars').where('make', 'ilike', `%${make}%`).first();

    logger.info('Checking make/model in database', {
      make,
      model,
      makeExists: !!makeExists
    });

    if (!makeExists) {
      return { makeExists: false, modelExists: false, makeId: null };
    }

    // Check if model exists for this make
    const modelExists = await knex('all_cars')
      .select('id')
      .where('make', 'ilike', `%${make}%`)
      .andWhere('model', 'ilike', `%${model}%`)
      .first();

    logger.info('Model check result', {
      modelExists: !!modelExists,
      makeId: makeExists.id,
      modelId: modelExists ? modelExists.id : null
    });

    return {
      makeExists: true,
      modelExists: !!modelExists,
      makeId: makeExists.id,
      modelId: modelExists?.id || null
    };
  } catch (error) {
    console.error('Error checking make/model in database:', error);
    return { makeExists: false, modelExists: false, makeId: null };
  }
};

// Helper function to calculate price with mileage consideration
const calculatePriceWithMileage = (basePrice, year, mileage) => {
  if (!basePrice || !year) {
    return basePrice;
  }

  const currentYear = new Date().getFullYear();
  const carAge = currentYear - parseInt(year);

  // Base depreciation by age (10% per year for first 5 years, 5% after)
  const ageDepreciation = carAge <= 5 ? carAge * 0.1 : 0.5 + (carAge - 5) * 0.05;

  // Mileage depreciation (average 15,000 km/year)
  let mileageDepreciation = 0;
  if (mileage) {
    const expectedMileage = carAge * 15000;
    const excessMileage = Math.max(0, mileage - expectedMileage);
    mileageDepreciation = (excessMileage / 100000) * 0.1; // 10% per 100k excess km
  }

  const totalDepreciation = Math.min(0.8, ageDepreciation + mileageDepreciation); // Max 80% depreciation
  return Math.round(basePrice * (1 - totalDepreciation));
};

/**
 * Analyze car image using OpenAI Vision API
 */
const analyzeCarImage = async(req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    // Check if user is premium or company
    const userId = req.user.id;
    const seller = await getSellerById(req.app.get('db'), userId);
    const companyId = seller ? seller.company_id : null;
    logger.info('Analyzing car image', {
      userId,
      companyId,
      knex: req.app.get('db') ? 'available' : 'not available',
      seller: seller ? seller.username : 'unknown'
    });

    // if (!companyId && !seller) {
    //   logger.warn('Unauthorized access to AI feature', {
    //     userId: user ? user.id : null,
    //     user,
    //   });
    //   return res.status(403).json({
    //     success: false,
    //     error: 'هذه الميزة متاحة فقط للمستخدمين المميزين والشركات',
    //   });
    // }

    // // !user.is_premium to be added later
    // if (!user || companyId) {
    //   logger.warn('Unauthorized access to AI feature', {
    //     userId: user ? user.id : null,
    //     user,
    //   });
    //   return res.status(403).json({
    //     success: false,
    //     error: 'هذه الميزة متاحة فقط للمستخدمين المميزين والشركات',
    //   });
    // }

    // Get mileage from request body if provided
    const { mileage } = req.body;
    const mileageValue = mileage ? parseInt(mileage) : null;

    // Convert image buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype; // Enhanced prompt with mileage consideration and seller focus
    const prompt = `Analyze this car image and extract the following information in JSON format.
This analysis will be used by a car seller to create an attractive listing, so focus on features that would appeal to potential buyers:

{
  "make": "car manufacturer (e.g., Toyota, BMW, Mercedes-Benz)",
  "model": "specific car model (e.g., Camry, X3, C-Class)",
  "year": "estimated year (YYYY format)",
  "color": "primary exterior color (in English)",
  "bodyType": "body type (sedan, SUV, hatchback, coupe, convertible, pickup, wagon)",
  "fuelType": "fuel type if visible or determinable (gasoline, diesel, electric, hybrid)",
  "transmission": "transmission type if determinable (automatic, manual)",
  "condition": "estimated condition based on visible wear (excellent, good, fair, poor)",
  "estimatedPrice": "estimated market value in USD${mileageValue ? ` (consider ${mileageValue} km mileage)` : ''}",
  "currency": "USD",
  "description": "seller-focused description in Arabic highlighting the car's best features, condition, and selling points. Write as if you're a seller describing your car to potential buyers. Focus on what makes this car attractive and worth buying.",
  "confidence": "confidence level from 0-100",
  "sellingPoints": "array of key selling points and attractive features visible in the image (in Arabic)",  "hp": "estimated horsepower/engine power if determinable from model/badge (number only)",
  "engine_cylinders": "estimated engine cylinder configuration if determinable from model/badge (values like 'I3', 'I4', 'I5', 'I6', 'V6', 'V8', 'V10', 'V12', 'W12')",
  "engine_liters": "estimated engine displacement in liters if determinable from model/badge (decimal number like 1.5, 2.0, 3.5)"
}

IMPORTANT INSTRUCTIONS:
- Be as accurate as possible with make and model identification
- If you cannot determine a specific detail, use null for that field
- For engine specifications (hp, cylinders, liters), try to estimate based on:
  * Visible badges/emblems on the car (like "2.0T", "V6", "3.5L", etc.)
  * Model knowledge (e.g., BMW 320i typically has ~180hp, 4-cylinder I4, 2.0L)
  * Body style and size hints (larger cars often have more cylinders/displacement)
  * For cylinders, use format: "I3", "I4", "I5", "I6", "V6", "V8", "V10", "V12", "W12"
  * If unsure, use null rather than guessing
- For the description, write in Arabic from a seller's perspective, emphasizing:
  * Attractive features and condition
  * Why a buyer should choose this car
  * Any premium features or good maintenance visible
  * Fuel efficiency if it's a smaller/hybrid car
  * Space and practicality if it's an SUV/family car
- The sellingPoints should list 3-5 key attractive features
- Focus on positive aspects while being truthful about condition
${mileageValue ? `Consider that this car has ${mileageValue} kilometers when estimating the price and describing condition.` : ''}

Example selling-focused description style:
"سيارة [make] [model] في حالة ممتازة، محافظ عليها جيداً. تتميز بـ[key features]. اللون [color] الجذاب. مناسبة للعائلة/الاستخدام اليومي. صيانة منتظمة. السعر قابل للتفاوض."`;

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the more cost-effective vision model
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1 // Low temperature for more consistent results
    });

    // Parse the AI response
    const aiResponse = response.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Try to extract JSON from the response
    let carData;
    try {
      // Look for JSON in the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        carData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI response',
        details: aiResponse
      });
    } // Validate and clean the data with Arabic translations
    const translatedColor = translateToArabic(carData.color, 'colors');
    const translatedBodyType = translateToArabic(carData.bodyType, 'bodyTypes');
    const translatedFuelType = translateToArabic(carData.fuelType, 'fuelTypes');
    const translatedTransmission = translateToArabic(carData.transmission, 'transmissions');

    // Calculate price with mileage consideration if provided
    let finalPrice = carData.estimatedPrice ? Number(carData.estimatedPrice) : null;
    if (finalPrice && carData.year && mileageValue) {
      finalPrice = calculatePriceWithMileage(finalPrice, carData.year, mileageValue);
    }

    // Check if make/model exists in database (assuming knex is available)
    let databaseValidation = { makeExists: false, modelExists: false };
    try {
      if (carData.make && carData.model && req.app.get('db')) {
        const knex = req.app.get('db');
        databaseValidation = await checkMakeModelInDatabase(carData.make, carData.model, knex);
      }
    } catch (dbError) {
      console.error('Database validation error:', dbError);
      // Continue without database validation
    }
    const cleanedData = {
      make: carData.make || null,
      model: carData.model || null,
      year: carData.year ? String(carData.year) : null,
      color: translatedColor || carData.color || null,
      colorOriginal: carData.color || null, // Keep original for reference
      bodyType: translatedBodyType || carData.bodyType || null,
      bodyTypeOriginal: carData.bodyType || null,
      fuelType: translatedFuelType || carData.fuelType || null,
      fuelTypeOriginal: carData.fuelType || null,
      transmission: translatedTransmission || carData.transmission || null,
      transmissionOriginal: carData.transmission || null,
      condition: carData.condition || null,
      estimatedPrice: finalPrice,
      originalEstimatedPrice: carData.estimatedPrice ? Number(carData.estimatedPrice) : null,
      currency: carData.currency || 'USD',
      description: carData.description || null,
      sellingPoints: carData.sellingPoints || [], // New field for selling points
      confidence: carData.confidence ? Number(carData.confidence) : 70,
      mileageConsidered: mileageValue, // Engine specifications
      hp: carData.hp ? Number(carData.hp) : null,
      engine_cylinders: carData.engine_cylinders || null, // Keep as string (e.g., "I4", "V6")
      engine_liters: carData.engine_liters ? Number(carData.engine_liters) : null,
      databaseValidation: {
        makeExists: databaseValidation.makeExists,
        modelExists: databaseValidation.modelExists,
        needsManualReview: !databaseValidation.makeExists || !databaseValidation.modelExists
      }
    };

    res.json({
      success: true,
      data: cleanedData,
      warnings:
        !databaseValidation.makeExists || !databaseValidation.modelExists
          ? ['الماركة أو الموديل غير متوفر في قاعدة البيانات، قد يحتاج إلى مراجعة يدوية']
          : []
    });
  } catch (error) {
    console.error('Error analyzing car image:', error);

    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({
        success: false,
        error: 'AI service quota exceeded. Please try again later.'
      });
    }

    if (error.code === 'invalid_api_key') {
      return res.status(500).json({
        success: false,
        error: 'AI service configuration error'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to analyze car image',
      details: error.message
    });
  }
};

module.exports = {
  analyzeCarImage
};
