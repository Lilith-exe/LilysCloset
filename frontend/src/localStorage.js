// localStorage.js - Data management for Lily's Closet
import { v4 as uuidv4 } from 'uuid';

// Default data that gets loaded on first app launch
const DEFAULT_DATA = {
  categories: [
    {
      id: uuidv4(),
      name: 'Dresses',
      custom_icon: null,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Tops', 
      custom_icon: null,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Bottoms',
      custom_icon: null,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Accessories',
      custom_icon: null,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Shoes',
      custom_icon: null,
      created_at: new Date().toISOString()
    }
  ],
  
  subcategories: [
    { id: uuidv4(), name: 'Jewelry', parent_category: 'accessories', custom_icon: null },
    { id: uuidv4(), name: 'Bags', parent_category: 'accessories', custom_icon: null },
    { id: uuidv4(), name: 'Belts', parent_category: 'accessories', custom_icon: null },
    { id: uuidv4(), name: 'Hats', parent_category: 'accessories', custom_icon: null },
    { id: uuidv4(), name: 'Chokers', parent_category: 'accessories', custom_icon: null },
    { id: uuidv4(), name: 'Harnesses', parent_category: 'accessories', custom_icon: null }
  ],
  
  tagCategories: [
    { id: uuidv4(), name: 'color', categories: [] },
    { id: uuidv4(), name: 'theme', categories: [] },
    { id: uuidv4(), name: 'features', categories: [] },
    { id: uuidv4(), name: 'material', categories: [] },
    { id: uuidv4(), name: 'season', categories: [] }
  ],
  
  tags: [
    // Color tags
    { id: uuidv4(), name: 'black', tag_type: 'color', categories: [] },
    { id: uuidv4(), name: 'white', tag_type: 'color', categories: [] },
    { id: uuidv4(), name: 'pink', tag_type: 'color', categories: [] },
    { id: uuidv4(), name: 'blue', tag_type: 'color', categories: [] },
    { id: uuidv4(), name: 'red', tag_type: 'color', categories: [] },
    
    // Theme tags
    { id: uuidv4(), name: 'casual', tag_type: 'theme', categories: [] },
    { id: uuidv4(), name: 'formal', tag_type: 'theme', categories: [] },
    { id: uuidv4(), name: 'party', tag_type: 'theme', categories: [] },
    
    // Feature tags  
    { id: uuidv4(), name: 'sleeveless', tag_type: 'features', categories: [] },
    { id: uuidv4(), name: 'long sleeve', tag_type: 'features', categories: [] },
    { id: uuidv4(), name: 'cropped', tag_type: 'features', categories: [] },
    
    // Material tags
    { id: uuidv4(), name: 'cotton', tag_type: 'material', categories: [] },
    { id: uuidv4(), name: 'silk', tag_type: 'material', categories: [] },
    { id: uuidv4(), name: 'denim', tag_type: 'material', categories: [] },
    
    // Season tags
    { id: uuidv4(), name: 'summer', tag_type: 'season', categories: [] },
    { id: uuidv4(), name: 'winter', tag_type: 'season', categories: [] },
    { id: uuidv4(), name: 'spring', tag_type: 'season', categories: [] }
  ],
  
  clothingItems: [
    // Sample items to demonstrate functionality
    {
      id: uuidv4(),
      inventory_number: 1,
      name: 'Elegant Black Dress',
      category: 'Dresses',
      subcategory: '',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RWxlZ2FudCBCbGFjayBEcmVzczwvdGV4dD4KPC9zdmc+',
      tags: {
        color: ['black'],
        theme: ['formal'],
        material: ['silk']
      },
      notes: 'Perfect for special occasions'
    },
    {
      id: uuidv4(),
      inventory_number: 2,
      name: 'Diamond Earrings',
      category: 'Accessories',
      subcategory: 'Jewelry',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZjlmOSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5EaWFtb25kIEVhcnJpbmdzPC90ZXh0Pgo8L3N2Zz4=',
      tags: {
        color: ['white'],
        theme: ['formal'],
        material: ['diamond']
      },
      notes: 'Sparkling diamond earrings'
    }
  ],
  
  inventoryCounter: 3, // Next inventory number
  appVersion: '1.0.0',
  lastUpdated: new Date().toISOString()
};

// Storage keys
const STORAGE_KEYS = {
  CATEGORIES: 'lilysCloset_categories',
  SUBCATEGORIES: 'lilysCloset_subcategories', 
  TAG_CATEGORIES: 'lilysCloset_tagCategories',
  TAGS: 'lilysCloset_tags',
  CLOTHING_ITEMS: 'lilysCloset_clothingItems',
  INVENTORY_COUNTER: 'lilysCloset_inventoryCounter',
  APP_INITIALIZED: 'lilysCloset_appInitialized',
  LAST_UPDATED: 'lilysCloset_lastUpdated'
};

