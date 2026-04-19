import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, X, Check, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import api from '../services/api';

const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Grains', 'Spices', 'Beverages', 'Other'];

const ShoppingList = () => {
  const [items, setItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShoppingList();
  }, []);

  const fetchShoppingList = async () => {
    setLoading(true);
    try {
      const response = await api.get('/shopping-list?grouped=true');
      const grouped = response?.data?.data?.items || [];

      const flatItems = [];

      grouped.forEach(group => {
        (group.items || []).forEach(item => {
          flatItems.push({ ...item, category: group.category });
        });
      });

      setItems(flatItems);
      organizeByCategory(flatItems);

    } catch (error) {
      toast.error('Failed to load shopping list');
    } finally {
      setLoading(false);
    }
  };

  const organizeByCategory = (itemsList) => {
    const grouped = {};
    itemsList.forEach(item => {
      const category = item.category || 'Other';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(item);
    });
    setGroupedItems(grouped);
  };

  const handleToggleChecked = async (id) => {
    const prevItems = items;

    const updatedItems = items.map(item =>
      item.id === id
        ? { ...item, is_checked: !item.is_checked }
        : item
    );

    setItems(updatedItems);
    organizeByCategory(updatedItems);

    try {
      await api.put(`/shopping-list/${id}/toggle`);
    } catch (error) {
      toast.error('Failed to update item');
      setItems(prevItems);
      organizeByCategory(prevItems);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/shopping-list/${id}`);

      setItems(prev => {
        const updated = prev.filter(item => item.id !== id);
        organizeByCategory(updated);
        return updated;
      });

      toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleClearChecked = async () => {
    if (!window.confirm('Remove all checked items?')) return;

    try {
      await api.delete('/shopping-list/clear/checked');

      setItems(prev => {
        const updated = prev.filter(item => !item.is_checked);
        organizeByCategory(updated);
        return updated;
      });

      toast.success('Checked items cleared');
    } catch (error) {
      toast.error('Failed to clear items');
    }
  };

  const handleAddToPantry = async () => {
    const checkedCount = items.filter(item => item.is_checked).length;

    if (checkedCount === 0) {
      toast.error('No items checked');
      return;
    }

    if (!window.confirm(`Add ${checkedCount} checked items to pantry?`)) return;

    try {
      await api.post('/shopping-list/add-to-pantry');

      setItems(prev => {
        const updated = prev.filter(item => !item.is_checked);
        organizeByCategory(updated);
        return updated;
      });

      toast.success('Items added to pantry');
    } catch (error) {
      toast.error('Failed to add items to pantry');
    }
  };

  // 🔄 LOADING
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

  const checkedCount = items.filter(item => item.is_checked).length;
  const totalCount = items.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Shopping List</h1>

        {/* ✅ ALWAYS VISIBLE BUTTON */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>

          {checkedCount > 0 && (
            <>
              <button
                onClick={handleAddToPantry}
                className="bg-blue-500 text-white px-4 py-2.5 rounded-lg"
              >
                Add to Pantry ({checkedCount})
              </button>

              <button
                onClick={handleClearChecked}
                className="border px-4 py-2.5 rounded-lg"
              >
                Clear Checked
              </button>
            </>
          )}
        </div>

        {/* LIST */}
        {totalCount > 0 ? (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-4 bg-white p-4 rounded">
              <h2 className="font-semibold mb-2">{category}</h2>

              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center mb-2">
                  <div>
                    <input
                      type="checkbox"
                      checked={item.is_checked}
                      onChange={() => handleToggleChecked(item.id)}
                    />
                    <span className="ml-2">
                      {item.ingredient_name} ({item.quantity} {item.unit})
                    </span>
                  </div>

                  <button onClick={() => handleDeleteItem(item.id)} className="text-red-500">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="bg-white p-12 text-center rounded">
            <p className="text-gray-500 mb-4">No items in shopping list</p>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-500 text-white px-6 py-2 rounded-lg"
            >
              Add First Item
            </button>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(newItem) => {
            const updated = [...items, newItem];
            setItems(updated);
            organizeByCategory(updated);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

const AddItemModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    ingredient_name: '',
    quantity: '',
    unit: 'pieces',
    category: 'Other'
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await api.post('/shopping-list', {
        ...formData,
        quantity: parseFloat(formData.quantity) || 0
      });

      toast.success('Item added');
      onSuccess(formData);
      onClose();

    } catch {
      toast.error('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-96">
        <h2 className="mb-4 font-bold">Add Item</h2>

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Item"
            value={formData.ingredient_name}
            onChange={(e) => setFormData({ ...formData, ingredient_name: e.target.value })}
            className="w-full mb-2 p-2 border"
            required
          />

          <input
            type="number"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full mb-2 p-2 border"
            required
          />

          <button className="bg-emerald-500 text-white px-4 py-2 w-full">
            Add
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShoppingList;