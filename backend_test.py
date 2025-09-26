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
            "statistics_api": {"passed": 0, "failed": 0, "details": []}
        }
        self.created_tag_categories = []

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