// Initialize app with default data on first launch
export const initializeApp = () => {
  const isInitialized = localStorage.getItem(STORAGE_KEYS.APP_INITIALIZED);
  
  if (!isInitialized) {
    console.log('First app launch - loading default data');
    
    // Load default data
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_DATA.categories));
    localStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(DEFAULT_DATA.subcategories));
    localStorage.setItem(STORAGE_KEYS.TAG_CATEGORIES, JSON.stringify(DEFAULT_DATA.tagCategories));
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(DEFAULT_DATA.tags));
    localStorage.setItem(STORAGE_KEYS.CLOTHING_ITEMS, JSON.stringify(DEFAULT_DATA.clothingItems));
    localStorage.setItem(STORAGE_KEYS.INVENTORY_COUNTER, DEFAULT_DATA.inventoryCounter.toString());
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, DEFAULT_DATA.lastUpdated);
    localStorage.setItem(STORAGE_KEYS.APP_INITIALIZED, 'true');
    
    console.log('Default data loaded successfully');
  }
};

// Categories API
export const categoriesAPI = {
  getAll: () => {
    const categories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return Promise.resolve(JSON.parse(categories || '[]'));
  },
  
  create: (categoryData) => {
    const categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
    const newCategory = {
      id: uuidv4(),
      ...categoryData,
      created_at: new Date().toISOString()
    };
    categories.push(newCategory);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return Promise.resolve(newCategory);
  },
  
  update: (categoryId, updateData) => {
    const categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex !== -1) {
      categories[categoryIndex] = { ...categories[categoryIndex], ...updateData };
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      return Promise.resolve(categories[categoryIndex]);
    }
    return Promise.reject(new Error('Category not found'));
  },
  
  delete: (categoryId) => {
    const categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
    const filteredCategories = categories.filter(cat => cat.id !== categoryId);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filteredCategories));
    return Promise.resolve({ message: 'Category deleted successfully' });
  }
};

// Clothing Items API
export const clothingItemsAPI = {
  getAll: () => {
    const items = localStorage.getItem(STORAGE_KEYS.CLOTHING_ITEMS);
    return Promise.resolve(JSON.parse(items || '[]'));
  },
  
  create: (itemData) => {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLOTHING_ITEMS) || '[]');
    const counter = parseInt(localStorage.getItem(STORAGE_KEYS.INVENTORY_COUNTER) || '1');
    
    const newItem = {
      id: uuidv4(),
      inventory_number: counter,
      ...itemData,
      created_at: new Date().toISOString()
    };
    
    items.push(newItem);
    localStorage.setItem(STORAGE_KEYS.CLOTHING_ITEMS, JSON.stringify(items));
    localStorage.setItem(STORAGE_KEYS.INVENTORY_COUNTER, (counter + 1).toString());
    return Promise.resolve(newItem);
  },
  
  update: (itemId, updateData) => {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLOTHING_ITEMS) || '[]');
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      items[itemIndex] = { ...items[itemIndex], ...updateData };
      localStorage.setItem(STORAGE_KEYS.CLOTHING_ITEMS, JSON.stringify(items));
      return Promise.resolve(items[itemIndex]);
    }
    return Promise.reject(new Error('Item not found'));
  },
  
  delete: (itemId) => {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLOTHING_ITEMS) || '[]');
    const filteredItems = items.filter(item => item.id !== itemId);
    localStorage.setItem(STORAGE_KEYS.CLOTHING_ITEMS, JSON.stringify(filteredItems));
    return Promise.resolve({ message: 'Item deleted successfully' });
  }
};

// Subcategories API  
export const subcategoriesAPI = {
  getByCategory: (categoryName) => {
    const subcategories = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBCATEGORIES) || '[]');
    const filtered = subcategories.filter(sub => sub.parent_category.toLowerCase() === categoryName.toLowerCase());
    return Promise.resolve(filtered);
  },
  
  create: (subcategoryData) => {
    const subcategories = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBCATEGORIES) || '[]');
    const newSubcategory = {
      id: uuidv4(),
      ...subcategoryData,
      created_at: new Date().toISOString()
    };
    subcategories.push(newSubcategory);
    localStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(subcategories));
    return Promise.resolve(newSubcategory);
  },
  
  update: (subcategoryId, updateData) => {
    const subcategories = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBCATEGORIES) || '[]');
    const subcategoryIndex = subcategories.findIndex(sub => sub.id === subcategoryId);
    if (subcategoryIndex !== -1) {
      subcategories[subcategoryIndex] = { ...subcategories[subcategoryIndex], ...updateData };
      localStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(subcategories));
      return Promise.resolve(subcategories[subcategoryIndex]);
    }
    return Promise.reject(new Error('Subcategory not found'));
  },
  
  delete: (subcategoryId) => {
    const subcategories = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBCATEGORIES) || '[]');
    const filteredSubcategories = subcategories.filter(sub => sub.id !== subcategoryId);
    localStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(filteredSubcategories));
    return Promise.resolve({ message: 'Subcategory deleted successfully' });
  }
};

