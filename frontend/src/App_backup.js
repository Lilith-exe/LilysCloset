import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Import localStorage API functions
import {
  initializeApp,
  categoriesAPI,
  clothingItemsAPI,
  subcategoriesAPI,
  tagsAPI,
  tagCategoriesAPI,
  statisticsAPI,
  backupAPI
} from './localStorage';

// FIXED: Helper function to handle all alerts with timeout to prevent text input focus bug
// Alternative approach: Try to avoid native alerts entirely in Electron
const safeAlert = (message) => {
  // For now, use multiple approaches to try to fix Electron text input issue
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    // We're in Electron - try alternative approach
    console.warn('ELECTRON ALERT:', message);
    
    // Try creating a temporary overlay instead of native alert
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
      background: rgba(0,0,0,0.5); z-index: 9999; 
      display: flex; align-items: center; justify-content: center;
    `;
    
    const alertBox = document.createElement('div');
    alertBox.style.cssText = `
      background: white; padding: 20px; border-radius: 8px; 
      box-shadow: 0 4px 16px rgba(0,0,0,0.2); max-width: 400px;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    alertBox.innerHTML = `
      <p style="margin: 0 0 16px 0; color: #333;">${message}</p>
      <button style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">OK</button>
    `;
    
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);
    
    const button = alertBox.querySelector('button');
    button.onclick = () => {
      document.body.removeChild(overlay);
      // Force focus reset for Electron
      setTimeout(() => {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          input.removeAttribute('disabled');
          input.style.pointerEvents = 'auto';
        });
      }, 50);
    };
  } else {
    // Not in Electron or fallback - use timed native alert
    requestAnimationFrame(() => {
      setTimeout(() => {
        alert(message);
      }, 100);
    });
  }
};
// Default flaticon URLs for categories
const getDefaultCategoryIcon = (categoryName) => {
  const iconUrls = {
    'all': 'https://cdn-icons-png.flaticon.com/128/7183/7183097.png', // Hanger
    'tops': 'https://cdn-icons-png.flaticon.com/128/7183/7183139.png', // Shirt
    'bottoms': 'https://cdn-icons-png.flaticon.com/128/7183/7183148.png', // Pants/Shorts
    'dresses': 'https://cdn-icons-png.flaticon.com/128/7183/7183153.png', // Dress
    'skirts': 'https://cdn-icons-png.flaticon.com/128/7183/7183158.png', // Skirt
    'shorts': 'https://cdn-icons-png.flaticon.com/128/7183/7183148.png', // Shorts
    'jackets': 'https://cdn-icons-png.flaticon.com/128/7183/7183193.png', // Vest/Jacket
    'coats': 'https://cdn-icons-png.flaticon.com/128/7183/7183193.png', // Coat
    'shoes': 'https://cdn-icons-png.flaticon.com/128/7183/7183163.png', // Sneaker
    'accessories': 'https://cdn-icons-png.flaticon.com/128/7183/7183049.png', // Belt/Accessories
    'jewelry': 'https://cdn-icons-png.flaticon.com/128/7183/7183125.png', // Necklace
    'bags': 'https://cdn-icons-png.flaticon.com/128/7183/7183082.png', // Bag/Purse
    'hats': 'https://cdn-icons-png.flaticon.com/128/7183/7183072.png', // Cap
    'scarves': 'https://cdn-icons-png.flaticon.com/128/7183/7183049.png', // Scarf/Belt
    'lingerie': 'https://cdn-icons-png.flaticon.com/128/7183/7183068.png', // Lingerie
    'activewear': 'https://cdn-icons-png.flaticon.com/128/7183/7183172.png', // T-shirt
    'swimwear': 'https://cdn-icons-png.flaticon.com/128/7183/7183068.png', // Swimwear
    'sleepwear': 'https://cdn-icons-png.flaticon.com/128/7183/7183172.png', // Sleepwear
    'outerwear': 'https://cdn-icons-png.flaticon.com/128/7183/7183193.png' // Outerwear
  };

  const key = categoryName.toLowerCase();
  return iconUrls[key] || 'https://cdn-icons-png.flaticon.com/128/7183/7183097.png'; // Default to hanger
};

// Get category icon with custom icon support
const getCategoryIcon = (categoryName, customIcon = null) => {
  if (customIcon) {
    return customIcon;
  }
  return getDefaultCategoryIcon(categoryName);
};

// Get subcategory icon with inheritance and custom icon support
const getSubcategoryIcon = (subcategory, parentCategory, categories) => {
  if (subcategory.custom_icon) {
    return subcategory.custom_icon;
  }

  const parentCategoryData = categories.find(cat => cat.name.toLowerCase() === parentCategory.toLowerCase());
  if (parentCategoryData && parentCategoryData.custom_icon) {
    return parentCategoryData.custom_icon;
  }

  return getDefaultCategoryIcon(parentCategory);
};

// Color mapping for color tags - rainbow order with proper colors
const getColorHex = (colorName) => {
  const colors = {
    'red': '#EF4444', 'orange': '#F97316', 'yellow': '#FDE047', 'green': '#22C55E',
    'blue': '#3B82F6', 'indigo': '#6366F1', 'purple': 'rgba(139, 92, 246, 1)', 'pink': '#EC4899',
    'white': '#F9FAFB', 'gray': '#6B7280', 'grey': '#6B7280', 'black': '#1F2937',
    'navy': '#1E3A8A', 'maroon': '#7F1D1D', 'beige': '#D2B48C', 'cream': '#FEF3C7',
    'gold': '#F59E0B', 'silver': '#9CA3AF', 'rose': '#FB7185', 'coral': '#FF7F7F',
    'mint': '#6EE7B7', 'lavender': '#C4B5FD', 'turquoise': '#06B6D4', 'olive': '#84CC16',
    'brown': '#92400E', 'rainbow': 'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)'
  };

  const key = colorName.toLowerCase();
  return colors[key] || '#6B7280'; // Default to gray
};

