import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Category icons mapping
const getCategoryIcon = (categoryName) => {
  const icons = {
    'all': '👗',
    'tops': '👕',
    'bottoms': '👖', 
    'dresses': '👗',
    'skirts': '🩱',
    'shorts': '🩳',
    'jackets': '🧥',
    'coats': '🧥',
    'shoes': '👠',
    'accessories': '👜',
    'jewelry': '💍',
    'bags': '👜',
    'hats': '👒',
    'scarves': '🧣',
    'lingerie': '👙',
    'activewear': '🏃‍♀️',
    'swimwear': '👙',
    'sleepwear': '🩱',
    'outerwear': '🧥'
  };
  
  const key = categoryName.toLowerCase();
  return icons[key] || '👕'; // Default to shirt icon
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [clothingItems, setClothingItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tagCategories, setTagCategories] = useState([]);
  const [stats, setStats] = useState(null);
  
  // UI States
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showTagCategoryForm, setShowTagCategoryForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    image: '',
    tags: {},
    notes: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('');
  const [newTag, setNewTag] = useState({ type: '', value: '' });

  // Load data on component mount
  useEffect(() => {
    fetchClothingItems();
    fetchCategories();
    fetchTagCategories();
    fetchStats();
  }, []);

  // Filter items when search query, category, or tags change
  useEffect(() => {
    let filtered = clothingItems;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Apply tag filters
    Object.entries(selectedTags).forEach(([tagType, tagValues]) => {
      if (tagValues.length > 0) {
        filtered = filtered.filter(item => 
          item.tags[tagType] && 
          tagValues.some(tagValue => item.tags[tagType].includes(tagValue))
        );
      }
    });
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.inventory_number.toString().includes(searchQuery) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Object.values(item.tags).flat().some(tag => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        item.notes.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
  }, [clothingItems, searchQuery, selectedCategory, selectedTags]);

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

  const fetchTagCategories = async () => {
    try {
      const response = await axios.get(`${API}/tag-categories`);
      setTagCategories(response.data);
    } catch (error) {
      console.error('Error fetching tag categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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
    if (newTag.value.trim() && newTag.type) {
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
        tags: {},
        notes: ''
      });
      setShowAddForm(false);
      fetchClothingItems();
      fetchStats();
    } catch (error) {
      console.error('Error adding clothing item:', error);
      alert('Error adding item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${API}/clothing-items/${itemId}`);
        fetchClothingItems();
        fetchStats();
        setSelectedItem(null);
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
      }
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

  const handleAddTagCategory = async (e) => {
    e.preventDefault();
    if (!newTagCategory.trim()) return;

    try {
      await axios.post(`${API}/tag-categories`, { name: newTagCategory.trim() });
      setNewTagCategory('');
      setShowTagCategoryForm(false);
      fetchTagCategories();
    } catch (error) {
      console.error('Error adding tag category:', error);
      alert('Error adding tag category. It might already exist.');
    }
  };

  const handleTagFilter = (tagType, tagValue) => {
    const newSelectedTags = { ...selectedTags };
    if (!newSelectedTags[tagType]) {
      newSelectedTags[tagType] = [];
    }
    
    if (newSelectedTags[tagType].includes(tagValue)) {
      newSelectedTags[tagType] = newSelectedTags[tagType].filter(t => t !== tagValue);
    } else {
      newSelectedTags[tagType].push(tagValue);
    }
    
    if (newSelectedTags[tagType].length === 0) {
      delete newSelectedTags[tagType];
    }
    
    setSelectedTags(newSelectedTags);
  };

  const getAllTags = () => {
    const allTags = {};
    clothingItems.forEach(item => {
      Object.entries(item.tags).forEach(([type, tags]) => {
        if (!allTags[type]) allTags[type] = new Set();
        tags.forEach(tag => allTags[type].add(tag));
      });
    });
    
    // Convert sets to arrays
    Object.keys(allTags).forEach(type => {
      allTags[type] = Array.from(allTags[type]).sort();
    });
    
    return allTags;
  };

  const renderTagBadges = (tags) => {
    const allTags = Object.entries(tags).flatMap(([type, tagList]) => 
      tagList.map(tag => ({ type, tag }))
    );
    
    const colors = {
      color: 'bg-pink-100 text-pink-800',
      theme: 'bg-purple-100 text-purple-800', 
      features: 'bg-blue-100 text-blue-800',
      material: 'bg-green-100 text-green-800'
    };
    
    return allTags.map((item, index) => (
      <span 
        key={index} 
        className={`inline-block px-2 py-1 rounded-full text-xs font-medium mr-1 mb-1 ${
          colors[item.type] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {item.tag}
      </span>
    ));
  };

  const renderThumbnailImage = (src, alt, className = '') => {
    return (
      <div className={`bg-gray-100 overflow-hidden ${className}`}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          style={{
            objectPosition: 'center 25%' // Crop from center-top for better clothing visibility
          }}
        />
      </div>
    );
  };

  const renderFullImage = (src, alt, className = '') => {
    return (
      <div className={`bg-gray-100 overflow-hidden ${className}`}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain" // Don't crop, show full image
        />
      </div>
    );
  };

  // Home Page Component
  const HomePage = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Browse by Category</h2>
        <p className="text-gray-600">Select a category to view your items</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* All Items Card */}
        <div
          onClick={() => {
            setSelectedCategory('all');
            setCurrentPage('catalog');
          }}
          className="category-card cursor-pointer"
        >
          <div className="aspect-square bg-gradient-to-br from-pink-200 to-rose-300 rounded-2xl flex items-center justify-center text-4xl mb-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            {getCategoryIcon('all')}
          </div>
          <h3 className="font-semibold text-gray-800 text-center">All Items</h3>
          <p className="text-sm text-gray-500 text-center">{clothingItems.length} items</p>
        </div>

        {/* Category Cards */}
        {categories.map(category => {
          const categoryItems = clothingItems.filter(item => item.category === category.name);
          return (
            <div
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.name);
                setCurrentPage('catalog');
              }}
              className="category-card cursor-pointer"
            >
              <div className="aspect-square bg-gradient-to-br from-pink-100 to-rose-200 rounded-2xl flex items-center justify-center text-4xl mb-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                {getCategoryIcon(category.name)}
              </div>
              <h3 className="font-semibold text-gray-800 text-center">{category.name}</h3>
              <p className="text-sm text-gray-500 text-center">{categoryItems.length} items</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Stats Page Component
  const StatsPage = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Closet Statistics</h2>
        <p className="text-gray-600">Overview of your clothing collection</p>
      </div>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Items */}
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Total Items</h3>
            <p className="text-4xl font-bold">{stats.total_items}</p>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Categories</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(stats.categories).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-gray-700">{category}</span>
                  <span className="font-semibold text-pink-600">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {Object.entries(stats.tags).map(([tagType, tagCounts]) => (
            <div key={tagType} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize">{tagType}</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(tagCounts).map(([tag, count]) => (
                  <div key={tag} className="flex justify-between items-center">
                    <span className="text-gray-700">{tag}</span>
                    <span className="font-semibold text-purple-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-pink-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-pink-100 transition-colors"
              >
                <div className="space-y-1">
                  <div className="w-6 h-0.5 bg-gray-600"></div>
                  <div className="w-6 h-0.5 bg-gray-600"></div>
                  <div className="w-6 h-0.5 bg-gray-600"></div>
                </div>
              </button>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent lily-font">
                Lily's Closet
              </h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCategoryForm(true)}
                className="bg-pink-100 hover:bg-pink-200 text-pink-700 px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Add Category
              </button>
              <button
                onClick={() => setShowTagCategoryForm(true)}
                className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Add Tag Type
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-30 w-80 h-screen lg:h-auto bg-white/90 backdrop-blur-lg border-r border-pink-100 transition-transform duration-300 overflow-y-auto`}>
          <div className="p-6">
            {/* Navigation */}
            <div className="space-y-2 mb-6">
              <button
                onClick={() => setCurrentPage('home')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  currentPage === 'home' 
                    ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg' 
                    : 'text-gray-700 hover:bg-pink-50'
                }`}
              >
                🏠 Home
              </button>
              <button
                onClick={() => setCurrentPage('catalog')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  currentPage === 'catalog' 
                    ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg' 
                    : 'text-gray-700 hover:bg-pink-50'
                }`}
              >
                👗 Catalog
              </button>
              <button
                onClick={() => setCurrentPage('stats')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  currentPage === 'stats' 
                    ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg' 
                    : 'text-gray-700 hover:bg-pink-50'
                }`}
              >
                📊 Statistics
              </button>
            </div>

            {/* Search */}
            {currentPage === 'catalog' && (
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none bg-white/80"
                />
              </div>
            )}

            {/* Categories Filter */}
            {currentPage === 'catalog' && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-pink-100 text-pink-800 font-medium'
                        : 'text-gray-600 hover:bg-pink-50'
                    }`}
                  >
                    All Items ({clothingItems.length})
                  </button>
                  {categories.map(category => {
                    const count = clothingItems.filter(item => item.category === category.name).length;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === category.name
                            ? 'bg-pink-100 text-pink-800 font-medium'
                            : 'text-gray-600 hover:bg-pink-50'
                        }`}
                      >
                        {category.name} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags Filter */}
            {currentPage === 'catalog' && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Tags</h3>
                {Object.entries(getAllTags()).map(([tagType, tags]) => (
                  <div key={tagType} className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">{tagType}</h4>
                    <div className="space-y-1">
                      {tags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleTagFilter(tagType, tag)}
                          className={`block w-full text-left px-3 py-1 rounded-lg text-sm transition-colors ${
                            selectedTags[tagType]?.includes(tag)
                              ? 'bg-purple-100 text-purple-800 font-medium'
                              : 'text-gray-600 hover:bg-purple-50'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {currentPage === 'home' && <HomePage />}
          {currentPage === 'stats' && <StatsPage />}
          
          {currentPage === 'catalog' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedCategory === 'all' ? 'All Items' : selectedCategory}
                </h2>
                <p className="text-gray-600">{filteredItems.length} items</p>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden group transform hover:-translate-y-1"
                  >
                    {renderThumbnailImage(
                      item.image,
                      item.name,
                      "aspect-square group-hover:scale-105 transition-transform duration-300"
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        <span className="text-sm font-mono text-pink-500 bg-pink-50 px-2 py-1 rounded-lg shrink-0 ml-2">
                          #{item.inventory_number}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{item.category}</p>
                      <div className="flex flex-wrap gap-1">
                        {renderTagBadges(item.tags)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👗</div>
                  <p className="text-gray-500 text-lg">No items found</p>
                  <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Item</h2>
              <form onSubmit={handleSubmitItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none bg-white"
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
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl text-sm transition-colors"
                    >
                      📱 Upload Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl text-sm transition-colors"
                    >
                      📷 Take Photo
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
                    <div className="mt-3">
                      {renderFullImage(
                        formData.image,
                        "Preview",
                        "w-full h-32 rounded-xl border"
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={newTag.type}
                      onChange={(e) => setNewTag({ ...newTag, type: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none bg-white text-sm"
                    >
                      <option value="">Select Type</option>
                      {tagCategories.map(tagCat => (
                        <option key={tagCat.id} value={tagCat.name}>
                          {tagCat.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newTag.value}
                      onChange={(e) => setNewTag({ ...newTag, value: e.target.value })}
                      placeholder="Enter tag"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white px-4 py-2 rounded-xl text-sm transition-all duration-200"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(formData.tags).map(([type, tags]) =>
                      tags.map(tag => (
                        <span
                          key={`${type}-${tag}`}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200"
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
          <div className="bg-white rounded-2xl max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Category</h2>
              <form onSubmit={handleAddCategory}>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none mb-4"
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Tag Category Modal */}
      {showTagCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Tag Type</h2>
              <form onSubmit={handleAddTagCategory}>
                <input
                  type="text"
                  value={newTagCategory}
                  onChange={(e) => setNewTagCategory(e.target.value)}
                  placeholder="Tag type (e.g., material, season)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-300 outline-none mb-4"
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTagCategoryForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200"
                  >
                    Add Type
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
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-gray-900">{selectedItem.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteItem(selectedItem.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl px-2"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  {renderFullImage(
                    selectedItem.image,
                    selectedItem.name,
                    "w-full aspect-square rounded-2xl border shadow-lg"
                  )}
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-700 text-lg mb-2">Inventory Number</h3>
                    <p className="text-3xl font-mono font-bold text-pink-500">#{selectedItem.inventory_number}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700 text-lg mb-2">Category</h3>
                    <p className="text-xl text-gray-900">{selectedItem.category}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700 text-lg mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {renderTagBadges(selectedItem.tags)}
                    </div>
                  </div>
                  
                  {selectedItem.notes && (
                    <div>
                      <h3 className="font-semibold text-gray-700 text-lg mb-2">Notes</h3>
                      <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl">{selectedItem.notes}</p>
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