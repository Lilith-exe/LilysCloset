#!/usr/bin/env python3
"""
Enhanced Features Testing for Clothing Catalog
Focus on delete functionality and new subcategory/tag management features
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
print(f"🔗 Testing Enhanced Features at: {API_URL}")

# Test data
SAMPLE_BASE64_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

class EnhancedFeaturesTester:
    def __init__(self):
        self.session = requests.Session()
        self.created_items = []
        self.created_categories = []
        self.created_tags = []
        self.created_subcategories = []
        self.test_results = {
            "clothing_deletion": {"passed": 0, "failed": 0, "details": []},
            "tag_management": {"passed": 0, "failed": 0, "details": []},
            "subcategory_management": {"passed": 0, "failed": 0, "details": []},
            "category_deletion": {"passed": 0, "failed": 0, "details": []}
        }

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

    def test_clothing_item_deletion(self):
        """Test DELETE /api/clothing-items/{id}"""
        print("\n🗑️ Testing Clothing Item Deletion...")
        
        # First create an item to delete
        test_item = {
            "name": "Test Blazer for Deletion",
            "category": "Outerwear",
            "image": SAMPLE_BASE64_IMAGE,
            "tags": {
                "color": ["navy", "blue"],
                "theme": ["professional", "formal"],
                "features": ["structured", "button-up"]
            },
            "notes": "Professional blazer for testing deletion"
        }
        
        created_item_id = None
        try:
            response = self.session.post(f"{API_URL}/clothing-items", json=test_item)
            if response.status_code == 200:
                created_item = response.json()
                created_item_id = created_item["id"]
                self.log_result("clothing_deletion", "Create item for deletion test", True)
            else:
                self.log_result("clothing_deletion", "Create item for deletion test", False, f"Status: {response.status_code}")
                return
        except Exception as e:
            self.log_result("clothing_deletion", "Create item for deletion test", False, str(e))
            return

        # Test 1: Delete the clothing item
        try:
            response = self.session.delete(f"{API_URL}/clothing-items/{created_item_id}")
            if response.status_code == 200:
                response_data = response.json()
                if "message" in response_data and "deleted successfully" in response_data["message"]:
                    self.log_result("clothing_deletion", "Delete clothing item - success response", True)
                else:
                    self.log_result("clothing_deletion", "Delete clothing item - success response", False, f"Unexpected response: {response_data}")
            else:
                self.log_result("clothing_deletion", "Delete clothing item - success response", False, f"Status: {response.status_code}")
                return
        except Exception as e:
            self.log_result("clothing_deletion", "Delete clothing item - success response", False, str(e))
            return

        # Test 2: Verify item is actually deleted (should return 404)
        try:
            response = self.session.get(f"{API_URL}/clothing-items/{created_item_id}")
            if response.status_code == 404:
                self.log_result("clothing_deletion", "Verify item deleted - data cleanup", True)
            else:
                self.log_result("clothing_deletion", "Verify item deleted - data cleanup", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("clothing_deletion", "Verify item deleted - data cleanup", False, str(e))

        # Test 3: Try to delete non-existent item (should return 404)
        try:
            fake_id = "non-existent-id-12345"
            response = self.session.delete(f"{API_URL}/clothing-items/{fake_id}")
            if response.status_code == 404:
                self.log_result("clothing_deletion", "Delete non-existent item - proper error handling", True)
            else:
                self.log_result("clothing_deletion", "Delete non-existent item - proper error handling", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("clothing_deletion", "Delete non-existent item - proper error handling", False, str(e))

    def test_tag_management(self):
        """Test new tag system: POST /api/tags, GET /api/tags, DELETE /api/tags/{id}"""
        print("\n🏷️ Testing Tag Management System...")
        
        # Test 1: Create a new tag with category restrictions
        test_tag = {
            "name": "silk",
            "tag_type": "material",
            "categories": ["Dresses", "Tops"]  # Restrict to specific categories
        }
        
        created_tag_id = None
        try:
            response = self.session.post(f"{API_URL}/tags", json=test_tag)
            if response.status_code == 200:
                created_tag = response.json()
                created_tag_id = created_tag["id"]
                self.created_tags.append(created_tag_id)
                
                # Verify tag data
                if (created_tag["name"] == test_tag["name"] and 
                    created_tag["tag_type"] == test_tag["tag_type"] and
                    created_tag["categories"] == test_tag["categories"]):
                    self.log_result("tag_management", "Create tag with category restrictions", True)
                else:
                    self.log_result("tag_management", "Create tag with category restrictions", False, "Tag data mismatch")
            else:
                self.log_result("tag_management", "Create tag with category restrictions", False, f"Status: {response.status_code}, Response: {response.text}")
                return
        except Exception as e:
            self.log_result("tag_management", "Create tag with category restrictions", False, str(e))
            return

        # Test 2: Create another tag for testing
        test_tag2 = {
            "name": "vintage",
            "tag_type": "style",
            "categories": []  # Global tag (no category restriction)
        }
        
        try:
            response = self.session.post(f"{API_URL}/tags", json=test_tag2)
            if response.status_code == 200:
                created_tag2 = response.json()
                self.created_tags.append(created_tag2["id"])
                self.log_result("tag_management", "Create global tag (no category restriction)", True)
            else:
                self.log_result("tag_management", "Create global tag (no category restriction)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("tag_management", "Create global tag (no category restriction)", False, str(e))

        # Test 3: Get all tags
        try:
            response = self.session.get(f"{API_URL}/tags")
            if response.status_code == 200:
                tags = response.json()
                if isinstance(tags, list) and len(tags) > 0:
                    # Check if our created tags are in the list
                    tag_ids = [tag["id"] for tag in tags]
                    if created_tag_id in tag_ids:
                        self.log_result("tag_management", "List all tags", True)
                    else:
                        self.log_result("tag_management", "List all tags", False, "Created tag not found in list")
                else:
                    self.log_result("tag_management", "List all tags", False, "No tags returned or invalid format")
            else:
                self.log_result("tag_management", "List all tags", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("tag_management", "List all tags", False, str(e))

        # Test 4: Get tags by type
        try:
            response = self.session.get(f"{API_URL}/tags/material")
            if response.status_code == 200:
                material_tags = response.json()
                if isinstance(material_tags, list):
                    # Check if our silk tag is in the material tags
                    silk_found = any(tag["name"] == "silk" for tag in material_tags)
                    if silk_found:
                        self.log_result("tag_management", "Get tags by type (material)", True)
                    else:
                        self.log_result("tag_management", "Get tags by type (material)", False, "Silk tag not found in material tags")
                else:
                    self.log_result("tag_management", "Get tags by type (material)", False, "Invalid response format")
            else:
                self.log_result("tag_management", "Get tags by type (material)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("tag_management", "Get tags by type (material)", False, str(e))

        # Test 5: Get tags by type with category filter
        try:
            response = self.session.get(f"{API_URL}/tags/material?category=Dresses")
            if response.status_code == 200:
                filtered_tags = response.json()
                if isinstance(filtered_tags, list):
                    # Should include our silk tag since it's available for Dresses category
                    silk_found = any(tag["name"] == "silk" for tag in filtered_tags)
                    if silk_found:
                        self.log_result("tag_management", "Get tags by type with category filter", True)
                    else:
                        self.log_result("tag_management", "Get tags by type with category filter", False, "Silk tag not found for Dresses category")
                else:
                    self.log_result("tag_management", "Get tags by type with category filter", False, "Invalid response format")
            else:
                self.log_result("tag_management", "Get tags by type with category filter", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("tag_management", "Get tags by type with category filter", False, str(e))

        # Test 6: Prevent duplicate tags
        try:
            response = self.session.post(f"{API_URL}/tags", json=test_tag)  # Try to create same tag again
            if response.status_code == 400:
                self.log_result("tag_management", "Prevent duplicate tags", True)
            else:
                self.log_result("tag_management", "Prevent duplicate tags", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_result("tag_management", "Prevent duplicate tags", False, str(e))

        # Test 7: Delete a tag
        if self.created_tags:
            tag_to_delete = self.created_tags[0]
            try:
                response = self.session.delete(f"{API_URL}/tags/{tag_to_delete}")
                if response.status_code == 200:
                    response_data = response.json()
                    if "message" in response_data and "deleted successfully" in response_data["message"]:
                        self.log_result("tag_management", "Delete tag", True)
                        self.created_tags.remove(tag_to_delete)  # Remove from cleanup list
                    else:
                        self.log_result("tag_management", "Delete tag", False, f"Unexpected response: {response_data}")
                else:
                    self.log_result("tag_management", "Delete tag", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("tag_management", "Delete tag", False, str(e))

        # Test 8: Try to delete non-existent tag
        try:
            fake_tag_id = "non-existent-tag-12345"
            response = self.session.delete(f"{API_URL}/tags/{fake_tag_id}")
            if response.status_code == 404:
                self.log_result("tag_management", "Delete non-existent tag - proper error handling", True)
            else:
                self.log_result("tag_management", "Delete non-existent tag - proper error handling", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("tag_management", "Delete non-existent tag - proper error handling", False, str(e))

    def test_subcategory_management(self):
        """Test subcategory management: POST /api/subcategories, GET /api/subcategories/accessories, DELETE /api/subcategories/{id}"""
        print("\n📁 Testing Subcategory Management...")
        
        # Test 1: Create accessories subcategories
        accessories_subcategories = [
            {"name": "Jewelry", "parent_category": "Accessories"},
            {"name": "Bags", "parent_category": "Accessories"},
            {"name": "Scarves", "parent_category": "Accessories"},
            {"name": "Belts", "parent_category": "Accessories"}
        ]
        
        created_subcategory_ids = []
        for subcategory in accessories_subcategories:
            try:
                response = self.session.post(f"{API_URL}/subcategories", json=subcategory)
                if response.status_code == 200:
                    created_subcategory = response.json()
                    created_subcategory_ids.append(created_subcategory["id"])
                    self.created_subcategories.append(created_subcategory["id"])
                    
                    # Verify subcategory data
                    if (created_subcategory["name"] == subcategory["name"] and 
                        created_subcategory["parent_category"] == subcategory["parent_category"]):
                        self.log_result("subcategory_management", f"Create {subcategory['name']} subcategory", True)
                    else:
                        self.log_result("subcategory_management", f"Create {subcategory['name']} subcategory", False, "Subcategory data mismatch")
                else:
                    self.log_result("subcategory_management", f"Create {subcategory['name']} subcategory", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("subcategory_management", f"Create {subcategory['name']} subcategory", False, str(e))

        # Test 2: Get subcategories for accessories
        try:
            response = self.session.get(f"{API_URL}/subcategories/Accessories")
            if response.status_code == 200:
                subcategories = response.json()
                if isinstance(subcategories, list) and len(subcategories) > 0:
                    # Check if our created subcategories are in the list
                    subcategory_names = [sub["name"] for sub in subcategories]
                    expected_names = ["Jewelry", "Bags", "Scarves", "Belts"]
                    found_names = [name for name in expected_names if name in subcategory_names]
                    
                    if len(found_names) == len(expected_names):
                        self.log_result("subcategory_management", "List accessories subcategories", True)
                    else:
                        self.log_result("subcategory_management", "List accessories subcategories", False, f"Missing subcategories. Found: {found_names}, Expected: {expected_names}")
                else:
                    self.log_result("subcategory_management", "List accessories subcategories", False, "No subcategories returned or invalid format")
            else:
                self.log_result("subcategory_management", "List accessories subcategories", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("subcategory_management", "List accessories subcategories", False, str(e))

        # Test 3: Prevent duplicate subcategories
        try:
            duplicate_subcategory = {"name": "Jewelry", "parent_category": "Accessories"}
            response = self.session.post(f"{API_URL}/subcategories", json=duplicate_subcategory)
            if response.status_code == 400:
                self.log_result("subcategory_management", "Prevent duplicate subcategories", True)
            else:
                self.log_result("subcategory_management", "Prevent duplicate subcategories", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_result("subcategory_management", "Prevent duplicate subcategories", False, str(e))

        # Test 4: Create subcategory for different parent category
        try:
            different_parent = {"name": "Casual Shirts", "parent_category": "Tops"}
            response = self.session.post(f"{API_URL}/subcategories", json=different_parent)
            if response.status_code == 200:
                created_subcategory = response.json()
                self.created_subcategories.append(created_subcategory["id"])
                self.log_result("subcategory_management", "Create subcategory for different parent", True)
            else:
                self.log_result("subcategory_management", "Create subcategory for different parent", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("subcategory_management", "Create subcategory for different parent", False, str(e))

        # Test 5: Get subcategories for different parent category
        try:
            response = self.session.get(f"{API_URL}/subcategories/Tops")
            if response.status_code == 200:
                tops_subcategories = response.json()
                if isinstance(tops_subcategories, list):
                    # Should find our "Casual Shirts" subcategory
                    casual_shirts_found = any(sub["name"] == "Casual Shirts" for sub in tops_subcategories)
                    if casual_shirts_found:
                        self.log_result("subcategory_management", "List subcategories for different parent", True)
                    else:
                        self.log_result("subcategory_management", "List subcategories for different parent", False, "Casual Shirts not found in Tops subcategories")
                else:
                    self.log_result("subcategory_management", "List subcategories for different parent", False, "Invalid response format")
            else:
                self.log_result("subcategory_management", "List subcategories for different parent", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("subcategory_management", "List subcategories for different parent", False, str(e))

        # Test 6: Delete a subcategory
        if self.created_subcategories:
            subcategory_to_delete = self.created_subcategories[0]
            try:
                response = self.session.delete(f"{API_URL}/subcategories/{subcategory_to_delete}")
                if response.status_code == 200:
                    response_data = response.json()
                    if "message" in response_data and "deleted successfully" in response_data["message"]:
                        self.log_result("subcategory_management", "Delete subcategory", True)
                        self.created_subcategories.remove(subcategory_to_delete)  # Remove from cleanup list
                    else:
                        self.log_result("subcategory_management", "Delete subcategory", False, f"Unexpected response: {response_data}")
                else:
                    self.log_result("subcategory_management", "Delete subcategory", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("subcategory_management", "Delete subcategory", False, str(e))

        # Test 7: Try to delete non-existent subcategory
        try:
            fake_subcategory_id = "non-existent-subcategory-12345"
            response = self.session.delete(f"{API_URL}/subcategories/{fake_subcategory_id}")
            if response.status_code == 404:
                self.log_result("subcategory_management", "Delete non-existent subcategory - proper error handling", True)
            else:
                self.log_result("subcategory_management", "Delete non-existent subcategory - proper error handling", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("subcategory_management", "Delete non-existent subcategory - proper error handling", False, str(e))

    def test_category_deletion(self):
        """Test DELETE /api/categories/{id}"""
        print("\n🗑️ Testing Category Deletion...")
        
        # First create a category to delete
        test_category = {"name": "Test Category for Deletion"}
        
        created_category_id = None
        try:
            response = self.session.post(f"{API_URL}/categories", json=test_category)
            if response.status_code == 200:
                created_category = response.json()
                created_category_id = created_category["id"]
                self.log_result("category_deletion", "Create category for deletion test", True)
            else:
                self.log_result("category_deletion", "Create category for deletion test", False, f"Status: {response.status_code}")
                return
        except Exception as e:
            self.log_result("category_deletion", "Create category for deletion test", False, str(e))
            return

        # Test 1: Delete the category
        try:
            response = self.session.delete(f"{API_URL}/categories/{created_category_id}")
            if response.status_code == 200:
                response_data = response.json()
                if "message" in response_data and "deleted successfully" in response_data["message"]:
                    self.log_result("category_deletion", "Delete category - success response", True)
                else:
                    self.log_result("category_deletion", "Delete category - success response", False, f"Unexpected response: {response_data}")
            else:
                self.log_result("category_deletion", "Delete category - success response", False, f"Status: {response.status_code}")
                return
        except Exception as e:
            self.log_result("category_deletion", "Delete category - success response", False, str(e))
            return

        # Test 2: Verify category is actually deleted (should not appear in list)
        try:
            response = self.session.get(f"{API_URL}/categories")
            if response.status_code == 200:
                categories = response.json()
                if isinstance(categories, list):
                    category_ids = [cat["id"] for cat in categories]
                    if created_category_id not in category_ids:
                        self.log_result("category_deletion", "Verify category deleted - data cleanup", True)
                    else:
                        self.log_result("category_deletion", "Verify category deleted - data cleanup", False, "Category still exists in list")
                else:
                    self.log_result("category_deletion", "Verify category deleted - data cleanup", False, "Invalid response format")
            else:
                self.log_result("category_deletion", "Verify category deleted - data cleanup", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("category_deletion", "Verify category deleted - data cleanup", False, str(e))

        # Test 3: Try to delete non-existent category (should return 404)
        try:
            fake_id = "non-existent-category-12345"
            response = self.session.delete(f"{API_URL}/categories/{fake_id}")
            if response.status_code == 404:
                self.log_result("category_deletion", "Delete non-existent category - proper error handling", True)
            else:
                self.log_result("category_deletion", "Delete non-existent category - proper error handling", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("category_deletion", "Delete non-existent category - proper error handling", False, str(e))

    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created tags
        for tag_id in self.created_tags:
            try:
                response = self.session.delete(f"{API_URL}/tags/{tag_id}")
                if response.status_code == 200:
                    print(f"✅ Deleted tag: {tag_id}")
                else:
                    print(f"⚠️ Failed to delete tag {tag_id}: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Error deleting tag {tag_id}: {e}")
        
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
        print("📊 ENHANCED FEATURES TEST SUMMARY")
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
        """Run all enhanced feature tests"""
        print("🚀 Starting Enhanced Features Testing")
        print(f"🔗 API URL: {API_URL}")
        
        if not self.test_api_health():
            print("❌ API health check failed. Aborting tests.")
            return False
        
        try:
            self.test_clothing_item_deletion()
            self.test_tag_management()
            self.test_subcategory_management()
            self.test_category_deletion()
            
            success = self.print_summary()
            return success
            
        finally:
            self.cleanup()

if __name__ == "__main__":
    tester = EnhancedFeaturesTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All enhanced features tests passed!")
        sys.exit(0)
    else:
        print("\n💥 Some enhanced features tests failed!")
        sys.exit(1)