// Tags API
export const tagsAPI = {
  getAll: () => {
    const tags = localStorage.getItem(STORAGE_KEYS.TAGS);
    return Promise.resolve(JSON.parse(tags || '[]'));
  },
  
  create: (tagData) => {
    const tags = JSON.parse(localStorage.getItem(STORAGE_KEYS.TAGS) || '[]');
    const newTag = {
      id: uuidv4(),
      ...tagData,
      created_at: new Date().toISOString()
    };
    tags.push(newTag);
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
    return Promise.resolve(newTag);
  },
  
  delete: (tagId) => {
    const tags = JSON.parse(localStorage.getItem(STORAGE_KEYS.TAGS) || '[]');
    const filteredTags = tags.filter(tag => tag.id !== tagId);
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(filteredTags));
    return Promise.resolve({ message: 'Tag deleted successfully' });
  }
};

// Tag Categories API
export const tagCategoriesAPI = {
  getAll: () => {
    const tagCategories = localStorage.getItem(STORAGE_KEYS.TAG_CATEGORIES);
    return Promise.resolve(JSON.parse(tagCategories || '[]'));
  },
  
  create: (tagCategoryData) => {
    const tagCategories = JSON.parse(localStorage.getItem(STORAGE_KEYS.TAG_CATEGORIES) || '[]');
    const newTagCategory = {
      id: uuidv4(),
      ...tagCategoryData,
      created_at: new Date().toISOString()
    };
    tagCategories.push(newTagCategory);
    localStorage.setItem(STORAGE_KEYS.TAG_CATEGORIES, JSON.stringify(tagCategories));
    return Promise.resolve(newTagCategory);
  },
  
  delete: (tagCategoryId) => {
    const tagCategories = JSON.parse(localStorage.getItem(STORAGE_KEYS.TAG_CATEGORIES) || '[]');
    const filteredTagCategories = tagCategories.filter(tc => tc.id !== tagCategoryId);
    localStorage.setItem(STORAGE_KEYS.TAG_CATEGORIES, JSON.stringify(filteredTagCategories));
    return Promise.resolve({ message: 'Tag category deleted successfully' });
  }
};

// Statistics API
export const statisticsAPI = {
  get: () => {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLOTHING_ITEMS) || '[]');
    const tags = JSON.parse(localStorage.getItem(STORAGE_KEYS.TAGS) || '[]');
    
    // Calculate category statistics
    const categories = {};
    items.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });
    
    // Calculate tag statistics  
    const tagStats = {};
    tags.forEach(tag => {
      if (!tagStats[tag.tag_type]) {
        tagStats[tag.tag_type] = {};
      }
      
      let count = 0;
      items.forEach(item => {
        if (item.tags && item.tags[tag.tag_type] && item.tags[tag.tag_type].includes(tag.name)) {
          count++;
        }
      });
      
      if (count > 0) {
        tagStats[tag.tag_type][tag.name] = count;
      }
    });
    
    return Promise.resolve({
      totalItems: items.length,
      categories,
      tags: tagStats
    });
  }
};

// Data export/import for backup functionality
export const backupAPI = {
  exportData: () => {
    const data = {
      categories: JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]'),
      subcategories: JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBCATEGORIES) || '[]'), 
      tagCategories: JSON.parse(localStorage.getItem(STORAGE_KEYS.TAG_CATEGORIES) || '[]'),
      tags: JSON.parse(localStorage.getItem(STORAGE_KEYS.TAGS) || '[]'),
      clothingItems: JSON.parse(localStorage.getItem(STORAGE_KEYS.CLOTHING_ITEMS) || '[]'),
      inventoryCounter: parseInt(localStorage.getItem(STORAGE_KEYS.INVENTORY_COUNTER) || '1'),
      exportDate: new Date().toISOString()
    };
    return Promise.resolve(data);
  },
  
  importData: (data) => {
    try {
      if (data.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
      if (data.subcategories) localStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(data.subcategories));
      if (data.tagCategories) localStorage.setItem(STORAGE_KEYS.TAG_CATEGORIES, JSON.stringify(data.tagCategories));
      if (data.tags) localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(data.tags));
      if (data.clothingItems) localStorage.setItem(STORAGE_KEYS.CLOTHING_ITEMS, JSON.stringify(data.clothingItems));
      if (data.inventoryCounter) localStorage.setItem(STORAGE_KEYS.INVENTORY_COUNTER, data.inventoryCounter.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
      
      return Promise.resolve({ message: 'Data imported successfully' });
    } catch (error) {
      return Promise.reject(new Error('Import failed: ' + error.message));
    }
  }
};

