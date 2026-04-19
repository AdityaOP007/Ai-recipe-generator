import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ChefHat, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import api from '../services/api';

const MyRecipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [filteredRecipes, setFilteredRecipes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState('All');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All');

    const [loading, setLoading] = useState(true); // ✅ FIX ADDED

    const cuisines = ['All', 'Italian', 'Mexican', 'Indian', 'Chinese', 'Japanese', 'Thai', 'French', 'Mediterranean', 'American'];
    const difficulties = ['All', 'easy', 'medium', 'hard'];

    useEffect(() => {
        fetchRecipes();
    }, []);

    useEffect(() => {
        filterRecipes();
    }, [recipes, searchQuery, selectedCuisine, selectedDifficulty]);

    const fetchRecipes = async () => {
        setLoading(true); // ✅ FIX
        try {
            const response = await api.get('/recipes');
            const data = response?.data?.data?.recipes || []; // ✅ SAFE
            setRecipes(data);
        } catch (error) {
            toast.error('Failed to load recipes');
        } finally {
            setLoading(false); // ✅ FIX
        }
    };

    const filterRecipes = () => {
        let filtered = recipes;

        if (searchQuery) {
            filtered = filtered.filter(recipe =>
                recipe.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCuisine !== 'All') {
            filtered = filtered.filter(recipe => recipe.cuisine_type === selectedCuisine);
        }

        if (selectedDifficulty !== 'All') {
            filtered = filtered.filter(recipe => recipe.difficulty === selectedDifficulty);
        }

        setFilteredRecipes(filtered);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this recipe?')) return;

        try {
            await api.delete(`/recipes/${id}`);
            setRecipes(prev => prev.filter(recipe => recipe.id !== id)); // ✅ FIX
            toast.success('Recipe deleted');
        } catch (error) {
            toast.error('Failed to delete recipe');
        }
    };

    // ✅ LOADING FIX
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">My Recipes</h1>

                {/* Search + Filters */}
                <div className="bg-white p-4 rounded-lg mb-6 flex gap-4">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border px-3 py-2 rounded w-full"
                    />

                    <select value={selectedCuisine} onChange={(e) => setSelectedCuisine(e.target.value)}>
                        {cuisines.map(c => <option key={c}>{c}</option>)}
                    </select>

                    <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
                        {difficulties.map(d => <option key={d}>{d}</option>)}
                    </select>
                </div>

                {/* Recipes */}
                {filteredRecipes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRecipes.map(recipe => (
                            <div key={recipe.id} className="bg-white p-4 rounded-lg border">
                                <Link to={`/recipes/${recipe.id}`}>
                                    <h2 className="font-semibold text-lg">{recipe.name}</h2>
                                </Link>

                                <button
                                    onClick={() => handleDelete(recipe.id)}
                                    className="text-red-500 mt-2"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No recipes found</p>
                )}
            </div>
        </div>
    );
};

export default MyRecipes;