#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Clothing Catalog
Tests all CRUD operations, category management, tagging system, and search functionality
"""

import requests
import json
import base64
import sys
from typing import Dict, List, Any

# Get backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("❌ Could not get backend URL from frontend/.env")
    sys.exit(1)

API_URL = f"{BASE_URL}/api"
print(f"🔗 Testing API at: {API_URL}")

# Test data
SAMPLE_BASE64_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

class ClothingCatalogTester:
    def __init__(self):
        self.session = requests.Session()
        self.created_items = []
        self.created_categories = []
        self.test_results = {
            "clothing_crud": {"passed": 0, "failed": 0, "details": []},
            "category_management": {"passed": 0, "failed": 0, "details": []},
            "tagging_system": {"passed": 0, "failed": 0, "details": []},
            "search_filter": {"passed": 0, "failed": 0, "details": []},
            "custom_tag_categories": {"passed": 0, "failed": 0, "details": []},
            "enhanced_search": {"passed": 0, "failed": 0, "details": []},
            "statistics_api": {"passed": 0, "failed": 0, "details": []},
            "subcategory_management": {"passed": 0, "failed": 0, "details": []},
            "accessories_subcategory": {"passed": 0, "failed": 0, "details": []},
            "custom_icon_upload": {"passed": 0, "failed": 0, "details": []}
        }
        self.created_tag_categories = []
        self.created_subcategories = []

    def log_result(self, category: str, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        if passed:
            self.test_results[category]["passed"] += 1
            print(f"✅ {test_name}")
        else:
            self.test_results[category]["failed"] += 1
            print(f"❌ {test_name}: {details}")
        
        self.test_results[category]["details"].append({
            "test": test_name,
            "passed": passed,
            "details": details
        })

    def test_api_health(self):
        """Test if API is accessible"""
        print("\n🔍 Testing API Health...")
        try:
            response = self.session.get(f"{API_URL}/")
            if response.status_code == 200:
                print("✅ API is accessible")
                return True
            else:
                print(f"❌ API health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API connection failed: {e}")
            return False

    def test_clothing_crud(self):
        """Test Clothing Item CRUD operations"""
        print("\n🧥 Testing Clothing Item CRUD API...")
        
        # Test 1: Create clothing item
        test_item = {
            "name": "Blue Denim Jacket",
            "category": "Outerwear",
            "image": SAMPLE_BASE64_IMAGE,
            "tags": {
                "color": ["blue", "indigo"],
                "theme": ["casual", "vintage"],
                "features": ["pockets", "button-up"]
            },
            "notes": "Comfortable denim jacket perfect for casual outings"
        }
        
        try:
            response = self.session.post(f"{API_URL}/clothing-items", json=test_item)
            if response.status_code == 200:
                created_item = response.json()
                self.created_items.append(created_item["id"])
                
                # Verify auto-incrementing inventory number
                if "inventory_number" in created_item and created_item["inventory_number"] >= 1:
                    self.log_result("clothing_crud", "Create clothing item with auto-increment inventory", True)
                else:
                    self.log_result("clothing_crud", "Create clothing item with auto-increment inventory", False, "Missing or invalid inventory_number")
                
                # Verify all fields are saved
                fields_correct = all([
                    created_item["name"] == test_item["name"],
                    created_item["category"] == test_item["category"],
                    created_item["image"] == test_item["image"],
                    created_item["tags"] == test_item["tags"],
                    created_item["notes"] == test_item["notes"]
                ])
                
                if fields_correct:
                    self.log_result("clothing_crud", "All fields saved correctly", True)
                else:
                    self.log_result("clothing_crud", "All fields saved correctly", False, "Field mismatch in created item")
                    
            else:
                self.log_result("clothing_crud", "Create clothing item", False, f"Status: {response.status_code}, Response: {response.text}")
                return
                
        except Exception as e:
            self.log_result("clothing_crud", "Create clothing item", False, str(e))
            return

        # Test 2: Get all clothing items
        try:
            response = self.session.get(f"{API_URL}/clothing-items")
            if response.status_code == 200:
                items = response.json()
                if isinstance(items, list) and len(items) > 0:
                    self.log_result("clothing_crud", "Get all clothing items", True)
                else:
                    self.log_result("clothing_crud", "Get all clothing items", False, "No items returned or invalid format")
            else:
                self.log_result("clothing_crud", "Get all clothing items", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("clothing_crud", "Get all clothing items", False, str(e))

        # Test 3: Get individual item by ID
        if self.created_items:
            item_id = self.created_items[0]
            try:
                response = self.session.get(f"{API_URL}/clothing-items/{item_id}")
                if response.status_code == 200:
                    item = response.json()
                    if item["id"] == item_id:
                        self.log_result("clothing_crud", "Get clothing item by ID", True)
                    else:
                        self.log_result("clothing_crud", "Get clothing item by ID", False, "ID mismatch")
                else:
                    self.log_result("clothing_crud", "Get clothing item by ID", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("clothing_crud", "Get clothing item by ID", False, str(e))

        # Test 4: Update clothing item
        if self.created_items:
            item_id = self.created_items[0]
            update_data = {
                "name": "Updated Blue Denim Jacket",
                "notes": "Updated notes for the jacket"
            }
            
            try:
                response = self.session.put(f"{API_URL}/clothing-items/{item_id}", json=update_data)
                if response.status_code == 200:
                    updated_item = response.json()
                    if updated_item["name"] == update_data["name"] and updated_item["notes"] == update_data["notes"]:
                        self.log_result("clothing_crud", "Update clothing item", True)
                    else:
                        self.log_result("clothing_crud", "Update clothing item", False, "Update not reflected")
                else:
                    self.log_result("clothing_crud", "Update clothing item", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("clothing_crud", "Update clothing item", False, str(e))

        # Test 5: Create second item to test inventory numbering
        test_item2 = {
            "name": "Red Cotton T-Shirt",
            "category": "Tops",
            "image": SAMPLE_BASE64_IMAGE,
            "tags": {
                "color": ["red"],
                "theme": ["casual"],
                "features": ["short-sleeve"]
            },
            "notes": "Basic red t-shirt"
        }
        
        try:
            response = self.session.post(f"{API_URL}/clothing-items", json=test_item2)
            if response.status_code == 200:
                created_item2 = response.json()
                self.created_items.append(created_item2["id"])
                
                # Verify inventory number incremented
                if created_item2["inventory_number"] == 2:
                    self.log_result("clothing_crud", "Auto-increment inventory number sequence", True)
                else:
                    self.log_result("clothing_crud", "Auto-increment inventory number sequence", False, f"Expected inventory_number 2, got {created_item2['inventory_number']}")
            else:
                self.log_result("clothing_crud", "Create second item for inventory test", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("clothing_crud", "Create second item for inventory test", False, str(e))

    def test_category_management(self):
        """Test Category Management API"""
        print("\n📂 Testing Category Management API...")
        
        # Test 1: Create category
        test_category = {"name": "Formal Wear"}
        
        try:
            response = self.session.post(f"{API_URL}/categories", json=test_category)
            if response.status_code == 200:
                created_category = response.json()
                self.created_categories.append(created_category["id"])
                
                if created_category["name"] == test_category["name"]:
                    self.log_result("category_management", "Create category", True)
                else:
                    self.log_result("category_management", "Create category", False, "Name mismatch")
            else:
                self.log_result("category_management", "Create category", False, f"Status: {response.status_code}, Response: {response.text}")
                return
        except Exception as e:
            self.log_result("category_management", "Create category", False, str(e))
            return

        # Test 2: Prevent duplicate categories
        try:
            response = self.session.post(f"{API_URL}/categories", json=test_category)
            if response.status_code == 400:
                self.log_result("category_management", "Prevent duplicate categories", True)
            else:
                self.log_result("category_management", "Prevent duplicate categories", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_result("category_management", "Prevent duplicate categories", False, str(e))

        # Test 3: List all categories
        try:
            response = self.session.get(f"{API_URL}/categories")
            if response.status_code == 200:
                categories = response.json()
                if isinstance(categories, list) and len(categories) > 0:
                    self.log_result("category_management", "List all categories", True)
                else:
                    self.log_result("category_management", "List all categories", False, "No categories returned")
            else:
                self.log_result("category_management", "List all categories", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("category_management", "List all categories", False, str(e))

        # Test 4: Create another category for deletion test
        test_category2 = {"name": "Sports Wear"}
        try:
            response = self.session.post(f"{API_URL}/categories", json=test_category2)
            if response.status_code == 200:
                created_category2 = response.json()
                category_id_to_delete = created_category2["id"]
                
                # Test 5: Delete category
                response = self.session.delete(f"{API_URL}/categories/{category_id_to_delete}")
                if response.status_code == 200:
                    self.log_result("category_management", "Delete category", True)
                else:
                    self.log_result("category_management", "Delete category", False, f"Status: {response.status_code}")
            else:
                self.log_result("category_management", "Create category for deletion test", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("category_management", "Delete category", False, str(e))

    def test_tagging_system(self):
        """Test Tagging System functionality"""
        print("\n🏷️ Testing Tagging System API...")
        
        # Test 1: Create item with complex tag structure
        complex_tags_item = {
            "name": "Designer Evening Dress",
            "category": "Formal Wear",
            "image": SAMPLE_BASE64_IMAGE,
            "tags": {
                "color": ["black", "gold", "elegant"],
                "theme": ["formal", "evening", "party"],
                "features": ["sleeveless", "floor-length", "sequins", "backless"]
            },
            "notes": "Elegant evening dress with gold sequin details"
        }
        
        try:
            response = self.session.post(f"{API_URL}/clothing-items", json=complex_tags_item)
            if response.status_code == 200:
                created_item = response.json()
                self.created_items.append(created_item["id"])
                
                # Verify tag structure preservation
                tags_match = (
                    created_item["tags"]["color"] == complex_tags_item["tags"]["color"] and
                    created_item["tags"]["theme"] == complex_tags_item["tags"]["theme"] and
                    created_item["tags"]["features"] == complex_tags_item["tags"]["features"]
                )
                
                if tags_match:
                    self.log_result("tagging_system", "Complex tag structure storage", True)
                else:
                    self.log_result("tagging_system", "Complex tag structure storage", False, "Tag structure mismatch")
                    
                # Verify all tag types are supported
                tag_types_present = all(tag_type in created_item["tags"] for tag_type in ["color", "theme", "features"])
                if tag_types_present:
                    self.log_result("tagging_system", "All tag types supported (Color, Theme, Features)", True)
                else:
                    self.log_result("tagging_system", "All tag types supported (Color, Theme, Features)", False, "Missing tag types")
                    
            else:
                self.log_result("tagging_system", "Create item with complex tags", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("tagging_system", "Create item with complex tags", False, str(e))

        # Test 2: Update tags
        if self.created_items:
            item_id = self.created_items[-1]  # Use the last created item
            updated_tags = {
                "tags": {
                    "color": ["black", "silver"],
                    "theme": ["formal", "cocktail"],
                    "features": ["sleeveless", "knee-length", "beaded"]
                }
            }
            
            try:
                response = self.session.put(f"{API_URL}/clothing-items/{item_id}", json=updated_tags)
                if response.status_code == 200:
                    updated_item = response.json()
                    if updated_item["tags"] == updated_tags["tags"]:
                        self.log_result("tagging_system", "Update tag structure", True)
                    else:
                        self.log_result("tagging_system", "Update tag structure", False, "Tags not updated correctly")
                else:
                    self.log_result("tagging_system", "Update tag structure", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("tagging_system", "Update tag structure", False, str(e))

    def test_search_and_filter(self):
        """Test Search and Filter API"""
        print("\n🔍 Testing Search and Filter API...")
        
        # Test 1: Search by inventory number (exact match)
        try:
            response = self.session.get(f"{API_URL}/clothing-items/search/1")
            if response.status_code == 200:
                results = response.json()
                if isinstance(results, list) and len(results) > 0:
                    # Check if the result has inventory_number 1
                    if results[0]["inventory_number"] == 1:
                        self.log_result("search_filter", "Search by inventory number (exact match)", True)
                    else:
                        self.log_result("search_filter", "Search by inventory number (exact match)", False, "Wrong inventory number returned")
                else:
                    self.log_result("search_filter", "Search by inventory number (exact match)", False, "No results returned")
            else:
                self.log_result("search_filter", "Search by inventory number (exact match)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("search_filter", "Search by inventory number (exact match)", False, str(e))

        # Test 2: Search by name (regex)
        try:
            response = self.session.get(f"{API_URL}/clothing-items/search/jacket")
            if response.status_code == 200:
                results = response.json()
                if isinstance(results, list):
                    # Check if any result contains "jacket" in name (case insensitive)
                    jacket_found = any("jacket" in item["name"].lower() for item in results)
                    if jacket_found:
                        self.log_result("search_filter", "Search by name (regex)", True)
                    else:
                        self.log_result("search_filter", "Search by name (regex)", False, "No jacket found in results")
                else:
                    self.log_result("search_filter", "Search by name (regex)", False, "Invalid response format")
            else:
                self.log_result("search_filter", "Search by name (regex)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("search_filter", "Search by name (regex)", False, str(e))

        # Test 3: Search by category (regex)
        try:
            response = self.session.get(f"{API_URL}/clothing-items/search/outerwear")
            if response.status_code == 200:
                results = response.json()
                if isinstance(results, list):
                    # Check if any result has "outerwear" category (case insensitive)
                    category_found = any("outerwear" in item["category"].lower() for item in results)
                    if category_found:
                        self.log_result("search_filter", "Search by category (regex)", True)
                    else:
                        self.log_result("search_filter", "Search by category (regex)", False, "No outerwear category found")
                else:
                    self.log_result("search_filter", "Search by category (regex)", False, "Invalid response format")
            else:
                self.log_result("search_filter", "Search by category (regex)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("search_filter", "Search by category (regex)", False, str(e))

        # Test 4: Search by tag values
        try:
            response = self.session.get(f"{API_URL}/clothing-items/search/blue")
            if response.status_code == 200:
                results = response.json()
                if isinstance(results, list):
                    # Check if any result has "blue" in tags
                    blue_tag_found = any(
                        any("blue" in tag.lower() for tag_list in item["tags"].values() for tag in tag_list)
                        for item in results if "tags" in item
                    )
                    if blue_tag_found:
                        self.log_result("search_filter", "Search by tag values", True)
                    else:
                        self.log_result("search_filter", "Search by tag values", False, "No blue tag found in results")
                else:
                    self.log_result("search_filter", "Search by tag values", False, "Invalid response format")
            else:
                self.log_result("search_filter", "Search by tag values", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("search_filter", "Search by tag values", False, str(e))

        # Test 5: Search by notes
        try:
            response = self.session.get(f"{API_URL}/clothing-items/search/comfortable")
            if response.status_code == 200:
                results = response.json()
                if isinstance(results, list):
                    # Check if any result has "comfortable" in notes
                    notes_found = any("comfortable" in item.get("notes", "").lower() for item in results)
                    if notes_found:
                        self.log_result("search_filter", "Search by notes (regex)", True)
                    else:
                        self.log_result("search_filter", "Search by notes (regex)", False, "No comfortable notes found")
                else:
                    self.log_result("search_filter", "Search by notes (regex)", False, "Invalid response format")
            else:
                self.log_result("search_filter", "Search by notes (regex)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("search_filter", "Search by notes (regex)", False, str(e))

    def test_custom_tag_categories_api(self):
        """Test Custom Tag Categories API"""
        print("\n🏷️ Testing Custom Tag Categories API...")
        
        # Test 1: Get default tag categories (should auto-create color, theme, features)
        try:
            response = self.session.get(f"{API_URL}/tag-categories")
            if response.status_code == 200:
                tag_categories = response.json()
                if isinstance(tag_categories, list):
                    # Check for default categories
                    category_names = [tc["name"].lower() for tc in tag_categories]
                    defaults_present = all(default in category_names for default in ["color", "theme", "features"])
                    
                    if defaults_present:
                        self.log_result("custom_tag_categories", "Auto-create default tag categories", True)
                    else:
                        self.log_result("custom_tag_categories", "Auto-create default tag categories", False, f"Missing defaults. Found: {category_names}")
                else:
                    self.log_result("custom_tag_categories", "Get tag categories", False, "Invalid response format")
            else:
                self.log_result("custom_tag_categories", "Get tag categories", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("custom_tag_categories", "Get tag categories", False, str(e))

        # Test 2: Create custom tag category
        custom_tag_category = {"name": "material"}
        
        try:
            response = self.session.post(f"{API_URL}/tag-categories", json=custom_tag_category)
            if response.status_code == 200:
                created_tag_category = response.json()
                self.created_tag_categories.append(created_tag_category["id"])
                
                if created_tag_category["name"] == custom_tag_category["name"]:
                    self.log_result("custom_tag_categories", "Create custom tag category (material)", True)
                else:
                    self.log_result("custom_tag_categories", "Create custom tag category (material)", False, "Name mismatch")
            else:
                self.log_result("custom_tag_categories", "Create custom tag category (material)", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("custom_tag_categories", "Create custom tag category (material)", False, str(e))

        # Test 3: Create another custom tag category
        custom_tag_category2 = {"name": "season"}
        
        try:
            response = self.session.post(f"{API_URL}/tag-categories", json=custom_tag_category2)
            if response.status_code == 200:
                created_tag_category2 = response.json()
                self.created_tag_categories.append(created_tag_category2["id"])
                
                if created_tag_category2["name"] == custom_tag_category2["name"]:
                    self.log_result("custom_tag_categories", "Create custom tag category (season)", True)
                else:
                    self.log_result("custom_tag_categories", "Create custom tag category (season)", False, "Name mismatch")
            else:
                self.log_result("custom_tag_categories", "Create custom tag category (season)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("custom_tag_categories", "Create custom tag category (season)", False, str(e))

        # Test 4: Prevent duplicate tag categories
        try:
            response = self.session.post(f"{API_URL}/tag-categories", json=custom_tag_category)
            if response.status_code == 400:
                self.log_result("custom_tag_categories", "Prevent duplicate tag categories", True)
            else:
                self.log_result("custom_tag_categories", "Prevent duplicate tag categories", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_result("custom_tag_categories", "Prevent duplicate tag categories", False, str(e))

        # Test 5: List all tag categories including custom ones
        try:
            response = self.session.get(f"{API_URL}/tag-categories")
            if response.status_code == 200:
                tag_categories = response.json()
                if isinstance(tag_categories, list):
                    category_names = [tc["name"].lower() for tc in tag_categories]
                    # Should have defaults + custom ones
                    expected_categories = ["color", "theme", "features", "material", "season"]
                    all_present = all(cat in category_names for cat in expected_categories)
                    
                    if all_present:
                        self.log_result("custom_tag_categories", "List all tag categories including custom", True)
                    else:
                        self.log_result("custom_tag_categories", "List all tag categories including custom", False, f"Missing categories. Found: {category_names}")
                else:
                    self.log_result("custom_tag_categories", "List all tag categories including custom", False, "Invalid response format")
            else:
                self.log_result("custom_tag_categories", "List all tag categories including custom", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("custom_tag_categories", "List all tag categories including custom", False, str(e))

        # Test 6: Try to delete default tag category (should fail)
        try:
            # Get a default category ID
            response = self.session.get(f"{API_URL}/tag-categories")
            if response.status_code == 200:
                tag_categories = response.json()
                default_category = next((tc for tc in tag_categories if tc["name"].lower() == "color"), None)
                
                if default_category:
                    response = self.session.delete(f"{API_URL}/tag-categories/{default_category['id']}")
                    if response.status_code == 400:
                        self.log_result("custom_tag_categories", "Prevent deletion of default categories", True)
                    else:
                        self.log_result("custom_tag_categories", "Prevent deletion of default categories", False, f"Expected 400, got {response.status_code}")
                else:
                    self.log_result("custom_tag_categories", "Prevent deletion of default categories", False, "Could not find default category")
            else:
                self.log_result("custom_tag_categories", "Prevent deletion of default categories", False, "Could not get tag categories")
        except Exception as e:
            self.log_result("custom_tag_categories", "Prevent deletion of default categories", False, str(e))

        # Test 7: Delete custom tag category (should succeed)
        if self.created_tag_categories:
            try:
                tag_category_id = self.created_tag_categories[0]  # Delete the first one we created
                response = self.session.delete(f"{API_URL}/tag-categories/{tag_category_id}")
                if response.status_code == 200:
                    self.log_result("custom_tag_categories", "Delete custom tag category", True)
                    # Remove from our list so cleanup doesn't try to delete it again
                    self.created_tag_categories.remove(tag_category_id)
                else:
                    self.log_result("custom_tag_categories", "Delete custom tag category", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("custom_tag_categories", "Delete custom tag category", False, str(e))

    def test_enhanced_search_api(self):
        """Test Enhanced Search API with custom tag categories"""
        print("\n🔍 Testing Enhanced Search API...")
        
        # First, create an item with custom tags
        item_with_custom_tags = {
            "name": "Cotton Summer Dress",
            "category": "Dresses",
            "image": SAMPLE_BASE64_IMAGE,
            "tags": {
                "color": ["white", "cream"],
                "theme": ["casual", "summer"],
                "features": ["sleeveless", "midi-length"],
                "material": ["cotton", "breathable"],
                "season": ["summer", "spring"]
            },
            "notes": "Light cotton dress perfect for warm weather"
        }
        
        created_item_id = None
        try:
            response = self.session.post(f"{API_URL}/clothing-items", json=item_with_custom_tags)
            if response.status_code == 200:
                created_item = response.json()
                created_item_id = created_item["id"]
                self.created_items.append(created_item_id)
                self.log_result("enhanced_search", "Create item with custom tags", True)
            else:
                self.log_result("enhanced_search", "Create item with custom tags", False, f"Status: {response.status_code}")
                return
        except Exception as e:
            self.log_result("enhanced_search", "Create item with custom tags", False, str(e))
            return

        # Test 1: Search by custom tag category "material"
        try:
            response = self.session.get(f"{API_URL}/clothing-items/search/cotton")
            if response.status_code == 200:
                results = response.json()
                if isinstance(results, list):
                    # Check if our item with cotton material is found
                    cotton_found = any(
                        item["id"] == created_item_id and 
                        "material" in item.get("tags", {}) and 
                        "cotton" in item["tags"]["material"]
                        for item in results
                    )
                    
                    if cotton_found:
                        self.log_result("enhanced_search", "Search by custom tag (material: cotton)", True)
                    else:
                        self.log_result("enhanced_search", "Search by custom tag (material: cotton)", False, "Cotton material not found in search results")
                else:
                    self.log_result("enhanced_search", "Search by custom tag (material: cotton)", False, "Invalid response format")
            else:
                self.log_result("enhanced_search", "Search by custom tag (material: cotton)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("enhanced_search", "Search by custom tag (material: cotton)", False, str(e))

        # Test 2: Search by custom tag category "season"
        try:
            response = self.session.get(f"{API_URL}/clothing-items/search/summer")
            if response.status_code == 200:
                results = response.json()
                if isinstance(results, list):
                    # Check if our item with summer season is found
                    summer_found = any(
                        item["id"] == created_item_id and 
                        "season" in item.get("tags", {}) and 
                        "summer" in item["tags"]["season"]
                        for item in results
                    )
                    
                    if summer_found:
                        self.log_result("enhanced_search", "Search by custom tag (season: summer)", True)
                    else:
                        self.log_result("enhanced_search", "Search by custom tag (season: summer)", False, "Summer season not found in search results")
                else:
                    self.log_result("enhanced_search", "Search by custom tag (season: summer)", False, "Invalid response format")
            else:
                self.log_result("enhanced_search", "Search by custom tag (season: summer)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("enhanced_search", "Search by custom tag (season: summer)", False, str(e))

        # Test 3: Verify search works across all tag types dynamically
        try:
            response = self.session.get(f"{API_URL}/clothing-items/search/breathable")
            if response.status_code == 200:
                results = response.json()
                if isinstance(results, list):
                    # Check if our item with breathable material is found
                    breathable_found = any(
                        item["id"] == created_item_id and 
                        "material" in item.get("tags", {}) and 
                        "breathable" in item["tags"]["material"]
                        for item in results
                    )
                    
                    if breathable_found:
                        self.log_result("enhanced_search", "Dynamic search across custom tag types", True)
                    else:
                        self.log_result("enhanced_search", "Dynamic search across custom tag types", False, "Breathable material not found in search results")
                else:
                    self.log_result("enhanced_search", "Dynamic search across custom tag types", False, "Invalid response format")
            else:
                self.log_result("enhanced_search", "Dynamic search across custom tag types", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("enhanced_search", "Dynamic search across custom tag types", False, str(e))

    def test_statistics_api(self):
        """Test Statistics API"""
        print("\n📊 Testing Statistics API...")
        
        # First, ensure we have some test data by creating a few items
        test_items = [
            {
                "name": "Blue Jeans",
                "category": "Bottoms",
                "image": SAMPLE_BASE64_IMAGE,
                "tags": {
                    "color": ["blue", "denim"],
                    "theme": ["casual"],
                    "features": ["pockets"],
                    "material": ["denim", "cotton"],
                    "season": ["all-season"]
                },
                "notes": "Classic blue jeans"
            },
            {
                "name": "Red Sweater",
                "category": "Tops",
                "image": SAMPLE_BASE64_IMAGE,
                "tags": {
                    "color": ["red", "burgundy"],
                    "theme": ["casual", "cozy"],
                    "features": ["long-sleeve"],
                    "material": ["wool", "warm"],
                    "season": ["winter", "fall"]
                },
                "notes": "Warm red sweater"
            }
        ]
        
        # Create test items
        stats_test_items = []
        for item in test_items:
            try:
                response = self.session.post(f"{API_URL}/clothing-items", json=item)
                if response.status_code == 200:
                    created_item = response.json()
                    stats_test_items.append(created_item["id"])
                    self.created_items.append(created_item["id"])
            except Exception as e:
                print(f"Warning: Could not create test item for stats: {e}")

        # Test 1: Get statistics endpoint
        try:
            response = self.session.get(f"{API_URL}/stats")
            if response.status_code == 200:
                stats = response.json()
                
                # Verify response structure
                required_fields = ["total_items", "categories", "tags"]
                fields_present = all(field in stats for field in required_fields)
                
                if fields_present:
                    self.log_result("statistics_api", "Statistics endpoint returns correct structure", True)
                else:
                    self.log_result("statistics_api", "Statistics endpoint returns correct structure", False, f"Missing fields. Got: {list(stats.keys())}")
                
                # Test 2: Verify total_items count
                if isinstance(stats.get("total_items"), int) and stats["total_items"] >= 0:
                    self.log_result("statistics_api", "Total items count is valid", True)
                else:
                    self.log_result("statistics_api", "Total items count is valid", False, f"Invalid total_items: {stats.get('total_items')}")
                
                # Test 3: Verify categories breakdown
                categories = stats.get("categories", {})
                if isinstance(categories, dict):
                    # Check if we have some categories with counts
                    has_valid_categories = all(isinstance(count, int) and count > 0 for count in categories.values())
                    if categories and has_valid_categories:
                        self.log_result("statistics_api", "Categories breakdown with item counts", True)
                    else:
                        self.log_result("statistics_api", "Categories breakdown with item counts", False, f"Invalid categories: {categories}")
                else:
                    self.log_result("statistics_api", "Categories breakdown with item counts", False, "Categories is not a dict")
                
                # Test 4: Verify tags breakdown across all tag types
                tags = stats.get("tags", {})
                if isinstance(tags, dict):
                    # Check for default tag types
                    expected_tag_types = ["color", "theme", "features"]
                    default_types_present = any(tag_type in tags for tag_type in expected_tag_types)
                    
                    # Check for custom tag types if they exist
                    custom_types_present = any(tag_type in tags for tag_type in ["material", "season"])
                    
                    if default_types_present:
                        self.log_result("statistics_api", "Tags breakdown includes default tag types", True)
                    else:
                        self.log_result("statistics_api", "Tags breakdown includes default tag types", False, f"Missing default types. Got: {list(tags.keys())}")
                    
                    if custom_types_present:
                        self.log_result("statistics_api", "Tags breakdown includes custom tag types", True)
                    else:
                        self.log_result("statistics_api", "Tags breakdown includes custom tag types", False, f"No custom types found. Got: {list(tags.keys())}")
                    
                    # Verify tag counts structure
                    valid_tag_structure = all(
                        isinstance(tag_values, dict) and 
                        all(isinstance(count, int) and count > 0 for count in tag_values.values())
                        for tag_values in tags.values()
                    )
                    
                    if valid_tag_structure:
                        self.log_result("statistics_api", "Tag counts have valid structure", True)
                    else:
                        self.log_result("statistics_api", "Tag counts have valid structure", False, "Invalid tag count structure")
                        
                else:
                    self.log_result("statistics_api", "Tags breakdown structure", False, "Tags is not a dict")
                    
            else:
                self.log_result("statistics_api", "Statistics endpoint accessibility", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("statistics_api", "Statistics endpoint accessibility", False, str(e))

        # Test 5: Test with various data scenarios (empty database scenario would be tested in isolation)
        # For now, we test with the data we have
        try:
            response = self.session.get(f"{API_URL}/stats")
            if response.status_code == 200:
                stats = response.json()
                
                # Verify that stats reflect our test data
                total_items = stats.get("total_items", 0)
                if total_items >= len(stats_test_items):  # Should be at least our test items
                    self.log_result("statistics_api", "Statistics reflect actual data", True)
                else:
                    self.log_result("statistics_api", "Statistics reflect actual data", False, f"Expected at least {len(stats_test_items)} items, got {total_items}")
            else:
                self.log_result("statistics_api", "Statistics data accuracy test", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("statistics_api", "Statistics data accuracy test", False, str(e))

    def test_accessories_subcategory_functionality(self):
        """Test Accessories Subcategory Functionality comprehensively"""
        print("\n👜 Testing Accessories Subcategory Functionality...")
        
        # First, ensure we have the accessories category
        accessories_category = {"name": "accessories"}
        try:
            response = self.session.post(f"{API_URL}/categories", json=accessories_category)
            if response.status_code == 200:
                created_category = response.json()
                self.created_categories.append(created_category["id"])
            elif response.status_code == 400:
                # Category already exists, which is fine
                pass
        except Exception as e:
            print(f"Warning: Could not ensure accessories category exists: {e}")

        # Test 1: Create accessories subcategories
        accessories_subcategories = [
            {"name": "Jewelry", "parent_category": "accessories"},
            {"name": "Bags", "parent_category": "accessories"},
            {"name": "Scarves", "parent_category": "accessories"},
            {"name": "Belts", "parent_category": "accessories"},
            {"name": "Watches", "parent_category": "accessories"},
            {"name": "Sunglasses", "parent_category": "accessories"}
        ]
        
        created_subcategory_ids = []
        for subcategory in accessories_subcategories:
            try:
                response = self.session.post(f"{API_URL}/subcategories", json=subcategory)
                if response.status_code == 200:
                    created_subcategory = response.json()
                    created_subcategory_ids.append(created_subcategory["id"])
                    self.created_subcategories.append(created_subcategory["id"])
                elif response.status_code == 400:
                    # Subcategory already exists, get its ID
                    get_response = self.session.get(f"{API_URL}/subcategories/accessories")
                    if get_response.status_code == 200:
                        existing_subcategories = get_response.json()
                        existing_subcategory = next((sub for sub in existing_subcategories if sub["name"] == subcategory["name"]), None)
                        if existing_subcategory:
                            created_subcategory_ids.append(existing_subcategory["id"])
            except Exception as e:
                print(f"Warning: Could not create subcategory {subcategory['name']}: {e}")
        
        if len(created_subcategory_ids) >= 6:
            self.log_result("accessories_subcategory", "Create 6 accessories subcategories", True)
        else:
            self.log_result("accessories_subcategory", "Create 6 accessories subcategories", False, f"Only created {len(created_subcategory_ids)} subcategories")

        # Test 2: GET /api/subcategories/accessories (should return 6 subcategories)
        try:
            response = self.session.get(f"{API_URL}/subcategories/accessories")
            if response.status_code == 200:
                subcategories = response.json()
                if isinstance(subcategories, list) and len(subcategories) >= 6:
                    # Verify expected subcategories are present
                    subcategory_names = [sub["name"] for sub in subcategories]
                    expected_names = ["Jewelry", "Bags", "Scarves", "Belts", "Watches", "Sunglasses"]
                    all_present = all(name in subcategory_names for name in expected_names)
                    
                    if all_present:
                        self.log_result("accessories_subcategory", "GET /api/subcategories/accessories returns 6 subcategories", True)
                    else:
                        self.log_result("accessories_subcategory", "GET /api/subcategories/accessories returns 6 subcategories", False, f"Missing subcategories. Found: {subcategory_names}")
                else:
                    self.log_result("accessories_subcategory", "GET /api/subcategories/accessories returns 6 subcategories", False, f"Expected 6+ subcategories, got {len(subcategories) if isinstance(subcategories, list) else 'invalid format'}")
            else:
                self.log_result("accessories_subcategory", "GET /api/subcategories/accessories returns 6 subcategories", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("accessories_subcategory", "GET /api/subcategories/accessories returns 6 subcategories", False, str(e))

        # Test 3: Create clothing item with category="accessories" and subcategory="Jewelry"
        jewelry_item = {
            "name": "Diamond Stud Earrings",
            "category": "accessories",
            "subcategory": "Jewelry",
            "image": SAMPLE_BASE64_IMAGE,
            "tags": {
                "color": ["silver", "clear"],
                "theme": ["elegant", "formal"],
                "features": ["hypoallergenic", "sparkly"]
            },
            "notes": "Beautiful diamond stud earrings perfect for special occasions"
        }
        
        jewelry_item_id = None
        try:
            response = self.session.post(f"{API_URL}/clothing-items", json=jewelry_item)
            if response.status_code == 200:
                created_item = response.json()
                jewelry_item_id = created_item["id"]
                self.created_items.append(jewelry_item_id)
                
                # Verify subcategory is properly stored
                if (created_item["category"] == "accessories" and 
                    created_item["subcategory"] == "Jewelry"):
                    self.log_result("accessories_subcategory", "Create item with category=accessories and subcategory=Jewelry", True)
                else:
                    self.log_result("accessories_subcategory", "Create item with category=accessories and subcategory=Jewelry", False, f"Category: {created_item.get('category')}, Subcategory: {created_item.get('subcategory')}")
            else:
                self.log_result("accessories_subcategory", "Create item with category=accessories and subcategory=Jewelry", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("accessories_subcategory", "Create item with category=accessories and subcategory=Jewelry", False, str(e))

        # Test 4: Create clothing item with category="accessories" and subcategory="Bags"
        bag_item = {
            "name": "Leather Crossbody Bag",
            "category": "accessories",
            "subcategory": "Bags",
            "image": SAMPLE_BASE64_IMAGE,
            "tags": {
                "color": ["brown", "tan"],
                "theme": ["casual", "everyday"],
                "features": ["adjustable-strap", "multiple-compartments"]
            },
            "notes": "Versatile leather crossbody bag for daily use"
        }
        
        bag_item_id = None
        try:
            response = self.session.post(f"{API_URL}/clothing-items", json=bag_item)
            if response.status_code == 200:
                created_item = response.json()
                bag_item_id = created_item["id"]
                self.created_items.append(bag_item_id)
                
                # Verify subcategory is properly stored
                if (created_item["category"] == "accessories" and 
                    created_item["subcategory"] == "Bags"):
                    self.log_result("accessories_subcategory", "Create item with category=accessories and subcategory=Bags", True)
                else:
                    self.log_result("accessories_subcategory", "Create item with category=accessories and subcategory=Bags", False, f"Category: {created_item.get('category')}, Subcategory: {created_item.get('subcategory')}")
            else:
                self.log_result("accessories_subcategory", "Create item with category=accessories and subcategory=Bags", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("accessories_subcategory", "Create item with category=accessories and subcategory=Bags", False, str(e))

        # Test 5: Update an existing item to assign it a subcategory
        if jewelry_item_id:
            update_data = {
                "subcategory": "Watches"  # Change from Jewelry to Watches
            }
            
            try:
                response = self.session.put(f"{API_URL}/clothing-items/{jewelry_item_id}", json=update_data)
                if response.status_code == 200:
                    updated_item = response.json()
                    if updated_item["subcategory"] == "Watches":
                        self.log_result("accessories_subcategory", "Update existing item to assign subcategory", True)
                    else:
                        self.log_result("accessories_subcategory", "Update existing item to assign subcategory", False, f"Expected subcategory 'Watches', got '{updated_item.get('subcategory')}'")
                else:
                    self.log_result("accessories_subcategory", "Update existing item to assign subcategory", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("accessories_subcategory", "Update existing item to assign subcategory", False, str(e))

        # Test 6: Verify subcategory field is properly stored and retrieved
        if bag_item_id:
            try:
                response = self.session.get(f"{API_URL}/clothing-items/{bag_item_id}")
                if response.status_code == 200:
                    retrieved_item = response.json()
                    if (retrieved_item.get("subcategory") == "Bags" and 
                        retrieved_item.get("category") == "accessories"):
                        self.log_result("accessories_subcategory", "Verify subcategory field is properly stored and retrieved", True)
                    else:
                        self.log_result("accessories_subcategory", "Verify subcategory field is properly stored and retrieved", False, f"Category: {retrieved_item.get('category')}, Subcategory: {retrieved_item.get('subcategory')}")
                else:
                    self.log_result("accessories_subcategory", "Verify subcategory field is properly stored and retrieved", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("accessories_subcategory", "Verify subcategory field is properly stored and retrieved", False, str(e))

        # Test 7: Test filtering by subcategory when using category filtering
        # First, get all accessories items
        try:
            response = self.session.get(f"{API_URL}/clothing-items")
            if response.status_code == 200:
                all_items = response.json()
                accessories_items = [item for item in all_items if item.get("category") == "accessories"]
                
                if len(accessories_items) >= 2:  # We created at least 2 accessories items
                    # Check if we can filter by subcategory
                    jewelry_items = [item for item in accessories_items if item.get("subcategory") == "Watches"]  # Updated item should be Watches
                    bag_items = [item for item in accessories_items if item.get("subcategory") == "Bags"]
                    
                    if len(jewelry_items) >= 1 and len(bag_items) >= 1:
                        self.log_result("accessories_subcategory", "Filter items by subcategory within accessories category", True)
                    else:
                        self.log_result("accessories_subcategory", "Filter items by subcategory within accessories category", False, f"Jewelry items: {len(jewelry_items)}, Bag items: {len(bag_items)}")
                else:
                    self.log_result("accessories_subcategory", "Filter items by subcategory within accessories category", False, f"Only found {len(accessories_items)} accessories items")
            else:
                self.log_result("accessories_subcategory", "Filter items by subcategory within accessories category", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("accessories_subcategory", "Filter items by subcategory within accessories category", False, str(e))

        # Test 8: Test search functionality with subcategory items
        try:
            response = self.session.get(f"{API_URL}/clothing-items/search/leather")
            if response.status_code == 200:
                search_results = response.json()
                if isinstance(search_results, list):
                    # Check if our leather bag is found
                    leather_bag_found = any(
                        item.get("id") == bag_item_id and 
                        item.get("subcategory") == "Bags" and
                        "leather" in item.get("name", "").lower()
                        for item in search_results
                    )
                    
                    if leather_bag_found:
                        self.log_result("accessories_subcategory", "Search functionality works with subcategory items", True)
                    else:
                        self.log_result("accessories_subcategory", "Search functionality works with subcategory items", False, "Leather bag with subcategory not found in search results")
                else:
                    self.log_result("accessories_subcategory", "Search functionality works with subcategory items", False, "Invalid search response format")
            else:
                self.log_result("accessories_subcategory", "Search functionality works with subcategory items", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("accessories_subcategory", "Search functionality works with subcategory items", False, str(e))

    def test_custom_icon_upload_functionality(self):
        """Test Custom Icon Upload functionality for Categories and Subcategories"""
        print("\n🎨 Testing Custom Icon Upload Functionality...")
        
        # Sample base64 icon for testing
        SAMPLE_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        
        # First, create a test category for icon upload testing
        test_category = {"name": "Dresses"}
        category_id = None
        
        try:
            response = self.session.post(f"{API_URL}/categories", json=test_category)
            if response.status_code == 200:
                created_category = response.json()
                category_id = created_category["id"]
                self.created_categories.append(category_id)
            elif response.status_code == 400:
                # Category already exists, get its ID
                response = self.session.get(f"{API_URL}/categories")
                if response.status_code == 200:
                    categories = response.json()
                    existing_category = next((cat for cat in categories if cat["name"] == "Dresses"), None)
                    if existing_category:
                        category_id = existing_category["id"]
        except Exception as e:
            print(f"Warning: Could not ensure test category exists: {e}")

        # Test 1: Category Icon Upload - PUT /api/categories/{category_id} with custom_icon
        if category_id:
            try:
                update_data = {"custom_icon": SAMPLE_ICON}
                response = self.session.put(f"{API_URL}/categories/{category_id}", json=update_data)
                
                if response.status_code == 200:
                    updated_category = response.json()
                    if updated_category.get("custom_icon") == SAMPLE_ICON:
                        self.log_result("custom_icon_upload", "Category icon upload with base64 image", True)
                    else:
                        self.log_result("custom_icon_upload", "Category icon upload with base64 image", False, "Custom icon not stored correctly")
                else:
                    self.log_result("custom_icon_upload", "Category icon upload with base64 image", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("custom_icon_upload", "Category icon upload with base64 image", False, str(e))

        # Test 2: Verify Category Icon Retrieval - GET /api/categories should return custom_icon
        if category_id:
            try:
                response = self.session.get(f"{API_URL}/categories")
                if response.status_code == 200:
                    categories = response.json()
                    test_category = next((cat for cat in categories if cat["id"] == category_id), None)
                    
                    if test_category and test_category.get("custom_icon") == SAMPLE_ICON:
                        self.log_result("custom_icon_upload", "Category icon retrieval via GET /api/categories", True)
                    else:
                        self.log_result("custom_icon_upload", "Category icon retrieval via GET /api/categories", False, "Custom icon not returned correctly")
                else:
                    self.log_result("custom_icon_upload", "Category icon retrieval via GET /api/categories", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("custom_icon_upload", "Category icon retrieval via GET /api/categories", False, str(e))

        # Test 3: Category Icon Removal - PUT /api/categories/{category_id} with custom_icon: null
        if category_id:
            try:
                update_data = {"custom_icon": None}
                response = self.session.put(f"{API_URL}/categories/{category_id}", json=update_data)
                
                if response.status_code == 200:
                    updated_category = response.json()
                    if updated_category.get("custom_icon") is None:
                        self.log_result("custom_icon_upload", "Category icon removal (set to null)", True)
                    else:
                        self.log_result("custom_icon_upload", "Category icon removal (set to null)", False, f"Custom icon not removed, got: {updated_category.get('custom_icon')}")
                else:
                    self.log_result("custom_icon_upload", "Category icon removal (set to null)", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("custom_icon_upload", "Category icon removal (set to null)", False, str(e))

        # Test 4: Create a test subcategory for icon upload testing
        subcategory_id = None
        test_subcategory = {"name": "Jewelry", "parent_category": "accessories"}
        
        try:
            response = self.session.post(f"{API_URL}/subcategories", json=test_subcategory)
            if response.status_code == 200:
                created_subcategory = response.json()
                subcategory_id = created_subcategory["id"]
                self.created_subcategories.append(subcategory_id)
            elif response.status_code == 400:
                # Subcategory already exists, get its ID
                response = self.session.get(f"{API_URL}/subcategories/accessories")
                if response.status_code == 200:
                    subcategories = response.json()
                    existing_subcategory = next((sub for sub in subcategories if sub["name"] == "Jewelry"), None)
                    if existing_subcategory:
                        subcategory_id = existing_subcategory["id"]
        except Exception as e:
            print(f"Warning: Could not ensure test subcategory exists: {e}")

        # Test 5: Subcategory Icon Upload - PUT /api/subcategories/{subcategory_id} with custom_icon
        if subcategory_id:
            try:
                update_data = {"custom_icon": SAMPLE_ICON}
                response = self.session.put(f"{API_URL}/subcategories/{subcategory_id}", json=update_data)
                
                if response.status_code == 200:
                    updated_subcategory = response.json()
                    if updated_subcategory.get("custom_icon") == SAMPLE_ICON:
                        self.log_result("custom_icon_upload", "Subcategory icon upload with base64 image", True)
                    else:
                        self.log_result("custom_icon_upload", "Subcategory icon upload with base64 image", False, "Custom icon not stored correctly")
                else:
                    self.log_result("custom_icon_upload", "Subcategory icon upload with base64 image", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("custom_icon_upload", "Subcategory icon upload with base64 image", False, str(e))

        # Test 6: Verify Subcategory Icon Retrieval - GET /api/subcategories/{parent} should return custom_icon
        if subcategory_id:
            try:
                response = self.session.get(f"{API_URL}/subcategories/accessories")
                if response.status_code == 200:
                    subcategories = response.json()
                    test_subcategory = next((sub for sub in subcategories if sub["id"] == subcategory_id), None)
                    
                    if test_subcategory and test_subcategory.get("custom_icon") == SAMPLE_ICON:
                        self.log_result("custom_icon_upload", "Subcategory icon retrieval via GET /api/subcategories", True)
                    else:
                        self.log_result("custom_icon_upload", "Subcategory icon retrieval via GET /api/subcategories", False, "Custom icon not returned correctly")
                else:
                    self.log_result("custom_icon_upload", "Subcategory icon retrieval via GET /api/subcategories", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("custom_icon_upload", "Subcategory icon retrieval via GET /api/subcategories", False, str(e))

        # Test 7: Subcategory Icon Removal - PUT /api/subcategories/{subcategory_id} with custom_icon: null
        if subcategory_id:
            try:
                update_data = {"custom_icon": None}
                response = self.session.put(f"{API_URL}/subcategories/{subcategory_id}", json=update_data)
                
                if response.status_code == 200:
                    updated_subcategory = response.json()
                    if updated_subcategory.get("custom_icon") is None:
                        self.log_result("custom_icon_upload", "Subcategory icon removal (set to null)", True)
                    else:
                        self.log_result("custom_icon_upload", "Subcategory icon removal (set to null)", False, f"Custom icon not removed, got: {updated_subcategory.get('custom_icon')}")
                else:
                    self.log_result("custom_icon_upload", "Subcategory icon removal (set to null)", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("custom_icon_upload", "Subcategory icon removal (set to null)", False, str(e))

        # Test 8: Verify existing functionality still works after icon operations
        if category_id:
            try:
                # Test category creation still works
                test_category_2 = {"name": "Test Category for Icon Validation"}
                response = self.session.post(f"{API_URL}/categories", json=test_category_2)
                
                if response.status_code == 200:
                    created_category_2 = response.json()
                    self.created_categories.append(created_category_2["id"])
                    
                    # Verify new category has null custom_icon by default
                    if created_category_2.get("custom_icon") is None:
                        self.log_result("custom_icon_upload", "New categories have null custom_icon by default", True)
                    else:
                        self.log_result("custom_icon_upload", "New categories have null custom_icon by default", False, f"Expected null, got: {created_category_2.get('custom_icon')}")
                else:
                    self.log_result("custom_icon_upload", "Category creation still works after icon operations", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("custom_icon_upload", "Category creation still works after icon operations", False, str(e))

        # Test 9: Test with invalid category/subcategory IDs
        try:
            invalid_id = "invalid-category-id-12345"
            update_data = {"custom_icon": SAMPLE_ICON}
            response = self.session.put(f"{API_URL}/categories/{invalid_id}", json=update_data)
            
            if response.status_code == 404:
                self.log_result("custom_icon_upload", "Proper 404 error for invalid category ID", True)
            else:
                self.log_result("custom_icon_upload", "Proper 404 error for invalid category ID", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("custom_icon_upload", "Proper 404 error for invalid category ID", False, str(e))

        try:
            invalid_id = "invalid-subcategory-id-12345"
            update_data = {"custom_icon": SAMPLE_ICON}
            response = self.session.put(f"{API_URL}/subcategories/{invalid_id}", json=update_data)
            
            if response.status_code == 404:
                self.log_result("custom_icon_upload", "Proper 404 error for invalid subcategory ID", True)
            else:
                self.log_result("custom_icon_upload", "Proper 404 error for invalid subcategory ID", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("custom_icon_upload", "Proper 404 error for invalid subcategory ID", False, str(e))

    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created clothing items
        for item_id in self.created_items:
            try:
                response = self.session.delete(f"{API_URL}/clothing-items/{item_id}")
                if response.status_code == 200:
                    print(f"✅ Deleted clothing item: {item_id}")
                else:
                    print(f"⚠️ Failed to delete clothing item {item_id}: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Error deleting clothing item {item_id}: {e}")
        
        # Delete created categories
        for category_id in self.created_categories:
            try:
                response = self.session.delete(f"{API_URL}/categories/{category_id}")
                if response.status_code == 200:
                    print(f"✅ Deleted category: {category_id}")
                else:
                    print(f"⚠️ Failed to delete category {category_id}: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Error deleting category {category_id}: {e}")
        
        # Delete created tag categories (except defaults)
        for tag_category_id in self.created_tag_categories:
            try:
                response = self.session.delete(f"{API_URL}/tag-categories/{tag_category_id}")
                if response.status_code == 200:
                    print(f"✅ Deleted tag category: {tag_category_id}")
                else:
                    print(f"⚠️ Failed to delete tag category {tag_category_id}: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Error deleting tag category {tag_category_id}: {e}")
        
        # Delete created subcategories
        for subcategory_id in self.created_subcategories:
            try:
                response = self.session.delete(f"{API_URL}/subcategories/{subcategory_id}")
                if response.status_code == 200:
                    print(f"✅ Deleted subcategory: {subcategory_id}")
                else:
                    print(f"⚠️ Failed to delete subcategory {subcategory_id}: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Error deleting subcategory {subcategory_id}: {e}")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.test_results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            category_name = category.replace("_", " ").title()
            print(f"\n{category_name}:")
            print(f"  ✅ Passed: {passed}")
            print(f"  ❌ Failed: {failed}")
            
            if failed > 0:
                print("  Failed tests:")
                for detail in results["details"]:
                    if not detail["passed"]:
                        print(f"    - {detail['test']}: {detail['details']}")
        
        print(f"\n{'='*60}")
        print(f"OVERALL RESULTS:")
        print(f"✅ Total Passed: {total_passed}")
        print(f"❌ Total Failed: {total_failed}")
        print(f"📈 Success Rate: {(total_passed/(total_passed+total_failed)*100):.1f}%" if (total_passed+total_failed) > 0 else "N/A")
        print("="*60)
        
        return total_failed == 0

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Clothing Catalog Backend API Tests")
        print(f"🔗 API URL: {API_URL}")
        
        if not self.test_api_health():
            print("❌ API health check failed. Aborting tests.")
            return False
        
        try:
            self.test_clothing_crud()
            self.test_category_management()
            self.test_tagging_system()
            self.test_search_and_filter()
            self.test_custom_tag_categories_api()
            self.test_enhanced_search_api()
            self.test_statistics_api()
            self.test_accessories_subcategory_functionality()
            
            success = self.print_summary()
            return success
            
        finally:
            self.cleanup()

if __name__ == "__main__":
    tester = ClothingCatalogTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)