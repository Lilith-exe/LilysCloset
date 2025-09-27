#!/usr/bin/env python3
"""
Focused test for Accessories Subcategory Functionality
Tests the specific requirements from the review request
"""

import requests
import json
import sys

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
print(f"🔗 Testing Accessories Subcategory API at: {API_URL}")

SAMPLE_BASE64_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

def test_subcategory_management_api():
    """Test 1: Subcategory Management API - GET /api/subcategories/accessories"""
    print("\n🔍 Test 1: Subcategory Management API")
    
    session = requests.Session()
    
    try:
        response = session.get(f"{API_URL}/subcategories/accessories")
        if response.status_code == 200:
            subcategories = response.json()
            print(f"✅ GET /api/subcategories/accessories successful")
            print(f"📊 Found {len(subcategories)} subcategories")
            
            if len(subcategories) >= 6:
                print("✅ Returns expected 6+ subcategories")
                subcategory_names = [sub["name"] for sub in subcategories]
                print(f"📝 Subcategories: {subcategory_names}")
                return True, subcategories
            else:
                print(f"❌ Expected 6+ subcategories, got {len(subcategories)}")
                return False, subcategories
        else:
            print(f"❌ API call failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            return False, []
    except Exception as e:
        print(f"❌ Error testing subcategory API: {e}")
        return False, []

def test_clothing_item_crud_with_subcategories():
    """Test 2: Clothing Item CRUD with Subcategories"""
    print("\n🧥 Test 2: Clothing Item CRUD with Subcategories")
    
    session = requests.Session()
    created_items = []
    
    # Test 2a: Create item with category="accessories" and subcategory="Jewelry"
    jewelry_item = {
        "name": "Pearl Necklace",
        "category": "accessories",
        "subcategory": "Jewelry",
        "image": SAMPLE_BASE64_IMAGE,
        "tags": {
            "color": ["white", "cream"],
            "theme": ["elegant", "formal"],
            "features": ["classic", "timeless"]
        },
        "notes": "Elegant pearl necklace for special occasions"
    }
    
    try:
        response = session.post(f"{API_URL}/clothing-items", json=jewelry_item)
        if response.status_code == 200:
            created_item = response.json()
            created_items.append(created_item["id"])
            
            if (created_item["category"] == "accessories" and 
                created_item["subcategory"] == "Jewelry"):
                print("✅ Created item with category='accessories' and subcategory='Jewelry'")
                print(f"📝 Item: {created_item['name']} (ID: {created_item['id']})")
            else:
                print(f"❌ Subcategory not properly assigned. Got category='{created_item.get('category')}', subcategory='{created_item.get('subcategory')}'")
        else:
            print(f"❌ Failed to create jewelry item: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error creating jewelry item: {e}")
    
    # Test 2b: Create item with category="accessories" and subcategory="Bags"
    bag_item = {
        "name": "Designer Handbag",
        "category": "accessories",
        "subcategory": "Bags",
        "image": SAMPLE_BASE64_IMAGE,
        "tags": {
            "color": ["black", "gold"],
            "theme": ["luxury", "formal"],
            "features": ["leather", "chain-strap"]
        },
        "notes": "Luxury designer handbag with gold chain"
    }
    
    try:
        response = session.post(f"{API_URL}/clothing-items", json=bag_item)
        if response.status_code == 200:
            created_item = response.json()
            created_items.append(created_item["id"])
            
            if (created_item["category"] == "accessories" and 
                created_item["subcategory"] == "Bags"):
                print("✅ Created item with category='accessories' and subcategory='Bags'")
                print(f"📝 Item: {created_item['name']} (ID: {created_item['id']})")
            else:
                print(f"❌ Subcategory not properly assigned. Got category='{created_item.get('category')}', subcategory='{created_item.get('subcategory')}'")
        else:
            print(f"❌ Failed to create bag item: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error creating bag item: {e}")
    
    # Test 2c: Update existing item to assign subcategory
    if created_items:
        item_id = created_items[0]  # Update the jewelry item
        update_data = {"subcategory": "Watches"}
        
        try:
            response = session.put(f"{API_URL}/clothing-items/{item_id}", json=update_data)
            if response.status_code == 200:
                updated_item = response.json()
                if updated_item["subcategory"] == "Watches":
                    print("✅ Updated existing item to assign new subcategory")
                    print(f"📝 Updated {updated_item['name']} subcategory to 'Watches'")
                else:
                    print(f"❌ Update failed. Expected 'Watches', got '{updated_item.get('subcategory')}'")
            else:
                print(f"❌ Failed to update item: {response.status_code}")
        except Exception as e:
            print(f"❌ Error updating item: {e}")
    
    # Test 2d: Verify subcategory field is properly stored and retrieved
    if created_items:
        item_id = created_items[1] if len(created_items) > 1 else created_items[0]
        
        try:
            response = session.get(f"{API_URL}/clothing-items/{item_id}")
            if response.status_code == 200:
                retrieved_item = response.json()
                if retrieved_item.get("subcategory"):
                    print("✅ Subcategory field properly stored and retrieved")
                    print(f"📝 Retrieved item has subcategory: '{retrieved_item['subcategory']}'")
                else:
                    print("❌ Subcategory field not found in retrieved item")
            else:
                print(f"❌ Failed to retrieve item: {response.status_code}")
        except Exception as e:
            print(f"❌ Error retrieving item: {e}")
    
    # Cleanup
    for item_id in created_items:
        try:
            session.delete(f"{API_URL}/clothing-items/{item_id}")
        except:
            pass
    
    return len(created_items) >= 2

def test_search_filter_by_subcategory():
    """Test 3: Search/Filter by Subcategory"""
    print("\n🔍 Test 3: Search/Filter by Subcategory")
    
    session = requests.Session()
    created_items = []
    
    # Create test items with different subcategories
    test_items = [
        {
            "name": "Gold Watch",
            "category": "accessories",
            "subcategory": "Watches",
            "image": SAMPLE_BASE64_IMAGE,
            "tags": {"color": ["gold"], "theme": ["luxury"]},
            "notes": "Luxury gold watch"
        },
        {
            "name": "Silver Bracelet",
            "category": "accessories",
            "subcategory": "Jewelry",
            "image": SAMPLE_BASE64_IMAGE,
            "tags": {"color": ["silver"], "theme": ["elegant"]},
            "notes": "Elegant silver bracelet"
        },
        {
            "name": "Leather Wallet",
            "category": "accessories",
            "subcategory": "Bags",
            "image": SAMPLE_BASE64_IMAGE,
            "tags": {"color": ["brown"], "theme": ["casual"]},
            "notes": "Brown leather wallet"
        }
    ]
    
    # Create test items
    for item in test_items:
        try:
            response = session.post(f"{API_URL}/clothing-items", json=item)
            if response.status_code == 200:
                created_item = response.json()
                created_items.append(created_item["id"])
                print(f"✅ Created {item['name']} with subcategory '{item['subcategory']}'")
        except Exception as e:
            print(f"❌ Error creating {item['name']}: {e}")
    
    # Test filtering by category and then by subcategory
    try:
        response = session.get(f"{API_URL}/clothing-items")
        if response.status_code == 200:
            all_items = response.json()
            accessories_items = [item for item in all_items if item.get("category") == "accessories"]
            
            print(f"📊 Found {len(accessories_items)} accessories items total")
            
            # Filter by subcategories
            watches = [item for item in accessories_items if item.get("subcategory") == "Watches"]
            jewelry = [item for item in accessories_items if item.get("subcategory") == "Jewelry"]
            bags = [item for item in accessories_items if item.get("subcategory") == "Bags"]
            
            print(f"📊 Watches: {len(watches)}, Jewelry: {len(jewelry)}, Bags: {len(bags)}")
            
            if len(watches) >= 1 and len(jewelry) >= 1 and len(bags) >= 1:
                print("✅ Items can be filtered by subcategory within accessories category")
                
                # Show examples
                for watch in watches[:1]:
                    print(f"📝 Watch example: {watch['name']} (subcategory: {watch['subcategory']})")
                for jewel in jewelry[:1]:
                    print(f"📝 Jewelry example: {jewel['name']} (subcategory: {jewel['subcategory']})")
                for bag in bags[:1]:
                    print(f"📝 Bag example: {bag['name']} (subcategory: {bag['subcategory']})")
            else:
                print("❌ Could not filter items by subcategory properly")
        else:
            print(f"❌ Failed to get all items: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing subcategory filtering: {e}")
    
    # Test search functionality with subcategory items
    try:
        response = session.get(f"{API_URL}/clothing-items/search/watch")
        if response.status_code == 200:
            search_results = response.json()
            watch_found = any(
                "watch" in item.get("name", "").lower() and 
                item.get("subcategory") == "Watches"
                for item in search_results
            )
            
            if watch_found:
                print("✅ Search functionality works with subcategory items")
            else:
                print("❌ Search did not find subcategory items properly")
        else:
            print(f"❌ Search failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing search with subcategories: {e}")
    
    # Cleanup
    for item_id in created_items:
        try:
            session.delete(f"{API_URL}/clothing-items/{item_id}")
        except:
            pass
    
    return len(created_items) >= 3

def main():
    """Run all accessories subcategory tests"""
    print("🚀 Starting Accessories Subcategory Functionality Tests")
    print("="*60)
    
    results = []
    
    # Test 1: Subcategory Management API
    success, subcategories = test_subcategory_management_api()
    results.append(("Subcategory Management API", success))
    
    # Test 2: Clothing Item CRUD with Subcategories
    success = test_clothing_item_crud_with_subcategories()
    results.append(("Clothing Item CRUD with Subcategories", success))
    
    # Test 3: Search/Filter by Subcategory
    success = test_search_filter_by_subcategory()
    results.append(("Search/Filter by Subcategory", success))
    
    # Summary
    print("\n" + "="*60)
    print("📊 ACCESSORIES SUBCATEGORY TEST SUMMARY")
    print("="*60)
    
    passed = 0
    failed = 0
    
    for test_name, success in results:
        if success:
            print(f"✅ {test_name}")
            passed += 1
        else:
            print(f"❌ {test_name}")
            failed += 1
    
    print(f"\n📈 Results: {passed} passed, {failed} failed")
    print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%" if (passed+failed) > 0 else "N/A")
    
    if failed == 0:
        print("\n🎉 All accessories subcategory tests passed!")
        return True
    else:
        print(f"\n💥 {failed} test(s) failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)