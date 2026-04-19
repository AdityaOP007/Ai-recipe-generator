 import Recipe from '../models/Recipe.js';
import PantryItem from '../models/Pantryitem.js';
import { generateRecipe as generateRecipeAI, generatePantrySuggestions as generatePantrySuggestionsAI } from '../utils/gemini.js';


/**
 * Generate recipe using AI
 */
export const generateRecipe = async (req, res, next) => {
  try {
    const {
      ingredients = [],
      usePantryIngredients = false,
      dietaryRestrictions = [],
      cuisineType = 'any',
      servings = 4,
      cookingTime = 'medium'
    } = req.body;

    let finalIngredients = [...ingredients];

    // Add pantry ingredients if requested
    if (usePantryIngredients) {
      const pantryItems = await PantryItem.findByUserId(req.user.id);
      const pantryIngredientNames = pantryItems.map(item => item.name);
      finalIngredients = [...new Set([...finalIngredients, ...pantryIngredientNames])];
    }

    if (finalIngredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one ingredient'
      });
    }

   // Generate recipe using Gemini
const recipe = await generateRecipeAI({
  ingredients: finalIngredients,
  dietaryRestrictions,
  cuisineType,
  servings,
  cookingTime
});

res.json({
  success: true,
  message: 'Recipe generated successfully',
  data: { recipe }
});
} catch (error) {
  next(error);
}
};

/**
 * Get smart pantry suggestions
 */
export const getPantrySuggestions = async (req, res, next) => {
  try {
    const pantryItems = await PantryItem.findByUserId(req.user.id);
    const expiringItems = await PantryItem.getExpiringSoon(req.user.id, 7);

    const expiringNames = expiringItems.map(item => item.name);

    const suggestions = await generatePantrySuggestionsAI(pantryItems, expiringNames);

    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save recipe
 */
export const saveRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.create(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Recipe saved successfully',
      data: { recipe }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all recipes
 */
export const getRecipes = async (req, res, next) => {
  try {
    const { search, cuisine_type, difficulty, dietary_tag, max_cook_time, sort_by, sort_order, limit, offset } = req.query;

    const recipes = await Recipe.findByUserId(req.user.id, {
      search,
      cuisine_type,
      difficulty,
      dietary_tag,
      max_cook_time: max_cook_time ? parseInt(max_cook_time) : undefined,
      sort_by,
      sort_order,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({
      success: true,
      data: { recipes }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent recipes
 */
export const getRecentRecipes = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const recipes = await Recipe.getRecent(req.user.id, limit);

    res.json({
      success: true,
      data: { recipes }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recipe by ID
 */
export const getRecipeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findById(id, req.user.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.json({
      success: true,
      data: { recipe }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update recipe
 */
export const updateRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.update(id, req.user.id, req.body);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.json({
      success: true,
      message: 'Recipe updated successfully',
      data: { recipe }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete recipe
 */
export const deleteRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.delete(id, req.user.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.json({
      success: true,
      message: 'Recipe deleted successfully',
      data: { recipe }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recipe stats
 */
export const getRecipeStats = async (req, res, next) => {
  try {
    const stats = await Recipe.getStats(req.user.id);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};