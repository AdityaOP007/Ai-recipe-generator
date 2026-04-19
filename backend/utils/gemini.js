import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!process.env.GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set. Gemini API calls will fail.');
}

/**
 * Generate recipe
 */
export const generateRecipe = async ({ ingredients, dietaryRestrictions = [], cuisineType = 'any', servings = 4, cookingTime = 'medium' }) => {
  const dietaryInfo = dietaryRestrictions.length > 0
    ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}`
    : 'No dietary restrictions';

  const timeGuide = {
    quick: 'under 30 minutes',
    medium: '30-60 minutes',
    long: 'over 60 minutes'
  };

  const prompt = `Generate a detailed recipe with the following requirements:

Ingredients available: ${ingredients.join(', ')}
${dietaryInfo}
Cuisine type: ${cuisineType}
Servings: ${servings}
Cooking time: ${timeGuide[cookingTime] || 'any'}

Please provide a complete recipe in the following JSON format (return ONLY valid JSON, no markdown):
{
  "name": "Recipe name",
  "description": "Brief description of the dish",
  "cuisineType": "${cuisineType}",
  "difficulty": "easy|medium|hard",
  "prepTime": number,
  "cookTime": number,
  "servings": ${servings},
  "ingredients": [
    {"name": "ingredient name", "quantity": number, "unit": "unit"}
  ],
  "instructions": [
    "Step 1",
    "Step 2"
  ],
  "dietaryTags": [],
  "nutrition": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fats": number,
    "fiber": number
  },
  "cookingTips": []
}`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const generatedText = response.text.trim();

    let jsonText = generatedText;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate recipe. Please try again.');
  }
};

export const generatePantrySuggestions = async (pantryItems, expiringItems = []) => {
  const ingredients = pantryItems.map(item => item.name).join(', ');
  const expiringText = expiringItems.length > 0
    ? `\nPriority ingredients (expiring soon): ${expiringItems.join(', ')}`
    : '';

  const prompt = `Based on these available ingredients: ${ingredients}${expiringText}

Suggest 3 creative recipe ideas that use these ingredients. Return ONLY a JSON array of strings (no markdown):
["Recipe idea 1", "Recipe idea 2", "Recipe idea 3"]

Each suggestion should be a brief, appetizing description (1-2 sentences).`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let generatedText = response.text.trim();

    if (generatedText.startsWith('```json')) {
      generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (generatedText.startsWith('```')) {
      generatedText = generatedText.replace(/```\n?/g, '');
    }

    return JSON.parse(generatedText);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate suggestions');
  }
};

export const generateCookingTips = async (recipe) => {
  const prompt = `For this recipe: "${recipe.name}"
Ingredients: ${recipe.ingredients?.map(i => i.name).join(', ') || 'N/A'}

Provide 3-5 helpful cooking tips to make this recipe better. Return ONLY a JSON array of strings (no markdown):
["Tip 1", "Tip 2", "Tip 3"]`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let generatedText = response.text.trim();

    if (generatedText.startsWith('```json')) {
      generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (generatedText.startsWith('```')) {
      generatedText = generatedText.replace(/```\n?/g, '');
    }

    return JSON.parse(generatedText);
  } catch (error) {
    console.error('Gemini API error:', error);
    return ['Cook with love and patience!'];
  }
};

export default {
  generateRecipe,
  generatePantrySuggestions,
  generateCookingTips
};