import express from 'express';
const router = express.Router();
import * as mealPlanController from '../controllers/mealPlanController.js';
import authMiddleware from '../middleware/authMiddleware.js';

// All routes are protected
router.use(authMiddleware);

router.get('/weekly', mealPlanController.getWeeklyMealPlan);
router.get('/upcoming', mealPlanController.getUpcomingMeals);
router.get('/stats', mealPlanController.getMealPlanStats);
router.post('/', mealPlanController.addToMealPlan);
router.delete('/:id', mealPlanController.deleteMealPlan);

export default router;