// ============= REMOTE SYNC SYSTEM =============

const SYNC_CONFIG = {
  // Change this to your GitHub repository raw URL
  MASTER_CATALOG_URL: 'https://raw.githubusercontent.com/Lilith-exe/LilysCloset/refs/heads/main/catalog.json',
  VERSION_KEY: 'lilysCloset_catalogVersion',
  LAST_SYNC_KEY: 'lilysCloset_lastSync'
};

// Sync API for remote catalog management
export const syncAPI = {
  // Check if a newer catalog version is available
  checkForUpdates: async () => {
    try {
      const response = await fetch(SYNC_CONFIG.MASTER_CATALOG_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const remoteCatalog = await response.json();
      const localVersion = localStorage.getItem(SYNC_CONFIG.VERSION_KEY) || '0';
      const remoteVersion = remoteCatalog.version || '1';
      
      return {
        hasUpdate: remoteVersion > localVersion,
        remoteVersion,
        localVersion,
        catalog: remoteCatalog
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return { 
        hasUpdate: false, 
        error: error.message,
        remoteVersion: null,
        localVersion: localStorage.getItem(SYNC_CONFIG.VERSION_KEY) || '0'
      };
    }
  },

  // Download and apply remote catalog
  syncCatalog: async () => {
    try {
      const updateCheck = await syncAPI.checkForUpdates();
      
      if (updateCheck.error) {
        throw new Error(updateCheck.error);
      }

      if (!updateCheck.hasUpdate) {
        return { 
          success: true, 
          message: 'Already up to date',
          updated: false,
          version: updateCheck.localVersion
        };
      }

      const catalog = updateCheck.catalog;

      // Replace all catalog data (clothing items, categories, tags, etc.)
      if (catalog.clothingItems) {
        localStorage.setItem(STORAGE_KEYS.CLOTHING_ITEMS, JSON.stringify(catalog.clothingItems));
      }
      
      if (catalog.categories) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(catalog.categories));
      }
      
      if (catalog.tags) {
        localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(catalog.tags));
      }
      
      if (catalog.tagCategories) {
        localStorage.setItem(STORAGE_KEYS.TAG_CATEGORIES, JSON.stringify(catalog.tagCategories));
      }
      
      if (catalog.subcategories) {
        localStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(catalog.subcategories));
      }
      
      if (catalog.inventoryCounter) {
        localStorage.setItem(STORAGE_KEYS.INVENTORY_COUNTER, catalog.inventoryCounter.toString());
      }

      // Update version and sync timestamp
      localStorage.setItem(SYNC_CONFIG.VERSION_KEY, updateCheck.remoteVersion);
      localStorage.setItem(SYNC_CONFIG.LAST_SYNC_KEY, new Date().toISOString());

      return { 
        success: true, 
        message: `Updated to version ${updateCheck.remoteVersion}`,
        updated: true,
        version: updateCheck.remoteVersion,
        itemCount: catalog.clothingItems?.length || 0
      };

    } catch (error) {
      console.error('Error syncing catalog:', error);
      return { 
        success: false, 
        message: error.message,
        updated: false
      };
    }
  },

  // Export current local data for creating master catalog
  exportCatalog: () => {
    try {
      const currentVersion = parseInt(localStorage.getItem(SYNC_CONFIG.VERSION_KEY) || '1') + 1;
      
      const catalog = {
        version: currentVersion.toString(),
        createdAt: new Date().toISOString(),
        clothingItems: JSON.parse(localStorage.getItem(STORAGE_KEYS.CLOTHING_ITEMS) || '[]'),
        categories: JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]'),
        tags: JSON.parse(localStorage.getItem(STORAGE_KEYS.TAGS) || '[]'),
        tagCategories: JSON.parse(localStorage.getItem(STORAGE_KEYS.TAG_CATEGORIES) || '[]'),
        subcategories: JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBCATEGORIES) || '[]'),
        inventoryCounter: parseInt(localStorage.getItem(STORAGE_KEYS.INVENTORY_COUNTER) || '1')
      };

      return {
        success: true,
        catalog,
        json: JSON.stringify(catalog, null, 2)
      };
    } catch (error) {
      console.error('Error exporting catalog:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Get sync status information
  getSyncStatus: () => {
    return {
      currentVersion: localStorage.getItem(SYNC_CONFIG.VERSION_KEY) || '0',
      lastSync: localStorage.getItem(SYNC_CONFIG.LAST_SYNC_KEY),
      masterUrl: SYNC_CONFIG.MASTER_CATALOG_URL
    };
  },

  // Update the master catalog URL (for settings)
  updateMasterUrl: (newUrl) => {
    SYNC_CONFIG.MASTER_CATALOG_URL = newUrl;
    return { success: true, message: 'Master catalog URL updated' };
  }
};