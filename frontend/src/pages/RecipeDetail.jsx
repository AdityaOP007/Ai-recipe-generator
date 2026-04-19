import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Users, ChefHat, ArrowLeft, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import api from '../services/api';

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [servings, setServings] = useState(4);
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    setLoading(true);

    try {
      const response = await api.get(`/recipes/${id}`);
      const recipeData = response?.data?.data?.recipe;

      if (!recipeData) throw new Error("Recipe not found");

      setRecipe(recipeData);
      setServings(recipeData.servings || 4);

    } catch (error) {
      toast.error('Failed to load recipe');
      navigate('/recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;

    try {
      await api.delete(`/recipes/${id}`);
      toast.success('Recipe deleted');
      navigate('/recipes');
    } catch (error) {
      toast.error('Failed to delete recipe');
    }
  };

  const toggleIngredient = (index) => {
    setCheckedIngredients(prev => {
      const newChecked = new Set(prev);
      if (newChecked.has(index)) newChecked.delete(index);
      else newChecked.add(index);
      return newChecked;
    });
  };

  const adjustQuantity = (qty = 0, originalServings = 1) => {
    return ((qty * servings) / originalServings).toFixed(2);
  };

  // 🔄 LOADING SCREEN
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // ❌ NO RECIPE
  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No recipe found</p>
      </div>
    );
  }

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  const originalServings = recipe.servings || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back */}
        <Link to="/recipes" className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>

        {/* Header */}
        <div className="bg-white p-6 rounded-lg mb-6">
          <h1 className="text-2xl font-bold">{recipe.name}</h1>
          <p className="text-gray-600">{recipe.description}</p>

          <button
            onClick={handleDelete}
            className="mt-3 text-red-500"
          >
            Delete
          </button>
        </div>

        {/* Ingredients */}
        <div className="bg-white p-6 rounded-lg mb-6">
          <h2 className="font-semibold mb-4">Ingredients</h2>

          {recipe.ingredients?.map((ing, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="checkbox"
                checked={checkedIngredients.has(i)}
                onChange={() => toggleIngredient(i)}
              />
              <span>
                {adjustQuantity(ing.quantity, originalServings)} {ing.unit} {ing.name}
              </span>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-white p-6 rounded-lg mb-6">
          <h2 className="font-semibold mb-4">Instructions</h2>

          {recipe.instructions?.map((step, i) => (
            <p key={i}>{i + 1}. {step}</p>
          ))}
        </div>

        {/* Nutrition */}
        {recipe.nutrition && (
          <div className="bg-white p-6 rounded-lg">
            <h2 className="font-semibold mb-4">Nutrition</h2>

            <p>Calories: {recipe.nutrition?.calories || 0}</p>
            <p>Protein: {recipe.nutrition?.protein || 0}</p>
            <p>Carbs: {recipe.nutrition?.carbs || 0}</p>
            <p>Fats: {recipe.nutrition?.fats || 0}</p>
            <p>Fiber: {recipe.nutrition?.fiber || 0}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetail;