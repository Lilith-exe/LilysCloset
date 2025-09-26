import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const App = () => {
  const [clothingItems, setClothingItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    image: '',
    tags: { color: [], theme: [], features: [] },
    notes: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState({ type: 'color', value: '' });

  // Load data on component mount
  useEffect(() => {
    fetchClothingItems();
    fetchCategories();
  }, []);

  // Filter items when search query or category changes
  useEffect(() => {
    let filtered = clothingItems;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.inventory_number.toString().includes(searchQuery) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Object.values(item.tags).flat().some(tag => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    setFilteredItems(filtered);
  }, [clothingItems, searchQuery, selectedCategory]);

  const fetchClothingItems = async () => {
    try {
      const response = await axios.get(`${API}/clothing-items`);
      setClothingItems(response.data);
    } catch (error) {
      console.error('Error fetching clothing items:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const base64 = await convertToBase64(file);
        setFormData({ ...formData, image: base64 });
      } catch (error) {
        console.error('Error converting image:', error);
      }
    }
  };

  const handleCameraCapture = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const base64 = await convertToBase64(file);
        setFormData({ ...formData, image: base64 });
      } catch (error) {
        console.error('Error converting camera image:', error);
      }
    }
  };

  const handleAddTag = () => {
    if (newTag.value.trim()) {
      const updatedTags = { ...formData.tags };
      if (!updatedTags[newTag.type]) {
        updatedTags[newTag.type] = [];
      }
      updatedTags[newTag.type] = [...updatedTags[newTag.type], newTag.value.trim()];
      setFormData({ ...formData, tags: updatedTags });
      setNewTag({ ...newTag, value: '' });
    }
  };

  const handleRemoveTag = (tagType, tagValue) => {
    const updatedTags = { ...formData.tags };
    updatedTags[tagType] = updatedTags[tagType].filter(tag => tag !== tagValue);
    setFormData({ ...formData, tags: updatedTags });
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.image) {
      alert('Please fill in all required fields and add an image');
      return;
    }

    try {
      await axios.post(`${API}/clothing-items`, formData);
      setFormData({
        name: '',
        category: '',
        image: '',
        tags: { color: [], theme: [], features: [] },
        notes: ''
      });
      setShowAddForm(false);
      fetchClothingItems();
    } catch (error) {
      console.error('Error adding clothing item:', error);
      alert('Error adding item. Please try again.');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await axios.post(`${API}/categories`, { name: newCategory.trim() });
      setNewCategory('');
      setShowCategoryForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category. It might already exist.');
    }
  };

  const renderTagBadges = (tags) => {
    const allTags = Object.entries(tags).flatMap(([type, tagList]) => 
      tagList.map(tag => ({ type, tag }))
    );
    
    return allTags.map((item, index) => (
      <span 
        key={index} 
        className={`inline-block px-2 py-1 rounded-full text-xs font-medium mr-2 mb-1 ${
          item.type === 'color' ? 'bg-pink-100 text-pink-800' :
          item.type === 'theme' ? 'bg-purple-100 text-purple-800' :
          'bg-blue-100 text-blue-800'
        }`}
      >
        {item.tag}
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">My Closet</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCategoryForm(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add Category
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-rose-300 hover:bg-rose-400 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, inventory #, category, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200 overflow-hidden group"
            >
              <div className="aspect-square bg-gray-100 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                  <span className="text-sm font-mono text-rose-400 bg-rose-50 px-2 py-1 rounded">
                    #{item.inventory_number}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{item.category}</p>
                <div className="flex flex-wrap">
                  {renderTagBadges(item.tags)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No items found</p>
            <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Item</h2>
              <form onSubmit={handleSubmitItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none bg-white"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image *</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                      Upload Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                      Take Photo
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    className="hidden"
                  />
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={newTag.type}
                      onChange={(e) => setNewTag({ ...newTag, type: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none bg-white text-sm"
                    >
                      <option value="color">Color</option>
                      <option value="theme">Theme</option>
                      <option value="features">Features</option>
                    </select>
                    <input
                      type="text"
                      value={newTag.value}
                      onChange={(e) => setNewTag({ ...newTag, value: e.target.value })}
                      placeholder="Enter tag"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-rose-300 hover:bg-rose-400 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(formData.tags).map(([type, tags]) =>
                      tags.map(tag => (
                        <span
                          key={`${type}-${tag}`}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            type === 'color' ? 'bg-pink-100 text-pink-800' :
                            type === 'theme' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(type, tag)}
                            className="ml-1 text-xs hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-rose-300 hover:bg-rose-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Category</h2>
              <form onSubmit={handleAddCategory}>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none mb-4"
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-rose-300 hover:bg-rose-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="w-full aspect-square object-cover rounded-lg border"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Inventory Number</h3>
                    <p className="text-2xl font-mono font-bold text-rose-400">#{selectedItem.inventory_number}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700">Category</h3>
                    <p className="text-gray-900">{selectedItem.category}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {renderTagBadges(selectedItem.tags)}
                    </div>
                  </div>
                  
                  {selectedItem.notes && (
                    <div>
                      <h3 className="font-medium text-gray-700">Notes</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{selectedItem.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;