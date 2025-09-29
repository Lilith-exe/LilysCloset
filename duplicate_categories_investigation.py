#!/usr/bin/env python3
"""
Duplicate Accessories Categories Investigation and Fix
Investigates and fixes the duplicate "Accessories" vs "accessories" categories issue
"""

import requests
import json
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
print(f"🔗 Investigating duplicate categories at: {API_URL}")

class DuplicateCategoriesInvestigator:
    def __init__(self):
        self.session = requests.Session()
        self.categories_data = []
        self.items_data = []
        self.duplicate_categories = []
        self.items_to_fix = []

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

    def investigate_categories(self):
        """Step 1: Check all categories in the database"""
        print("\n📂 STEP 1: Investigating Categories in Database...")
        
        try:
            response = self.session.get(f"{API_URL}/categories")
            if response.status_code == 200:
                self.categories_data = response.json()
                print(f"✅ Found {len(self.categories_data)} categories total")
                
                # Look for accessories categories specifically
                accessories_categories = []
                for category in self.categories_data:
                    if 'accessories' in category['name'].lower():
                        accessories_categories.append(category)
                        print(f"🔍 Found accessories category: ID={category['id']}, Name='{category['name']}', Created={category.get('created_at', 'N/A')}")
                
                if len(accessories_categories) > 1:
                    print(f"🚨 DUPLICATE ACCESSORIES CATEGORIES DETECTED: {len(accessories_categories)} found!")
                    self.duplicate_categories = accessories_categories
                    
                    # Identify which is "Accessories" (capital A) and which is "accessories" (lowercase a)
                    for cat in accessories_categories:
                        if cat['name'] == 'Accessories':
                            print(f"   📌 PROPER CATEGORY: '{cat['name']}' (ID: {cat['id']})")
                        elif cat['name'] == 'accessories':
                            print(f"   ⚠️  DUPLICATE CATEGORY: '{cat['name']}' (ID: {cat['id']})")
                        else:
                            print(f"   ❓ OTHER ACCESSORIES VARIANT: '{cat['name']}' (ID: {cat['id']})")
                    
                    return True
                elif len(accessories_categories) == 1:
                    print(f"✅ Only one accessories category found: '{accessories_categories[0]['name']}'")
                    return False
                else:
                    print("❌ No accessories categories found at all!")
                    return False
                    
            else:
                print(f"❌ Failed to get categories: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error investigating categories: {e}")
            return False

    def investigate_items_assignment(self):
        """Step 2: Check which items are assigned to each category"""
        print("\n👕 STEP 2: Investigating Items Assignment...")
        
        try:
            response = self.session.get(f"{API_URL}/clothing-items")
            if response.status_code == 200:
                self.items_data = response.json()
                print(f"✅ Found {len(self.items_data)} clothing items total")
                
                # Count items by category
                category_counts = {}
                accessories_items = []
                
                for item in self.items_data:
                    category = item.get('category', 'Unknown')
                    category_counts[category] = category_counts.get(category, 0) + 1
                    
                    # Check for accessories items (both cases)
                    if 'accessories' in category.lower():
                        accessories_items.append(item)
                        print(f"🔍 Accessories item: ID={item['id']}, Name='{item['name']}', Category='{category}', Subcategory='{item.get('subcategory', 'None')}'")
                
                print(f"\n📊 Category Distribution:")
                for category, count in sorted(category_counts.items()):
                    print(f"   {category}: {count} items")
                
                # Analyze accessories items specifically
                accessories_capital = [item for item in accessories_items if item['category'] == 'Accessories']
                accessories_lowercase = [item for item in accessories_items if item['category'] == 'accessories']
                
                print(f"\n🔍 Accessories Items Analysis:")
                print(f"   Items with category='Accessories' (capital A): {len(accessories_capital)}")
                print(f"   Items with category='accessories' (lowercase a): {len(accessories_lowercase)}")
                
                if len(accessories_lowercase) > 0:
                    print(f"   🚨 ITEMS NEED TO BE MOVED from 'accessories' to 'Accessories':")
                    for item in accessories_lowercase:
                        print(f"      - {item['name']} (ID: {item['id']})")
                        self.items_to_fix.append(item)
                
                return len(accessories_lowercase) > 0
                
            else:
                print(f"❌ Failed to get clothing items: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error investigating items: {e}")
            return False

    def create_database_cleanup_plan(self):
        """Step 3: Create cleanup plan"""
        print("\n📋 STEP 3: Database Cleanup Plan...")
        
        if not self.duplicate_categories:
            print("✅ No duplicate categories found - no cleanup needed")
            return False
        
        # Find the proper "Accessories" category and the duplicate "accessories" category
        proper_category = None
        duplicate_category = None
        
        for cat in self.duplicate_categories:
            if cat['name'] == 'Accessories':
                proper_category = cat
            elif cat['name'] == 'accessories':
                duplicate_category = cat
        
        if not proper_category:
            print("❌ Could not find proper 'Accessories' category!")
            return False
        
        if not duplicate_category:
            print("❌ Could not find duplicate 'accessories' category!")
            return False
        
        print(f"📌 CLEANUP PLAN:")
        print(f"   1. Keep: '{proper_category['name']}' (ID: {proper_category['id']})")
        print(f"   2. Move {len(self.items_to_fix)} items from '{duplicate_category['name']}' to '{proper_category['name']}'")
        print(f"   3. Delete: '{duplicate_category['name']}' (ID: {duplicate_category['id']})")
        
        return True

    def execute_fix(self):
        """Step 4: Execute the fix"""
        print("\n🔧 STEP 4: Executing Database Fix...")
        
        if not self.items_to_fix:
            print("✅ No items need to be moved")
        else:
            print(f"🔄 Moving {len(self.items_to_fix)} items from 'accessories' to 'Accessories'...")
            
            moved_count = 0
            for item in self.items_to_fix:
                try:
                    update_data = {"category": "Accessories"}
                    response = self.session.put(f"{API_URL}/clothing-items/{item['id']}", json=update_data)
                    
                    if response.status_code == 200:
                        updated_item = response.json()
                        if updated_item['category'] == 'Accessories':
                            print(f"   ✅ Moved: {item['name']} (ID: {item['id']})")
                            moved_count += 1
                        else:
                            print(f"   ❌ Failed to move: {item['name']} - category not updated")
                    else:
                        print(f"   ❌ Failed to move: {item['name']} - HTTP {response.status_code}")
                        
                except Exception as e:
                    print(f"   ❌ Error moving {item['name']}: {e}")
            
            print(f"✅ Successfully moved {moved_count}/{len(self.items_to_fix)} items")
        
        # Find and delete the duplicate category
        duplicate_category = None
        for cat in self.duplicate_categories:
            if cat['name'] == 'accessories':
                duplicate_category = cat
                break
        
        if duplicate_category:
            print(f"🗑️  Deleting duplicate category 'accessories' (ID: {duplicate_category['id']})...")
            try:
                response = self.session.delete(f"{API_URL}/categories/{duplicate_category['id']}")
                if response.status_code == 200:
                    print(f"   ✅ Successfully deleted duplicate category 'accessories'")
                else:
                    print(f"   ❌ Failed to delete duplicate category: HTTP {response.status_code}, Response: {response.text}")
            except Exception as e:
                print(f"   ❌ Error deleting duplicate category: {e}")

    def verify_fix(self):
        """Step 5: Verify the fix worked"""
        print("\n✅ STEP 5: Verifying Fix...")
        
        # Check categories again
        try:
            response = self.session.get(f"{API_URL}/categories")
            if response.status_code == 200:
                categories = response.json()
                accessories_categories = [cat for cat in categories if 'accessories' in cat['name'].lower()]
                
                print(f"📂 Categories after fix:")
                for cat in accessories_categories:
                    print(f"   - '{cat['name']}' (ID: {cat['id']})")
                
                if len(accessories_categories) == 1 and accessories_categories[0]['name'] == 'Accessories':
                    print("✅ SUCCESS: Only one 'Accessories' category remains!")
                else:
                    print(f"❌ ISSUE: Found {len(accessories_categories)} accessories categories")
                    
        except Exception as e:
            print(f"❌ Error verifying categories: {e}")
        
        # Check items assignment
        try:
            response = self.session.get(f"{API_URL}/clothing-items")
            if response.status_code == 200:
                items = response.json()
                accessories_items = [item for item in items if 'accessories' in item.get('category', '').lower()]
                
                print(f"👕 Items after fix:")
                category_counts = {}
                for item in accessories_items:
                    category = item['category']
                    category_counts[category] = category_counts.get(category, 0) + 1
                
                for category, count in category_counts.items():
                    print(f"   - {category}: {count} items")
                
                lowercase_accessories = [item for item in accessories_items if item['category'] == 'accessories']
                if len(lowercase_accessories) == 0:
                    print("✅ SUCCESS: No items with lowercase 'accessories' category remain!")
                else:
                    print(f"❌ ISSUE: {len(lowercase_accessories)} items still have lowercase 'accessories' category")
                    
        except Exception as e:
            print(f"❌ Error verifying items: {e}")

    def run_investigation_and_fix(self):
        """Run the complete investigation and fix process"""
        print("🚨 DUPLICATE ACCESSORIES CATEGORIES INVESTIGATION AND FIX")
        print("=" * 60)
        
        if not self.test_api_health():
            return False
        
        # Step 1: Investigate categories
        has_duplicates = self.investigate_categories()
        
        # Step 2: Investigate items assignment
        has_items_to_fix = self.investigate_items_assignment()
        
        if not has_duplicates and not has_items_to_fix:
            print("\n✅ CONCLUSION: No duplicate accessories categories found!")
            return True
        
        # Step 3: Create cleanup plan
        if not self.create_database_cleanup_plan():
            print("\n❌ CONCLUSION: Could not create cleanup plan!")
            return False
        
        # Ask for confirmation before executing fix
        print(f"\n⚠️  READY TO EXECUTE FIX - This will modify the database!")
        print(f"   - Move {len(self.items_to_fix)} items from 'accessories' to 'Accessories'")
        print(f"   - Delete the duplicate 'accessories' category")
        
        # For automated testing, we'll proceed with the fix
        print(f"🔧 Proceeding with automated fix...")
        
        # Step 4: Execute fix
        self.execute_fix()
        
        # Step 5: Verify fix
        self.verify_fix()
        
        print("\n🎉 DUPLICATE ACCESSORIES CATEGORIES INVESTIGATION AND FIX COMPLETE!")
        return True

if __name__ == "__main__":
    investigator = DuplicateCategoriesInvestigator()
    success = investigator.run_investigation_and_fix()
    sys.exit(0 if success else 1)