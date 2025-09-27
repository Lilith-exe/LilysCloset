#!/usr/bin/env python3
"""
Subcategory Filtering Debug Test
Debug the subcategory filtering issue where items with subcategory="Jewelry" 
show up when clicking "Accessories" but NOT when clicking "Jewelry" under accessories.
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

class SubcategoryDebugTester:
    def __init__(self):
        self.session = requests.Session()
        self.created_items = []
        self.created_categories = []
        self.created_subcategories = []

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

    def check_existing_items(self):
        """Check existing items and show their category and subcategory fields"""
        print("\n📋 STEP 1: Checking existing clothing items...")
        
        try:
            response = self.session.get(f"{API_URL}/clothing-items")
            if response.status_code == 200:
                items = response.json()
                print(f"Found {len(items)} total items in database")
                
                # Show all items with their category and subcategory
                print("\n📊 All items with category and subcategory:")
                print("-" * 80)
                print(f"{'ID':<40} {'Name':<25} {'Category':<15} {'Subcategory':<15}")
                print("-" * 80)
                
                accessories_items = []
                for item in items:
                    item_id = item.get('id', 'N/A')[:8] + "..."  # Truncate ID for display
                    name = item.get('name', 'N/A')[:24]  # Truncate name for display
                    category = item.get('category', 'N/A')
                    subcategory = item.get('subcategory', 'None')
                    
                    print(f"{item_id:<40} {name:<25} {category:<15} {subcategory:<15}")
                    
                    # Collect accessories items for detailed analysis
                    if category == "accessories":
                        accessories_items.append(item)
                
                print("-" * 80)
                
                # Focus on accessories items
                if accessories_items:
                    print(f"\n🎯 Found {len(accessories_items)} items with category='accessories':")
                    print("-" * 100)
                    print(f"{'Full ID':<40} {'Name':<30} {'Subcategory':<20} {'Notes'}")
                    print("-" * 100)
                    
                    for item in accessories_items:
                        full_id = item.get('id', 'N/A')
                        name = item.get('name', 'N/A')[:29]
                        subcategory = item.get('subcategory', 'None')
                        notes = item.get('notes', '')[:30] + "..." if len(item.get('notes', '')) > 30 else item.get('notes', '')
                        
                        print(f"{full_id:<40} {name:<30} {subcategory:<20} {notes}")
                    
                    print("-" * 100)
                    
                    # Show subcategory breakdown
                    subcategory_counts = {}
                    for item in accessories_items:
                        subcat = item.get('subcategory', 'None')
                        subcategory_counts[subcat] = subcategory_counts.get(subcat, 0) + 1
                    
                    print(f"\n📈 Subcategory breakdown for accessories:")
                    for subcat, count in subcategory_counts.items():
                        print(f"  - {subcat}: {count} items")
                        
                    # Specifically look for Jewelry items
                    jewelry_items = [item for item in accessories_items if item.get('subcategory') == 'Jewelry']
                    if jewelry_items:
                        print(f"\n💎 Found {len(jewelry_items)} items with subcategory='Jewelry':")
                        for item in jewelry_items:
                            print(f"  - ID: {item.get('id')}")
                            print(f"    Name: {item.get('name')}")
                            print(f"    Category: {item.get('category')}")
                            print(f"    Subcategory: {item.get('subcategory')}")
                            print(f"    Notes: {item.get('notes', 'No notes')}")
                            print()
                    else:
                        print(f"\n⚠️ No items found with subcategory='Jewelry'")
                        
                else:
                    print(f"\n⚠️ No items found with category='accessories'")
                    
                return items
                
            else:
                print(f"❌ Failed to get clothing items: {response.status_code}")
                print(f"Response: {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ Error checking existing items: {e}")
            return []

    def create_debug_test_item(self):
        """Create a test item with specific requirements"""
        print("\n🧪 STEP 2: Creating debug test item...")
        
        # First ensure accessories category exists
        accessories_category = {"name": "accessories"}
        try:
            response = self.session.post(f"{API_URL}/categories", json=accessories_category)
            if response.status_code == 200:
                created_category = response.json()
                self.created_categories.append(created_category["id"])
                print("✅ Created accessories category")
            elif response.status_code == 400:
                print("✅ Accessories category already exists")
            else:
                print(f"⚠️ Unexpected response creating accessories category: {response.status_code}")
        except Exception as e:
            print(f"⚠️ Error ensuring accessories category: {e}")

        # Ensure Jewelry subcategory exists
        jewelry_subcategory = {"name": "Jewelry", "parent_category": "accessories"}
        try:
            response = self.session.post(f"{API_URL}/subcategories", json=jewelry_subcategory)
            if response.status_code == 200:
                created_subcategory = response.json()
                self.created_subcategories.append(created_subcategory["id"])
                print("✅ Created Jewelry subcategory")
            elif response.status_code == 400:
                print("✅ Jewelry subcategory already exists")
            else:
                print(f"⚠️ Unexpected response creating Jewelry subcategory: {response.status_code}")
        except Exception as e:
            print(f"⚠️ Error ensuring Jewelry subcategory: {e}")

        # Create the debug test item
        debug_test_item = {
            "name": "Debug Test Jewelry",
            "category": "accessories",
            "subcategory": "Jewelry",
            "image": SAMPLE_BASE64_IMAGE,
            "tags": {
                "color": ["gold", "shiny"],
                "theme": ["elegant", "formal"],
                "features": ["adjustable", "hypoallergenic"]
            },
            "notes": "Debug test item created to test subcategory filtering"
        }
        
        try:
            response = self.session.post(f"{API_URL}/clothing-items", json=debug_test_item)
            if response.status_code == 200:
                created_item = response.json()
                self.created_items.append(created_item["id"])
                
                print("✅ Successfully created debug test item")
                print(f"   ID: {created_item['id']}")
                print(f"   Name: {created_item['name']}")
                print(f"   Category: {created_item['category']}")
                print(f"   Subcategory: {created_item['subcategory']}")
                print(f"   Inventory Number: {created_item.get('inventory_number', 'N/A')}")
                
                # Verify the exact values stored
                print(f"\n🔍 Exact field values stored:")
                print(f"   category field: '{created_item['category']}' (type: {type(created_item['category'])})")
                print(f"   subcategory field: '{created_item['subcategory']}' (type: {type(created_item['subcategory'])})")
                
                return created_item
                
            else:
                print(f"❌ Failed to create debug test item: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error creating debug test item: {e}")
            return None

    def retrieve_and_verify_item(self, created_item):
        """Retrieve all items and show the exact subcategory value that was stored"""
        print("\n🔍 STEP 3: Retrieving all items to verify storage...")
        
        try:
            response = self.session.get(f"{API_URL}/clothing-items")
            if response.status_code == 200:
                all_items = response.json()
                
                # Find our debug test item
                debug_item = None
                for item in all_items:
                    if item.get('name') == 'Debug Test Jewelry':
                        debug_item = item
                        break
                
                if debug_item:
                    print("✅ Found debug test item in database")
                    print(f"   Retrieved ID: {debug_item['id']}")
                    print(f"   Retrieved Name: {debug_item['name']}")
                    print(f"   Retrieved Category: '{debug_item['category']}'")
                    print(f"   Retrieved Subcategory: '{debug_item['subcategory']}'")
                    
                    # Check for any whitespace or encoding issues
                    category_bytes = debug_item['category'].encode('utf-8')
                    subcategory_bytes = debug_item['subcategory'].encode('utf-8')
                    
                    print(f"\n🔬 Detailed field analysis:")
                    print(f"   Category bytes: {category_bytes}")
                    print(f"   Category length: {len(debug_item['category'])}")
                    print(f"   Subcategory bytes: {subcategory_bytes}")
                    print(f"   Subcategory length: {len(debug_item['subcategory'])}")
                    
                    # Check if values match exactly what we sent
                    category_match = debug_item['category'] == 'accessories'
                    subcategory_match = debug_item['subcategory'] == 'Jewelry'
                    
                    print(f"\n✅ Field matching verification:")
                    print(f"   Category matches 'accessories': {category_match}")
                    print(f"   Subcategory matches 'Jewelry': {subcategory_match}")
                    
                    if not category_match:
                        print(f"   ⚠️ Category mismatch! Expected 'accessories', got '{debug_item['category']}'")
                    if not subcategory_match:
                        print(f"   ⚠️ Subcategory mismatch! Expected 'Jewelry', got '{debug_item['subcategory']}'")
                    
                    return debug_item
                else:
                    print("❌ Debug test item not found in retrieved items")
                    print("Available items:")
                    for item in all_items:
                        print(f"   - {item.get('name', 'N/A')} (category: {item.get('category', 'N/A')}, subcategory: {item.get('subcategory', 'N/A')})")
                    return None
                    
            else:
                print(f"❌ Failed to retrieve items: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error retrieving items: {e}")
            return None

    def test_database_filtering_logic(self):
        """Test filtering logic at the database level"""
        print("\n🗄️ STEP 4: Testing database-level filtering logic...")
        
        try:
            # Get all items first
            response = self.session.get(f"{API_URL}/clothing-items")
            if response.status_code != 200:
                print(f"❌ Failed to get all items: {response.status_code}")
                return
            
            all_items = response.json()
            print(f"Total items in database: {len(all_items)}")
            
            # Filter 1: Items where category="accessories"
            accessories_items = [item for item in all_items if item.get('category') == 'accessories']
            print(f"\n🔍 Filter 1 - Items with category='accessories': {len(accessories_items)} items")
            
            if accessories_items:
                print("   Accessories items found:")
                for item in accessories_items:
                    print(f"   - {item.get('name', 'N/A')} (subcategory: '{item.get('subcategory', 'None')}')")
            else:
                print("   No accessories items found")
            
            # Filter 2: Items where category="accessories" AND subcategory="Jewelry"
            jewelry_items = [item for item in all_items 
                           if item.get('category') == 'accessories' and item.get('subcategory') == 'Jewelry']
            print(f"\n🔍 Filter 2 - Items with category='accessories' AND subcategory='Jewelry': {len(jewelry_items)} items")
            
            if jewelry_items:
                print("   Jewelry items found:")
                for item in jewelry_items:
                    print(f"   - ID: {item.get('id')}")
                    print(f"     Name: {item.get('name', 'N/A')}")
                    print(f"     Category: '{item.get('category', 'N/A')}'")
                    print(f"     Subcategory: '{item.get('subcategory', 'N/A')}'")
                    print()
            else:
                print("   ❌ No jewelry items found!")
                print("   This indicates the filtering issue!")
                
                # Debug: Check for case sensitivity or other issues
                print("\n🔬 Debugging subcategory values:")
                for item in accessories_items:
                    subcat = item.get('subcategory', 'None')
                    print(f"   - Item '{item.get('name')}' has subcategory: '{subcat}' (exact match with 'Jewelry': {subcat == 'Jewelry'})")
            
            # Filter 3: Case-insensitive test
            jewelry_items_case_insensitive = [item for item in all_items 
                                            if item.get('category', '').lower() == 'accessories' and 
                                               item.get('subcategory', '').lower() == 'jewelry']
            print(f"\n🔍 Filter 3 - Case-insensitive test: {len(jewelry_items_case_insensitive)} items")
            
            # Filter 4: Check for partial matches or whitespace issues
            print(f"\n🔍 Filter 4 - Debugging potential issues:")
            for item in accessories_items:
                subcat = item.get('subcategory', '')
                print(f"   - Item: '{item.get('name')}'")
                print(f"     Subcategory: '{subcat}'")
                print(f"     Contains 'Jewelry': {'Jewelry' in subcat}")
                print(f"     Starts with 'Jewelry': {subcat.startswith('Jewelry')}")
                print(f"     Ends with 'Jewelry': {subcat.endswith('Jewelry')}")
                print(f"     Stripped equals 'Jewelry': {subcat.strip() == 'Jewelry'}")
                print()
            
            return {
                'total_items': len(all_items),
                'accessories_items': len(accessories_items),
                'jewelry_items': len(jewelry_items),
                'jewelry_items_case_insensitive': len(jewelry_items_case_insensitive)
            }
            
        except Exception as e:
            print(f"❌ Error testing database filtering: {e}")
            return None

    def test_subcategory_api_endpoints(self):
        """Test subcategory-related API endpoints"""
        print("\n🔌 STEP 5: Testing subcategory API endpoints...")
        
        try:
            # Test 1: Get accessories subcategories
            response = self.session.get(f"{API_URL}/subcategories/accessories")
            if response.status_code == 200:
                subcategories = response.json()
                print(f"✅ GET /api/subcategories/accessories returned {len(subcategories)} subcategories")
                
                print("   Available subcategories:")
                for subcat in subcategories:
                    print(f"   - ID: {subcat.get('id')}")
                    print(f"     Name: '{subcat.get('name')}'")
                    print(f"     Parent Category: '{subcat.get('parent_category')}'")
                    print()
                
                # Check if Jewelry subcategory exists
                jewelry_subcat = next((sub for sub in subcategories if sub.get('name') == 'Jewelry'), None)
                if jewelry_subcat:
                    print("✅ Jewelry subcategory found in API response")
                    print(f"   Jewelry subcategory ID: {jewelry_subcat.get('id')}")
                else:
                    print("❌ Jewelry subcategory NOT found in API response")
                    
            else:
                print(f"❌ Failed to get subcategories: {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing subcategory endpoints: {e}")

    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created clothing items
        for item_id in self.created_items:
            try:
                response = self.session.delete(f"{API_URL}/clothing-items/{item_id}")
                if response.status_code == 200:
                    print(f"✅ Deleted test item: {item_id}")
                else:
                    print(f"⚠️ Failed to delete item {item_id}: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Error deleting item {item_id}: {e}")
        
        # Delete created subcategories
        for subcategory_id in self.created_subcategories:
            try:
                response = self.session.delete(f"{API_URL}/subcategories/{subcategory_id}")
                if response.status_code == 200:
                    print(f"✅ Deleted test subcategory: {subcategory_id}")
                else:
                    print(f"⚠️ Failed to delete subcategory {subcategory_id}: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Error deleting subcategory {subcategory_id}: {e}")
        
        # Delete created categories
        for category_id in self.created_categories:
            try:
                response = self.session.delete(f"{API_URL}/categories/{category_id}")
                if response.status_code == 200:
                    print(f"✅ Deleted test category: {category_id}")
                else:
                    print(f"⚠️ Failed to delete category {category_id}: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Error deleting category {category_id}: {e}")

    def run_debug_tests(self):
        """Run all debug tests"""
        print("🚀 Starting Subcategory Filtering Debug Tests")
        print(f"🔗 API URL: {API_URL}")
        print("="*80)
        
        if not self.test_api_health():
            print("❌ API health check failed. Aborting tests.")
            return False
        
        try:
            # Step 1: Check existing items
            existing_items = self.check_existing_items()
            
            # Step 2: Create debug test item
            created_item = self.create_debug_test_item()
            
            # Step 3: Retrieve and verify the item
            if created_item:
                verified_item = self.retrieve_and_verify_item(created_item)
            
            # Step 4: Test database filtering logic
            filter_results = self.test_database_filtering_logic()
            
            # Step 5: Test subcategory API endpoints
            self.test_subcategory_api_endpoints()
            
            # Summary
            print("\n" + "="*80)
            print("📊 DEBUG TEST SUMMARY")
            print("="*80)
            
            if filter_results:
                print(f"Total items in database: {filter_results['total_items']}")
                print(f"Items with category='accessories': {filter_results['accessories_items']}")
                print(f"Items with category='accessories' AND subcategory='Jewelry': {filter_results['jewelry_items']}")
                print(f"Items with case-insensitive jewelry filter: {filter_results['jewelry_items_case_insensitive']}")
                
                if filter_results['accessories_items'] > 0 and filter_results['jewelry_items'] == 0:
                    print("\n🚨 ISSUE IDENTIFIED:")
                    print("   - Accessories items exist in database")
                    print("   - BUT no items found with subcategory='Jewelry'")
                    print("   - This confirms the subcategory filtering issue!")
                    print("   - Check for case sensitivity, whitespace, or data storage issues")
                elif filter_results['jewelry_items'] > 0:
                    print("\n✅ FILTERING APPEARS TO WORK:")
                    print("   - Items found with both category='accessories' and subcategory='Jewelry'")
                    print("   - The issue might be in the frontend filtering logic, not backend")
                else:
                    print("\n⚠️ NO ACCESSORIES ITEMS FOUND:")
                    print("   - No items with category='accessories' in database")
                    print("   - Need to create test data first")
            
            print("="*80)
            return True
            
        except Exception as e:
            print(f"❌ Error during debug tests: {e}")
            return False
            
        finally:
            self.cleanup()

if __name__ == "__main__":
    tester = SubcategoryDebugTester()
    success = tester.run_debug_tests()
    
    if success:
        print("\n🎉 Debug tests completed!")
    else:
        print("\n💥 Debug tests failed!")