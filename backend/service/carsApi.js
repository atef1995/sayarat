const axios = require('axios');

const fetchMakes = async() => {
  try {
    const response = await axios.get(`${process.env.X_RAPID_API_HOST}/makes`, {
      headers: {
        'X-RapidAPI-Key': process.env.X_RAPID_API_KEY,
        'X-RapidAPI-Host': process.env.X_RAPID_API_HOST
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching makes:', error);
    throw new Error('Failed to fetch makes');
  }
};

const fetchModelsForMake = async make => {
  try {
    const response = await axios.get(`${process.env.X_RAPID_API_HOST}/models`, {
      params: { make },
      headers: {
        'X-RapidAPI-Key': process.env.X_RAPID_API_KEY,
        'X-RapidAPI-Host': process.env.X_RAPID_API_HOST
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching models for make ${make}:`, error);
    throw new Error(`Failed to fetch models for make ${make}`);
  }
};
