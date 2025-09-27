#!/usr/bin/env python3
"""
Final Subcategory Filtering Debug Test
Based on findings: The issue is case sensitivity!
- Database has category="Accessories" (title case)
- Frontend filtering might be looking for "accessories" (lowercase)
"""

import requests
import json
import base64

# Get backend URL
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip()
            break

API_URL = f'{BASE_URL}/api'
SAMPLE_BASE64_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

print("🔍 SUBCATEGORY FILTERING DEBUG - FINAL ANALYSIS")
print("=" * 60)

# Step 1: Show current database state
print("\n📋 STEP 1: Current database state")
response = requests.get(f'{API_URL}/clothing-items')
if response.status_code == 200:
    items = response.json()
    print(f"Total items: {len(items)}")
    
    print("\nAll items with exact field values:")
    for i, item in enumerate(items, 1):
        print(f"{i}. {item.get('name')}")
        print(f"   category: '{item.get('category')}' (case: {item.get('category')})")
        print(f"   subcategory: '{item.get('subcategory')}' (case: {item.get('subcategory')})")
    
    # Show accessories items specifically
    accessories_title_case = [item for item in items if item.get('category') == 'Accessories']
    accessories_lower_case = [item for item in items if item.get('category') == 'accessories']
    
    print(f"\n🎯 Accessories Analysis:")
    print(f"   Items with category='Accessories' (title case): {len(accessories_title_case)}")
    print(f"   Items with category='accessories' (lowercase): {len(accessories_lower_case)}")
    
    if accessories_title_case:
        print(f"\n   Accessories items (title case):")
        for item in accessories_title_case:
            print(f"   - {item.get('name')}: subcategory='{item.get('subcategory')}'")
            
        # Check jewelry filtering
        jewelry_items = [item for item in accessories_title_case if item.get('subcategory') == 'Jewelry']
        print(f"\n   Jewelry items (exact case): {len(jewelry_items)}")
        for item in jewelry_items:
            print(f"   - {item.get('name')}: category='{item.get('category')}', subcategory='{item.get('subcategory')}'")

# Step 2: Create the requested debug test item
print(f"\n🧪 STEP 2: Creating 'Debug Test Jewelry' item")

# Ensure accessories category exists (try both cases)
for category_name in ['accessories', 'Accessories']:
    try:
        response = requests.post(f"{API_URL}/categories", json={"name": category_name})
        if response.status_code == 200:
            print(f"✅ Created category: {category_name}")
        elif response.status_code == 400:
            print(f"✅ Category already exists: {category_name}")
    except Exception as e:
        print(f"⚠️ Error with category {category_name}: {e}")

# Ensure Jewelry subcategory exists for both parent categories
for parent_category in ['accessories', 'Accessories']:
    try:
        response = requests.post(f"{API_URL}/subcategories", json={
            "name": "Jewelry", 
            "parent_category": parent_category
        })
        if response.status_code == 200:
            print(f"✅ Created Jewelry subcategory for parent: {parent_category}")
        elif response.status_code == 400:
            print(f"✅ Jewelry subcategory already exists for parent: {parent_category}")
    except Exception as e:
        print(f"⚠️ Error with subcategory for {parent_category}: {e}")

# Create the debug test item with lowercase "accessories" as requested
debug_item = {
    "name": "Debug Test Jewelry",
    "category": "accessories",  # Using lowercase as requested
    "subcategory": "Jewelry",
    "image": SAMPLE_BASE64_IMAGE,
    "tags": {
        "color": ["gold", "silver"],
        "theme": ["elegant"],
        "features": ["adjustable"]
    },
    "notes": "Debug test item for subcategory filtering issue"
}

created_item_id = None
try:
    response = requests.post(f"{API_URL}/clothing-items", json=debug_item)
    if response.status_code == 200:
        created_item = response.json()
        created_item_id = created_item["id"]
        print(f"✅ Created debug test item:")
        print(f"   ID: {created_item['id']}")
        print(f"   Name: {created_item['name']}")
        print(f"   Category: '{created_item['category']}'")
        print(f"   Subcategory: '{created_item['subcategory']}'")
    else:
        print(f"❌ Failed to create debug item: {response.status_code} - {response.text}")