// Rainbow order for color tags
const getColorOrder = () => {
  return ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink', 'white', 'gray', 'black', 'rainbow'];
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedSubcategoryParent, setSelectedSubcategoryParent] = useState(null);
  const [clothingItems, setClothingItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tagCategories, setTagCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]); // FIXED: Consistent naming
  const [subcategories, setSubcategories] = useState({});
  const [stats, setStats] = useState(null);

  // UI States
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showTagCategoryForm, setShowTagCategoryForm] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState({});
  const [filterMode, setFilterMode] = useState('and'); // 'and' or 'or'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [accessoriesExpanded, setAccessoriesExpanded] = useState(false);
  const [expandedTagTypes, setExpandedTagTypes] = useState({});
  const [darkMode, setDarkMode] = useState(false);

  // Image cropping states
  const [originalImage, setOriginalImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState({ width: 300, height: 300 });

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    image: '',
    tags: {},
    notes: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('');
  const [newTag, setNewTag] = useState({
    name: '',
    tag_type: '',
    categories: []
  });

  const debugLocalStorage = () => {
    console.log('=== LOCALSTORAGE DEBUG ===');
    console.log('Tags in localStorage:', JSON.parse(localStorage.getItem('lilysCloset_tags') || '[]'));
    console.log('Available tags in state:', availableTags); // FIXED: Use correct variable
    console.log('Tag categories in state:', tagCategories);
    console.log('========================');
  };

  // Dark mode persistence
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    localStorage.setItem('darkMode', newDarkMode.toString());

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Initialize the app with localStorage
  useEffect(() => {
    initializeApp();
    fetchClothingItems();
    fetchCategories();
    fetchAvailableTags();
    fetchTagCategories();
  }, []);

  useEffect(() => {
    if (currentPage === 'stats') {
      fetchStats();
    }
  }, [currentPage]);

  // Initialize expanded state for tag types after categories and tagCategories are loaded
  useEffect(() => {
    const initialTagTypes = {};
    ['color', 'theme', 'features', 'material'].forEach(type => {
      initialTagTypes[type] = true; // Start expanded
    });
    setExpandedTagTypes(initialTagTypes);
  }, [categories, tagCategories]);

  // Filter items when search query, category, or tags change
  useEffect(() => {
    let filtered = clothingItems;

    if (selectedCategory !== 'all') {
      if (selectedCategory.startsWith('accessories-')) {
        // Handle subcategory filtering - use case-insensitive comparison
        const subcategoryName = selectedCategory.replace('accessories-', '');
        filtered = filtered.filter(item =>
          item.category && item.category.toLowerCase() === 'accessories' &&
          item.subcategory === subcategoryName
        );
      } else {
        // Handle regular category filtering - use case-insensitive comparison
        filtered = filtered.filter(item =>
          item.category && item.category.toLowerCase() === selectedCategory.toLowerCase()
        );
      }
    }

    // Apply tag filters with AND/OR logic
    const selectedTagsList = Object.entries(selectedTags).flatMap(([tagType, tagValues]) =>
      tagValues.map(tagValue => ({ tagType, tagValue }))
    );

    if (selectedTagsList.length > 0) {
      filtered = filtered.filter(item => {
        if (filterMode === 'and') {
          // AND mode: item must have ALL selected individual tags
          return selectedTagsList.every(({ tagType, tagValue }) =>
            item.tags[tagType] && item.tags[tagType].includes(tagValue)
          );
        } else {
          // OR mode: item must have at least ONE of the selected tags
          return selectedTagsList.some(({ tagType, tagValue }) =>
            item.tags[tagType] && item.tags[tagType].includes(tagValue)
          );
        }
      });
    }

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
  }, [clothingItems, searchQuery, selectedCategory, selectedTags, filterMode]);

  const toggleTagType = (tagType) => {
    setExpandedTagTypes(prev => ({
      ...prev,
      [tagType]: !prev[tagType]
    }));
  };

  const fetchClothingItems = async () => {
    try {
      const response = await clothingItemsAPI.getAll();
      console.log('Fetched clothing items:', response.length, 'items');
      setClothingItems(response);
    } catch (error) {
      console.error('Error fetching clothing items:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTagCategories = async () => {
    try {
      const response = await tagCategoriesAPI.getAll();
      setTagCategories(response);
    } catch (error) {
      console.error('Error fetching tag categories:', error);
    }
  };

  // FIXED: Consistent function naming and variable usage
  const fetchAvailableTags = async () => {
    try {
      console.log('Fetching tags...');
      const response = await tagsAPI.getAll();
      console.log('Fetched tags:', response);
      setAvailableTags(response); // FIXED: Use correct setter
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  // FIXED: Add error handling for fetchSubcategories to prevent crashes
  const fetchSubcategories = async (categoryName) => {
    try {
      console.log('Fetching subcategories for:', categoryName);
      const response = await subcategoriesAPI.getByCategory(categoryName);
      console.log('Subcategories response:', response);
      
      setSubcategories(prev => ({
        ...prev,
        [categoryName.toLowerCase()]: response
      }));
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      // Set empty array on error to prevent crashes
      setSubcategories(prev => ({
        ...prev,
        [categoryName.toLowerCase()]: []
      }));
    }
  };

  const fetchStats = async () => {
    try {
      const statisticsData = await statisticsAPI.get();
      setStats(statisticsData);
    } catch (error) {
      console.error('Error loading statistics:', error);
      setStats({ totalItems: 0, categories: {}, tags: {} }); // FIXED: Use correct field name
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
        setOriginalImage(base64);
        setShowCropModal(true);
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
        setOriginalImage(base64);
        setShowCropModal(true);
      } catch (error) {
        console.error('Error converting camera image:', error);
      }
    }
  };

  const handleCropImage = () => {
    if (!originalImage || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Set high quality canvas size - use actual crop dimensions for better quality
    const finalSize = 800; // Higher resolution output
    canvas.width = finalSize;
    canvas.height = finalSize;

    // Calculate scale factors
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    // Enable high quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw cropped image at high quality
    ctx.drawImage(
      img,
      cropPosition.x * scaleX,
      cropPosition.y * scaleY,
      cropSize.width * scaleX,
      cropSize.height * scaleY,
      0,
      0,
      finalSize,
      finalSize
    );

    // Use high quality JPEG with 95% quality
    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.95);
    setCroppedImage(croppedBase64);

    if (editingItem) {
      setEditingItem({ ...editingItem, image: croppedBase64 });
    } else {
      setFormData({ ...formData, image: croppedBase64 });
    }

    setShowCropModal(false);
    setOriginalImage(null);
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      safeAlert('Please enter an item name');
      return;
    }

    if (!formData.category) {
      safeAlert('Please select a category');
      return;
    }

    if (!formData.image) {
      safeAlert('Please add an image');
      return;
    }

    try {
      const itemData = {
        ...formData,
        name: formData.name.trim(),
        tags: formData.tags || {}
      };

      await clothingItemsAPI.create(itemData);
      fetchClothingItems();
      setShowAddForm(false);
      setFormData({ name: '', category: '', subcategory: '', image: '', tags: {}, notes: '' });
    } catch (error) {
      console.error('Error adding item:', error);
      safeAlert('Error adding item. Please check all fields and try again.');
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editingItem.name || !editingItem.category || !editingItem.image) {
      safeAlert('Please fill in all required fields');
      return;
    }

    try {
      await clothingItemsAPI.update(editingItem.id, editingItem);
      setShowEditForm(false);
      setEditingItem(null);
      fetchClothingItems();
      fetchStats();

      // Update selectedItem if it's the same item being edited
      if (selectedItem && selectedItem.id === editingItem.id) {
        setSelectedItem({ ...editingItem });
      }
    } catch (error) {
      console.error('Error updating clothing item:', error);
      safeAlert('Error updating item. Please try again.');
    }
  };

  // FIXED: Use localStorage API with proper focus handling for text input bug
  const handleDeleteItem = async (itemId) => {
    console.log('Delete button clicked for item ID:', itemId);

    if (!itemId) {
      safeAlert('Error: No item ID provided');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this item?');

    if (confirmed) {
      // Small timeout to prevent focus issues after confirm dialog
      setTimeout(async () => {
        try {
          console.log('Deleting item with ID:', itemId);
          await clothingItemsAPI.delete(itemId);
          console.log('Item deleted successfully');

          // Refresh the items list
          await fetchClothingItems();
          await fetchStats();

          // Close the modal
          setSelectedItem(null);

          safeAlert('Item deleted successfully!');

        } catch (error) {
          console.error('Delete error:', error);
          safeAlert('Error deleting item. Please try again.');
        }
      }, 50);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem({ ...item });
    setShowEditForm(true);
    setSelectedItem(null);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await categoriesAPI.create({ name: newCategory });
      setNewCategory('');
      setShowCategoryForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      safeAlert('Error adding category. It might already exist.');
    }
  };

  const handleAddTagCategory = async (e) => {
    e.preventDefault();
    if (!newTagCategory.trim()) return;

    try {
      await tagCategoriesAPI.create({ name: newTagCategory });
      setNewTagCategory('');
      setShowTagCategoryForm(false);
      fetchTagCategories();
    } catch (error) {
      console.error('Error adding tag category:', error);
      safeAlert('Error adding tag category. It might already exist.');
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

  const getAvailableTagsForCategory = (category, tagType) => {
    return availableTags.filter(tag =>
      tag.tag_type === tagType &&
      (tag.categories.length === 0 || tag.categories.includes(category) || category === 'all')
    );
  };

  const getAllTags = () => {
    const allTags = {};

    // Get tags from available tags system filtered by current category
    tagCategories.forEach(tagCat => {
      const categoryTags = getAvailableTagsForCategory(selectedCategory, tagCat.name);
      if (categoryTags.length > 0) {
        let tagNames = categoryTags.map(tag => tag.name);

        // Special sorting for color tags in rainbow order
        if (tagCat.name === 'color') {
          const colorOrder = getColorOrder();
          tagNames = tagNames.sort((a, b) => {
            const indexA = colorOrder.indexOf(a.toLowerCase());
            const indexB = colorOrder.indexOf(b.toLowerCase());
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
          });
        } else {
          tagNames = tagNames.sort();
        }

        allTags[tagCat.name] = tagNames;
      }
    });

    return allTags;
  };

  const renderTagBadges = (tags) => {
    const allTags = Object.entries(tags).flatMap(([type, tagList]) =>
      tagList.map(tag => ({ type, tag }))
    );

    const colors = {
      color: 'bg-pink-100 text-pink-800 dark:bg-neutral-700 dark:text-pink-400 dark:border-pink-400',
      theme: 'bg-purple-100 text-purple-800 dark:bg-neutral-700 dark:text-purple-400 dark:border-purple-400',
      features: 'bg-blue-100 text-blue-800 dark:bg-neutral-700 dark:text-blue-400 dark:border-blue-400',
      material: 'bg-green-100 text-green-800 dark:bg-neutral-700 dark:text-green-400 dark:border-green-400'
    };

    return allTags.map((item, index) => (
      <span
        key={index}
        className={`inline-block px-2 py-1 rounded-full text-xs font-medium mr-1 mb-1 border dark:border ${
          colors[item.type] || 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-gray-300 dark:border-gray-400'
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
          className="w-full h-full object-contain"
        />
      </div>
    );
  };

  // Tag Selector Component
  const TagSelector = ({ selectedTags, onTagChange, category }) => {
    return (
      <div className="space-y-4">
        {tagCategories.map(tagCat => {
          const availableTagsForType = getAvailableTagsForCategory(category, tagCat.name);
          if (availableTagsForType.length === 0) return null;

          let tagNames = availableTagsForType.map(tag => tag.name);

          // Special sorting for color tags in rainbow order
          if (tagCat.name === 'color') {
            const colorOrder = getColorOrder();
            tagNames = tagNames.sort((a, b) => {
              const indexA = colorOrder.indexOf(a.toLowerCase());
              const indexB = colorOrder.indexOf(b.toLowerCase());
              if (indexA !== -1 && indexB !== -1) return indexA - indexB;
              if (indexA !== -1) return -1;
              if (indexB !== -1) return 1;
              return a.localeCompare(b);
            });
          } else {
            tagNames = tagNames.sort();
          }

          return (
            <div key={tagCat.id}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                {tagCat.name} Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tagNames.map(tagName => {
                  const isSelected = selectedTags[tagCat.name]?.includes(tagName) || false;
                  return (
                    <button
                      key={tagName}
                      type="button"
                      onClick={() => {
                        const currentTags = selectedTags[tagCat.name] || [];
                        const newTags = isSelected
                          ? currentTags.filter(t => t !== tagName)
                          : [...currentTags, tagName];
                        onTagChange(tagCat.name, newTags);
                      }}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        isSelected
                          ? 'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900 dark:border-pink-700 dark:text-pink-300'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-neutral-700 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-600'
                      }`}
                    >
                      {tagCat.name === 'color' && (
                        <>
                          {tagName.toLowerCase() === 'rainbow' ? (
                            <div
                              className="w-3 h-3 rounded-sm mr-2 border border-gray-300 inline-block"
                              style={{
                                background: 'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)',
                                backgroundSize: '100% 100%'
                              }}
                            ></div>
                          ) : (
                            <div
                              className="w-3 h-3 rounded-sm mr-2 border border-gray-300 inline-block"
                              style={{ backgroundColor: getColorHex(tagName) }}
                            ></div>
                          )}
                        </>
                      )}
                      {tagName}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Home Page Component - FIXED: Original pink gradients and grid behavior
  const HomePage = () => {
    const [categoryCounts, setCategoryCounts] = useState({});

    useEffect(() => {
      // Calculate item counts per category
      const counts = clothingItems.reduce((acc, item) => {
        const categoryName = item.category || 'uncategorized';
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {});
      setCategoryCounts(counts);
    }, [clothingItems]);

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Browse by Category</h2>
          <p className="text-gray-600 dark:text-gray-300">Select a category to view your items</p>
        </div>
        
        {/* FIXED: Original grid with proper responsive behavior and minmax */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {/* All Items Card - RESTORED original pink gradient backgrounds */}
          <div
            onClick={() => {
              setSelectedCategory('all');
              setCurrentPage('catalog');
            }}
            className="category-card cursor-pointer group"
          >
            <div className="aspect-square bg-gradient-to-br from-pink-200 to-rose-300 rounded-2xl flex items-center justify-center mb-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 p-6">
              <img
                src={getCategoryIcon('all')}
                alt="All Items"
                className="w-16 h-16 object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-center group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">All Items</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">{clothingItems.length} items</p>
          </div>

          {/* Category Cards - SORTED ALPHABETICALLY */}
          {categories.sort((a, b) => a.name.localeCompare(b.name)).map(category => {
            const categoryItems = clothingItems.filter(item => 
              item.category && item.category.toLowerCase() === category.name.toLowerCase()
            );
            return (
              <div
                key={category.id}
                onClick={async () => {
                  // FIXED: Proper accessories navigation with error handling
                  if (category.name.toLowerCase() === 'accessories') {
                    console.log('Navigating to accessories subcategories...');
                    try {
                      // Pre-fetch subcategories to prevent crashes
                      await fetchSubcategories('accessories');
                      setSelectedSubcategoryParent('accessories');
                      setCurrentPage('subcategories');
                    } catch (error) {
                      console.error('Error loading accessories subcategories:', error);
                      safeAlert('Error loading accessories. Please try again.');
                    }
                  } else {
                    setSelectedCategory(category.name);
                    setCurrentPage('catalog');
                  }
                }}
                className="category-card cursor-pointer group"
              >
                <div className="aspect-square bg-gradient-to-br from-pink-100 to-rose-200 rounded-2xl flex items-center justify-center mb-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 p-6">
                  <img
                    src={getCategoryIcon(category.name, category.custom_icon)}
                    alt={category.name}
                    className="w-16 h-16 object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-center group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{category.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">{categoryItems.length} items</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Subcategories Page Component - RESTORED functionality
  const SubcategoriesPage = () => {
    const [selectedSubcategories, setSelectedSubcategories] = useState([]);

    useEffect(() => {
      // Only fetch if we don't already have subcategories for this parent
      if (selectedSubcategoryParent && !subcategories[selectedSubcategoryParent.toLowerCase()]) {
        fetchSubcategories(selectedSubcategoryParent);
      }
    }, [selectedSubcategoryParent]);

    useEffect(() => {
      // Auto-load accessories subcategories if parent is accessories
      if (selectedSubcategoryParent === 'accessories') {
        setSelectedSubcategories(subcategories.accessories || []);
      }
    }, [subcategories.accessories, selectedSubcategoryParent]);

    if (!selectedSubcategoryParent) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Select a Category</h2>
          <p className="text-gray-600 dark:text-gray-300">Choose a category to view its subcategories</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 capitalize">
            {selectedSubcategoryParent} Subcategories
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Browse by specific subcategory</p>
        </div>
        
        {/* COPIED EXACT SAME LAYOUT AS HOMEPAGE */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {selectedSubcategories.sort((a, b) => a.name.localeCompare(b.name)).map(subcategory => {
            const subcatItems = clothingItems.filter(item =>
              item.category && item.category.toLowerCase() === selectedSubcategoryParent.toLowerCase() &&
              item.subcategory === subcategory.name
            );

            return (
              <div
                key={subcategory.id}
                onClick={() => {
                  setSelectedCategory(`${selectedSubcategoryParent.toLowerCase()}-${subcategory.name}`);
                  setCurrentPage('catalog');
                }}
                className="category-card cursor-pointer group"
              >
                <div className="aspect-square bg-gradient-to-br from-purple-100 to-purple-300 rounded-2xl flex items-center justify-center mb-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 p-6">
                  <img
                    src={getSubcategoryIcon(subcategory, selectedSubcategoryParent, categories)}
                    alt={subcategory.name}
                    className="w-16 h-16 object-contain transition-all duration-300"
                  />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-center group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{subcategory.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">{subcatItems.length} items</p>
              </div>
            );
          })}
        </div>

        {selectedSubcategories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">No subcategories yet</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">Add some subcategories in Settings</p>
          </div>
        )}
      </div>
    );
  };

  // Statistics Page Component - RESTORED original theme
  const StatsPage = () => {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">Wardrobe Statistics</h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Your collection at a glance</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Total Items Card - RESTORED original pink gradient theme */}
            <div className="bg-gradient-to-br from-pink-400 to-rose-500 dark:bg-gradient-to-br dark:from-pink-600 dark:to-rose-700 rounded-3xl p-8 text-white shadow-2xl">
              <h3 className="text-2xl font-bold mb-4">Total Items</h3>
              <p className="text-6xl font-bold">{stats.totalItems || 0}</p> {/* FIXED: Use correct field name */}
              <p className="text-pink-100 dark:text-pink-200 mt-2">pieces in your wardrobe</p>
            </div>

            {/* Categories Breakdown - RESTORED original theme */}
            <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-neutral-700">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Categories</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {stats.categories && Object.entries(stats.categories).length > 0 ? (
                  Object.entries(stats.categories).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{category}</span>
                      <span className="bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400 px-3 py-1 rounded-full text-sm font-medium">
                        {count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No category data available</p>
                )}
              </div>
            </div>

            {/* Tags Breakdown - RESTORED original theme */}
            <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-neutral-700 lg:col-span-2">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Tags Usage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stats.tags && Object.entries(stats.tags).length > 0 ? (
                  Object.entries(stats.tags).map(([tagType, tags]) => (
                    <div key={tagType} className="space-y-3">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-300 capitalize border-b border-gray-200 dark:border-neutral-600 pb-2">
                        {tagType}
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {Object.entries(tags).map(([tag, count]) => (
                          <div key={tag} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{tag}</span>
                            <span className="bg-gray-100 dark:bg-neutral-700 text-gray-800 dark:text-gray-300 px-2 py-1 rounded text-xs">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic col-span-full">No tag data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {!stats && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Loading statistics...</p>
          </div>
        )}
      </div>
    );
  };

  // Settings Page Component
  const SettingsPage = () => {
    const [newTag, setNewTag] = useState({ name: '', tag_type: '', categories: [] });
    const [newSubcategory, setNewSubcategory] = useState({ name: '', parent_category: 'accessories' });

    const handleAddTag = async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      if (!newTag.name || !newTag.name.trim()) {
        safeAlert('Please enter a tag name');
        return;
      }

      if (!newTag.tag_type) {
        safeAlert('Please select a tag type');
        return;
      }

      try {
        await tagsAPI.create({
          name: newTag.name.trim(),
          tag_type: newTag.tag_type,
          categories: newTag.categories || []
        });

        // Clear the form after successful addition
        setNewTag({
          name: '',
          tag_type: '',
          categories: []
        });

        fetchAvailableTags(); // FIXED: Use correct function name
        console.log('Tag added successfully!');
      } catch (error) {
        console.error('Error adding tag:', error);
        if (error.message.includes('already exists')) {
          safeAlert('This tag already exists');
        } else {
          safeAlert('Error adding tag. Please try again.');
        }
      }
    };

    // FIXED: Use localStorage API instead of axios with proper focus handling
    const handleDeleteTag = async (tagId) => {
      console.log('Deleting tag with ID:', tagId);

      const confirmed = window.confirm('Are you sure you want to delete this tag?');

      if (confirmed) {
        // Small timeout to prevent focus issues after confirm dialog
        setTimeout(async () => {
          try {
            await tagsAPI.delete(tagId);
            console.log('Tag deleted successfully');
            await fetchAvailableTags(); // FIXED: Use correct function name
            safeAlert('Tag deleted successfully');
          } catch (error) {
            console.error('Error deleting tag:', error);
            safeAlert('Error deleting tag. Please try again.');
          }
        }, 50);
      }
    };

    const handleAddSubcategory = async () => {
      if (!newSubcategory.name || !newSubcategory.parent_category) return;

      try {
        await subcategoriesAPI.create({
        name: newSubcategory.name,
        parent_category: 'accessories'
      });
        setNewSubcategory({ name: '', parent_category: 'accessories' });
        fetchSubcategories(newSubcategory.parent_category);
        safeAlert('Subcategory added successfully');
      } catch (error) {
        console.error('Error adding subcategory:', error);
        safeAlert('Error adding subcategory. It might already exist.');
      }
    };

    // FIXED: Use localStorage API instead of axios with proper focus handling
    const handleDeleteCategory = async (categoryId, categoryName) => {
      console.log('Deleting category:', categoryName, 'ID:', categoryId);

      const confirmed = window.confirm(`Are you sure you want to delete the "${categoryName}" category? This will not delete items in this category.`);

      if (confirmed) {
        // Small timeout to prevent focus issues after confirm dialog
        setTimeout(async () => {
          try {
            await categoriesAPI.delete(categoryId);
            console.log('Category deleted successfully');
            await fetchCategories();
            safeAlert('Category deleted successfully');
          } catch (error) {
            console.error('Error deleting category:', error);
            safeAlert('Error deleting category. Please try again.');
          }
        }, 50);
      }
    };

    // FIXED: Use localStorage API instead of axios with proper focus handling
    const handleDeleteSubcategory = async (subcategoryId, subcategoryName) => {
      console.log('Deleting subcategory:', subcategoryName, 'ID:', subcategoryId);

      const confirmed = window.confirm(`Delete ${subcategoryName} subcategory?`);

      if (confirmed) {
        // Small timeout to prevent focus issues after confirm dialog
        setTimeout(async () => {
          try {
            await subcategoriesAPI.delete(subcategoryId);
            console.log('Subcategory deleted successfully');
            await fetchSubcategories('accessories');
            safeAlert('Subcategory deleted successfully');
          } catch (error) {
            console.error('Error deleting subcategory:', error);
            safeAlert('Error deleting subcategory. Please try again.');
          }
        }, 50);
      }
    };

    // Category Icon Upload Handlers
    const handleCategoryIconUpload = async (categoryId, event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Image = e.target.result;
          await categoriesAPI.update(categoryId, {
        custom_icon: base64Image
          });
          fetchCategories(); // Refresh categories
        } catch (error) {
          console.error('Error uploading category icon:', error);
        }
      };
      reader.readAsDataURL(file);
    };

    const handleRemoveCategoryIcon = async (categoryId) => {
      try {
        await categoriesAPI.update(categoryId, {
          custom_icon: null
        });
        fetchCategories(); // Refresh categories
      } catch (error) {
        console.error('Error removing category icon:', error);
      }
    };

    // Subcategory Icon Upload Handlers
    const handleSubcategoryIconUpload = async (subcategoryId, event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Image = e.target.result;
          await subcategoriesAPI.update(subcategoryId, {
            custom_icon: base64Image
          });
          fetchSubcategories('accessories'); // Refresh subcategories
        } catch (error) {
          console.error('Error uploading subcategory icon:', error);
        }
      };
      reader.readAsDataURL(file);
    };

    // FIXED: Use localStorage API instead of axios
    const handleRemoveSubcategoryIcon = async (subcategoryId) => {
      try {
        await subcategoriesAPI.update(subcategoryId, {
          custom_icon: null
        });
        fetchSubcategories('accessories'); // Refresh subcategories
      } catch (error) {
        console.error('Error removing subcategory icon:', error);
      }
    };

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Settings</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage your categories, tags, and subcategories</p>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-neutral-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Appearance</h3>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-700 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-200">Dark Mode</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark themes</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={debugLocalStorage} className="bg-blue-500 text-white px-4 py-2 rounded">
                Debug Tags
              </button>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  darkMode ? 'bg-pink-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Tag Management - FIXED: Added proper dark mode styling */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-neutral-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Tag Management</h3>

          {/* Add New Tag */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Add New Tag</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                placeholder="Tag name (e.g., cropped, choker)"
                className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              />
              <select
                value={newTag.tag_type}
                onChange={(e) => setNewTag({ ...newTag, tag_type: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select Tag Type</option>
                {tagCategories.map(tagCat => (
                  <option key={tagCat.id} value={tagCat.name}>{tagCat.name}</option>
                ))}
              </select>
              <select
                multiple
                value={newTag.categories}
                onChange={(e) => setNewTag({
                  ...newTag,
                  categories: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Available for all categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
              <button
                onClick={handleAddTag}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Add Tag
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Hold Ctrl/Cmd to select multiple categories, or leave empty for all categories
            </p>
          </div>

          {/* Current Tags - FIXED: Use availableTags instead of tags */}
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Current Tags</h4>
            {availableTags && availableTags.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableTags.map(tag => (
                  <div key={tag.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{tag.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        ({tag.tag_type})
                      </span>
                      {tag.categories && tag.categories.length > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 block">
                          Categories: {tag.categories.join(', ')}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No tags created yet</p>
            )}
          </div>
        </div>

        {/* Category Management */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-neutral-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Category Management</h3>

          {/* Manage Categories */}
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Manage Categories</h4>
            <div className="space-y-3">
              {categories.map(category => (
                <div key={category.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-700 rounded-lg">
                  {/* Category Icon Preview */}
                  <div className="flex-shrink-0">
                    <img
                      src={getCategoryIcon(category.name, category.custom_icon)}
                      alt={category.name}
                      className="w-12 h-12 object-contain rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-600 p-1"
                    />
                  </div>

                  {/* Category Name */}
                  <div className="flex-grow">
                    <span className="font-medium text-gray-800 dark:text-gray-100">{category.name}</span>
                    {category.custom_icon && (
                      <span className="text-xs text-green-600 dark:text-green-400 block">Custom icon uploaded</span>
                    )}
                  </div>

                  {/* Icon Upload */}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCategoryIconUpload(category.id, e)}
                      className="hidden"
                      id={`category-icon-${category.id}`}
                    />
                    <label
                      htmlFor={`category-icon-${category.id}`}
                      className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg text-sm cursor-pointer transition-colors"
                    >
                      {category.custom_icon ? 'Change Icon' : 'Upload Icon'}
                    </label>

                    {category.custom_icon && (
                      <button
                        onClick={() => handleRemoveCategoryIcon(category.id)}
                        className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        Reset to Default
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subcategory Management */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-neutral-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Accessories Subcategories</h3>

          {/* Add Subcategory */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Add Accessories Subcategory</h4>
            <div className="flex gap-3">
              <input
                type="text"
                value={newSubcategory.name}
                onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                placeholder="Subcategory name (e.g., Chokers, Harnesses, Jewelry)"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={handleAddSubcategory}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Add Subcategory
              </button>
            </div>
          </div>

          {/* Current Subcategories */}
          {subcategories.accessories && (
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Current Accessories Subcategories</h4>
              <div className="space-y-3">
                {subcategories.accessories.map(sub => (
                  <div key={sub.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-700 rounded-lg">
                    {/* Subcategory Icon Preview */}
                    <div className="flex-shrink-0">
                      <img
                        src={getSubcategoryIcon(sub, 'accessories', categories)}
                        alt={sub.name}
                        className="w-12 h-12 object-contain rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-600 p-1"
                      />
                    </div>

                    {/* Subcategory Name */}
                    <div className="flex-grow">
                      <span className="font-medium text-gray-800 dark:text-gray-100">{sub.name}</span>
                      {sub.custom_icon && (
                        <span className="text-xs text-green-600 dark:text-green-400 block">Custom icon uploaded</span>
                      )}
                    </div>

                    {/* Icon Upload */}
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSubcategoryIconUpload(sub.id, e)}
                        className="hidden"
                        id={`subcategory-icon-${sub.id}`}
                      />
                      <label
                        htmlFor={`subcategory-icon-${sub.id}`}
                        className="bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg text-sm cursor-pointer transition-colors"
                      >
                        {sub.custom_icon ? 'Change Icon' : 'Upload Icon'}
                      </label>

                      {sub.custom_icon && (
                        <button
                          onClick={() => handleRemoveSubcategoryIcon(sub.id)}
                          className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          Reset to Inherit
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                        className="bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 flex">
      {/* Sidebar - RESTORED full height and removed "Navigation" text */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed lg:relative lg:translate-x-0 w-80 h-screen bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl shadow-2xl z-50 transition-transform duration-300 ease-in-out border-r border-pink-100 dark:border-neutral-700`}>
        <div className="p-6 h-full flex flex-col overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-2 mb-8">
            <button
              onClick={() => setCurrentPage('home')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                currentPage === 'home'
                  ? 'bg-pink-100 dark:bg-neutral-700 text-pink-800 dark:text-[#FFCCCC] shadow-md'
                  : 'text-gray-700 dark:text-[#FFCCCC] hover:bg-pink-50 dark:hover:bg-neutral-700'
              }`}
            >
              🏠 Home
            </button>
            <button
              onClick={() => setCurrentPage('catalog')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                currentPage === 'catalog'
                  ? 'bg-pink-100 dark:bg-neutral-700 text-pink-800 dark:text-[#FFCCCC] shadow-md'
                  : 'text-gray-700 dark:text-[#FFCCCC] hover:bg-pink-50 dark:hover:bg-neutral-700'
              }`}
            >
              👗 Catalog
            </button>
            <button
              onClick={() => setCurrentPage('stats')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                currentPage === 'stats'
                  ? 'bg-pink-100 dark:bg-neutral-700 text-pink-800 dark:text-[#FFCCCC] shadow-md'
                  : 'text-gray-700 dark:text-[#FFCCCC] hover:bg-pink-50 dark:hover:bg-neutral-700'
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
                className="w-full px-4 py-3 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          )}

          {/* Categories Filter */}
          {currentPage === 'catalog' && (
            <div>
              <button
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="flex items-center justify-between w-full font-semibold text-gray-800 dark:text-[#FFCCCC] mb-3 hover:text-pink-600 dark:hover:text-pink-300 transition-colors"
              >
                <span>Categories</span>
                <span className={`transition-transform ${categoriesExpanded ? 'rotate-90' : ''}`}>▶</span>
              </button>

              {categoriesExpanded && (
                <div className="space-y-1 mb-6">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-purple-100 dark:bg-neutral-700 text-purple-800 dark:text-purple-400 font-medium'
                        : 'text-gray-600 dark:text-[#FFCCCC] hover:bg-purple-50 dark:hover:bg-neutral-700'
                    }`}
                  >
                    All Items ({clothingItems.length})
                  </button>
                  {categories.map(category => {
                    const categoryItems = clothingItems.filter(item =>
                      item.category && item.category.toLowerCase() === category.name.toLowerCase()
                    );
                    return (
                      <div key={category.id} className="space-y-1">
                        <button
                          onClick={() => {
                            if (category.name.toLowerCase() === 'accessories') {
                              // FIXED: Properly toggle accessories expansion and load subcategories
                              setAccessoriesExpanded(!accessoriesExpanded);
                              if (!accessoriesExpanded) {
                                fetchSubcategories('accessories');
                              }
                            } else {
                              setSelectedCategory(category.name);
                            }
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedCategory === category.name
                              ? 'bg-purple-100 dark:bg-neutral-700 text-purple-800 dark:text-purple-400 font-medium'
                              : 'text-gray-600 dark:text-[#FFCCCC] hover:bg-purple-50 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {category.name} ({categoryItems.length})
                        </button>

                        {/* Accessories Subcategories - FIXED: Proper logic */}
                        {category.name.toLowerCase() === 'accessories' && accessoriesExpanded && (
                          <div className="ml-4 space-y-1">
                            {subcategories.accessories && subcategories.accessories.length > 0 ? (
                              subcategories.accessories.map(subcategory => {
                                const subcatItems = clothingItems.filter(item =>
                                  item.category && item.category.toLowerCase() === 'accessories' &&
                                  item.subcategory === subcategory.name
                                );
                                return (
                                  <button
                                    key={subcategory.id}
                                    onClick={() => setSelectedCategory(`accessories-${subcategory.name}`)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                      selectedCategory === `accessories-${subcategory.name}`
                                        ? 'bg-purple-100 dark:bg-neutral-700 text-purple-800 dark:text-purple-400 font-medium'
                                        : 'text-gray-600 dark:text-[#FFCCCC] hover:bg-purple-50 dark:hover:bg-neutral-700'
                                    }`}
                                  >
                                    {subcategory.name} ({subcatItems.length})
                                  </button>
                                );
                              })
                            ) : (
                              <p className="text-xs text-gray-400 dark:text-gray-500 italic px-3">No subcategories yet</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tags Filter */}
          {currentPage === 'catalog' && (
            <div>
              <button
                onClick={() => setTagsExpanded(!tagsExpanded)}
                className="flex items-center justify-between w-full font-semibold text-gray-800 dark:text-[#FFCCCC] mb-3 hover:text-pink-600 dark:hover:text-pink-300 transition-colors"
              >
                <span>Tags</span>
                <span className={`transition-transform ${tagsExpanded ? 'rotate-90' : ''}`}>▶</span>
              </button>

              {tagsExpanded && Object.entries(getAllTags()).map(([tagType, tags]) => (
                <div key={tagType} className="mb-4">
                  <button
                    onClick={() => toggleTagType(tagType)}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-[#FFCCCC] mb-2 hover:text-purple-600 dark:hover:text-pink-300 transition-colors"
                  >
                    <span className="capitalize">{tagType}</span>
                    <span className={`transition-transform text-xs ${expandedTagTypes[tagType] ? 'rotate-90' : ''}`}>▶</span>
                  </button>

                  {expandedTagTypes[tagType] && (
                    <div className="space-y-1 ml-2 border-l-2 border-gray-100 dark:border-neutral-600 pl-3">
                      {tags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleTagFilter(tagType, tag)}
                          className={`flex items-center w-full text-left px-3 py-1 rounded-lg text-sm transition-colors ${
                            selectedTags[tagType]?.includes(tag)
                              ? 'bg-purple-100 dark:bg-neutral-700 text-purple-800 dark:text-purple-400 font-medium'
                              : 'text-gray-600 dark:text-[#FFCCCC] hover:bg-purple-50 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {tagType === 'color' && (
                            <>
                              {tag.toLowerCase() === 'rainbow' ? (
                                <div
                                  className="w-3 h-3 rounded-sm mr-2 border border-gray-300 shrink-0"
                                  style={{
                                    background: 'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)',
                                    backgroundSize: '100% 100%'
                                  }}
                                ></div>
                              ) : (
                                <div
                                  className="w-3 h-3 rounded-sm mr-2 border border-gray-300 shrink-0"
                                  style={{ backgroundColor: getColorHex(tag) }}
                                ></div>
                              )}
                            </>
                          )}
                          <span className="truncate">{tag}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-lg shadow-sm border-b border-pink-100 dark:border-neutral-700 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent lily-font px-4 py-2">
                  Lily's Closet
                </h1>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentPage('settings')}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Settings"
                >
                  ⚙️ Settings
                </button>
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="bg-pink-100 hover:bg-pink-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-pink-700 dark:text-pink-300 px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Add Category
                </button>
                <button
                  onClick={() => setShowTagCategoryForm(true)}
                  className="bg-purple-100 hover:bg-purple-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Add Tag Type
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 dark:from-neutral-700 dark:to-neutral-600 dark:hover:from-neutral-600 dark:hover:to-neutral-500 text-white dark:text-pink-400 px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6">
          {currentPage === 'home' && <HomePage />}
          {currentPage === 'subcategories' && <SubcategoriesPage />}
          {currentPage === 'stats' && <StatsPage />}
          {currentPage === 'settings' && <SettingsPage />}

          {currentPage === 'catalog' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {selectedCategory === 'all'
                    ? 'All Items'
                    : selectedCategory.startsWith('accessories-')
                      ? `Accessories - ${selectedCategory.replace('accessories-', '')}`
                      : selectedCategory
                  }
                </h2>
                <p className="text-gray-600 dark:text-gray-300">{filteredItems.length} items</p>
              </div>

              {/* Items Grid - RESTORED original responsive grid behavior without stretching */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-neutral-700 overflow-hidden group transform hover:-translate-y-1"
                  >
                    {renderThumbnailImage(
                      item.image,
                      item.name,
                      "aspect-square group-hover:scale-105 transition-transform duration-300"
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</h3>
                        <span className="text-sm font-mono text-pink-500 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-2 py-1 rounded-lg shrink-0 ml-2">
                          #{item.inventory_number}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{item.category}</p>
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
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No items found</p>
                  <p className="text-gray-400 dark:text-gray-500 mt-2">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Crop Modal */}
      {showCropModal && originalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Crop Your Image</h2>

              <div className="relative mb-4">
                <img
                  ref={imageRef}
                  src={originalImage}
                  alt="Original"
                  className="max-w-full h-auto max-h-96 mx-auto"
                  onLoad={() => {
                    if (imageRef.current) {
                      const imgRect = imageRef.current.getBoundingClientRect();
                      const size = Math.min(imgRect.width, imgRect.height) * 0.8;
                      setCropSize({ width: size, height: size });
                      setCropPosition({
                        x: (imgRect.width - size) / 2,
                        y: (imgRect.height - size) / 4 // Start from top-center
                      });
                    }
                  }}
                />

                {/* Crop overlay */}
                <div
                  className="absolute border-2 border-pink-500 bg-pink-500/20 cursor-move select-none"
                  style={{
                    left: cropPosition.x,
                    top: cropPosition.y,
                    width: cropSize.width,
                    height: cropSize.height,
                  }}
                  onMouseDown={(e) => {
                    const startX = e.clientX - cropPosition.x;
                    const startY = e.clientY - cropPosition.y;

                    const handleMouseMove = (e) => {
                      const imgRect = imageRef.current?.getBoundingClientRect();
                      if (!imgRect) return;

                      const newX = Math.max(0, Math.min(e.clientX - startX, imgRect.width - cropSize.width));
                      const newY = Math.max(0, Math.min(e.clientY - startY, imgRect.height - cropSize.height));
                      setCropPosition({ x: newX, y: newY });
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white font-medium text-sm">
                    Drag to position
                  </div>

                  {/* Resize handles */}
                  <div
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-pink-500 border-2 border-white rounded-full cursor-se-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startSize = cropSize.width;

                      const handleMouseMove = (e) => {
                        const imgRect = imageRef.current?.getBoundingClientRect();
                        if (!imgRect) return;

                        const deltaX = e.clientX - startX;
                        const deltaY = e.clientY - startY;
                        const delta = Math.max(deltaX, deltaY); // Keep 1:1 ratio

                        const newSize = Math.max(50, Math.min(
                          startSize + delta,
                          imgRect.width - cropPosition.x,
                          imgRect.height - cropPosition.y,
                          Math.min(imgRect.width, imgRect.height)
                        ));

                        setCropSize({ width: newSize, height: newSize });
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />

                  <div
                    className="absolute -top-2 -left-2 w-4 h-4 bg-pink-500 border-2 border-white rounded-full cursor-nw-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startSize = cropSize.width;
                      const startPosX = cropPosition.x;
                      const startPosY = cropPosition.y;

                      const handleMouseMove = (e) => {
                        const deltaX = startX - e.clientX;
                        const deltaY = startY - e.clientY;
                        const delta = Math.max(deltaX, deltaY); // Keep 1:1 ratio

                        const newSize = Math.max(50, Math.min(
                          startSize + delta,
                          startPosX + startSize,
                          startPosY + startSize
                        ));

                        const sizeDiff = newSize - startSize;
                        const newX = Math.max(0, startPosX - sizeDiff);
                        const newY = Math.max(0, startPosY - sizeDiff);

                        setCropSize({ width: newSize, height: newSize });
                        setCropPosition({ x: newX, y: newY });
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCropModal(false);
                    setOriginalImage(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropImage}
                  className="flex-1 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200"
                >
                  Crop & Use
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Add New Item</h2>
              <form onSubmit={handleSubmitItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      console.log('Add Item - Category selected:', e.target.value);
                      setFormData({ ...formData, category: e.target.value, subcategory: '' });
                      if (e.target.value.toLowerCase() === 'accessories') {
                        console.log('Add Item - Accessories selected, fetching subcategories');
                        fetchSubcategories('accessories');
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
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

                {/* Subcategory - only show for accessories */}
                {formData.category && formData.category.toLowerCase() === 'accessories' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subcategory</label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select Subcategory (Optional)</option>
                      {subcategories.accessories?.map(subcategory => (
                        <option key={subcategory.id} value={subcategory.name}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image *</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl text-sm transition-colors"
                    >
                      📱 Upload Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl text-sm transition-colors"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tags</label>
                  {formData.category && (
                    <TagSelector
                      selectedTags={formData.tags}
                      onTagChange={(tagType, tags) => {
                        setFormData({
                          ...formData,
                          tags: { ...formData.tags, [tagType]: tags }
                        });
                      }}
                      category={formData.category}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 dark:from-neutral-700 dark:to-neutral-600 dark:hover:from-neutral-600 dark:hover:to-neutral-500 text-white dark:text-pink-400 py-3 px-4 rounded-xl font-medium transition-all duration-200"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditForm && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Edit Item</h2>
              <form onSubmit={handleUpdateItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => {
                      console.log('Edit Item - Category selected:', e.target.value);
                      setEditingItem({ ...editingItem, category: e.target.value, subcategory: '' });
                      if (e.target.value.toLowerCase() === 'accessories') {
                        console.log('Edit Item - Accessories selected, fetching subcategories');
                        fetchSubcategories('accessories');
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
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

                {/* Subcategory - only show for accessories */}
                {editingItem.category && editingItem.category.toLowerCase() === 'accessories' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subcategory</label>
                    <select
                      value={editingItem.subcategory || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, subcategory: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select Subcategory (Optional)</option>
                      {subcategories.accessories?.map(subcategory => (
                        <option key={subcategory.id} value={subcategory.name}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image *</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl text-sm transition-colors"
                    >
                      📱 Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl text-sm transition-colors"
                    >
                      📷 Take New Photo
                    </button>
                  </div>
                  {editingItem.image && (
                    <div className="mt-3">
                      {renderFullImage(
                        editingItem.image,
                        "Current Image",
                        "w-full h-32 rounded-xl border"
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tags</label>
                  {editingItem.category && (
                    <TagSelector
                      selectedTags={editingItem.tags}
                      onTagChange={(tagType, tags) => {
                        setEditingItem({
                          ...editingItem,
                          tags: { ...editingItem.tags, [tagType]: tags }
                        });
                      }}
                      category={editingItem.category}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={editingItem.notes}
                    onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200"
                  >
                    Update Item
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
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Add Category</h2>
              <form onSubmit={handleAddCategory}>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category name"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none mb-4 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 dark:from-neutral-700 dark:to-neutral-600 dark:hover:from-neutral-600 dark:hover:to-neutral-500 text-white dark:text-pink-400 py-3 px-4 rounded-xl font-medium transition-all duration-200"
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
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Add Tag Type</h2>
              <form onSubmit={handleAddTagCategory}>
                <input
                  type="text"
                  value={newTagCategory}
                  onChange={(e) => setNewTagCategory(e.target.value)}
                  placeholder="Tag type (e.g., material, season)"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-300 outline-none mb-4 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTagCategoryForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 dark:from-neutral-700 dark:to-neutral-600 dark:hover:from-neutral-600 dark:hover:to-neutral-500 text-white dark:text-purple-400 py-3 px-4 rounded-xl font-medium transition-all duration-200"
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
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{selectedItem.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditItem(selectedItem)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    ✏️ Edit
                  </button>
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
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-lg mb-2">Inventory Number</h3>
                    <p className="text-3xl font-mono font-bold text-pink-500 dark:text-pink-400">#{selectedItem.inventory_number}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-lg mb-2">Category</h3>
                    <p className="text-xl text-gray-900 dark:text-gray-100">{selectedItem.category}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-lg mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {renderTagBadges(selectedItem.tags)}
                    </div>
                  </div>

                  {selectedItem.notes && (
                    <div>
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-lg mb-2">Notes</h3>
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-neutral-700 p-4 rounded-xl">{selectedItem.notes}</p>
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