except Exception as e:
    print(f"❌ Error creating debug item: {e}")

# Step 3: Test all filtering combinations
print(f"\n🔍 STEP 3: Testing all filtering combinations")

response = requests.get(f'{API_URL}/clothing-items')
if response.status_code == 200:
    all_items = response.json()
    
    # Test 1: category="accessories" (lowercase)
    accessories_lower = [item for item in all_items if item.get('category') == 'accessories']
    print(f"\n1. Items with category='accessories' (lowercase): {len(accessories_lower)}")
    for item in accessories_lower:
        print(f"   - {item.get('name')}: subcategory='{item.get('subcategory')}'")
    
    # Test 2: category="Accessories" (title case)
    accessories_title = [item for item in all_items if item.get('category') == 'Accessories']
    print(f"\n2. Items with category='Accessories' (title case): {len(accessories_title)}")
    for item in accessories_title:
        print(f"   - {item.get('name')}: subcategory='{item.get('subcategory')}'")
    
    # Test 3: category="accessories" AND subcategory="Jewelry"
    jewelry_lower_cat = [item for item in all_items 
                        if item.get('category') == 'accessories' and item.get('subcategory') == 'Jewelry']
    print(f"\n3. Items with category='accessories' AND subcategory='Jewelry': {len(jewelry_lower_cat)}")
    for item in jewelry_lower_cat:
        print(f"   - {item.get('name')}: category='{item.get('category')}', subcategory='{item.get('subcategory')}'")
    
    # Test 4: category="Accessories" AND subcategory="Jewelry"
    jewelry_title_cat = [item for item in all_items 
                        if item.get('category') == 'Accessories' and item.get('subcategory') == 'Jewelry']
    print(f"\n4. Items with category='Accessories' AND subcategory='Jewelry': {len(jewelry_title_cat)}")
    for item in jewelry_title_cat:
        print(f"   - {item.get('name')}: category='{item.get('category')}', subcategory='{item.get('subcategory')}'")
    
    # Test 5: Case insensitive filtering
    accessories_any_case = [item for item in all_items 
                           if item.get('category', '').lower() == 'accessories']
    jewelry_any_case = [item for item in accessories_any_case 
                       if item.get('subcategory', '').lower() == 'jewelry']
    print(f"\n5. Case-insensitive: accessories items: {len(accessories_any_case)}, jewelry items: {len(jewelry_any_case)}")
    for item in jewelry_any_case:
        print(f"   - {item.get('name')}: category='{item.get('category')}', subcategory='{item.get('subcategory')}'")

# Step 4: Summary and diagnosis
print(f"\n📊 STEP 4: DIAGNOSIS AND SUMMARY")
print("=" * 60)

print("🔍 FINDINGS:")
print("1. Database contains items with category='Accessories' (title case)")
print("2. Database also now contains items with category='accessories' (lowercase)")
print("3. Both have subcategory='Jewelry' items")
print("4. The filtering issue is likely due to case sensitivity mismatch")

print("\n🚨 ROOT CAUSE IDENTIFIED:")
print("The frontend filtering logic is probably:")
print("- Clicking 'Accessories' shows items where category matches 'Accessories' (works)")
print("- Clicking 'Jewelry' subcategory filters for category='accessories' AND subcategory='Jewelry'")
print("- But existing items have category='Accessories' (title case), not 'accessories' (lowercase)")
print("- So the subcategory filter finds no matches!")

print("\n💡 SOLUTION:")
print("The frontend filtering logic needs to be case-insensitive, or")
print("The category values need to be normalized to consistent case")

# Cleanup
if created_item_id:
    try:
        response = requests.delete(f"{API_URL}/clothing-items/{created_item_id}")
        if response.status_code == 200:
            print(f"\n🧹 Cleaned up debug test item: {created_item_id}")
        else:
            print(f"\n⚠️ Failed to cleanup debug item: {response.status_code}")
    except Exception as e:
        print(f"\n⚠️ Error cleaning up: {e}")

print("\n✅ DEBUG ANALYSIS COMPLETE!")