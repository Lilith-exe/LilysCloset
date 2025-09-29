from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class ClothingItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    inventory_number: int
    name: str
    category: str
    subcategory: Optional[str] = None  # For accessories subcategories
    image: str  # base64 encoded image
    tags: Dict[str, List[str]] = Field(default_factory=dict)  # {"color": ["red", "blue"], "theme": ["casual"], "features": ["pockets"]}
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClothingItemCreate(BaseModel):
    name: str
    category: str
    subcategory: Optional[str] = None
    image: str  # base64 encoded image
    tags: Dict[str, List[str]] = Field(default_factory=dict)
    notes: str = ""

class ClothingItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    image: Optional[str] = None
    tags: Optional[Dict[str, List[str]]] = None
    notes: Optional[str] = None

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    custom_icon: Optional[str] = None  # base64 encoded image
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    custom_icon: Optional[str] = None

class TagCategory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TagCategoryCreate(BaseModel):
    name: str

class Tag(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    tag_type: str
    categories: List[str] = Field(default_factory=list)  # Categories this tag is available for
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TagCreate(BaseModel):
    name: str
    tag_type: str
    categories: List[str] = Field(default_factory=list)

class Subcategory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    parent_category: str
    custom_icon: Optional[str] = None  # base64 encoded image, inherits from parent if None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubcategoryCreate(BaseModel):
    name: str
    parent_category: str
    custom_icon: Optional[str] = None

class StatsResponse(BaseModel):
    total_items: int
    categories: Dict[str, int]
    tags: Dict[str, Dict[str, int]]

# Helper functions
def prepare_for_mongo(data):
    if isinstance(data, dict):
        prepared = {}
        for key, value in data.items():
            if isinstance(value, datetime):
                prepared[key] = value.isoformat()
            else:
                prepared[key] = value
        return prepared
    return data

def parse_from_mongo(item):
    if isinstance(item, dict):
        parsed = {}
        for key, value in item.items():
            if key in ['created_at', 'updated_at'] and isinstance(value, str):
                try:
                    parsed[key] = datetime.fromisoformat(value)
                except ValueError:
                    parsed[key] = value
            else:
                parsed[key] = value
        return parsed
    return item

# Clothing Items Routes
@api_router.post("/clothing-items", response_model=ClothingItem)
async def create_clothing_item(item: ClothingItemCreate):
    try:
        # Get next inventory number
        last_item = await db.clothing_items.find_one(sort=[("inventory_number", -1)])
        next_inventory = (last_item["inventory_number"] + 1) if last_item else 1
        
        # Create clothing item
        item_dict = item.dict()
        item_dict["inventory_number"] = next_inventory
        clothing_item = ClothingItem(**item_dict)
        
        # Prepare for MongoDB
        item_data = prepare_for_mongo(clothing_item.dict())
        
        await db.clothing_items.insert_one(item_data)
        return clothing_item
    except Exception as e:
        logging.error(f"Error creating clothing item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/clothing-items", response_model=List[ClothingItem])
async def get_clothing_items():
    try:
        items = await db.clothing_items.find().sort("inventory_number", 1).to_list(length=None)
        return [ClothingItem(**parse_from_mongo(item)) for item in items]
    except Exception as e:
        logging.error(f"Error getting clothing items: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/clothing-items/{item_id}", response_model=ClothingItem)
async def get_clothing_item(item_id: str):
    try:
        item = await db.clothing_items.find_one({"id": item_id})
        if not item:
            raise HTTPException(status_code=404, detail="Clothing item not found")
        return ClothingItem(**parse_from_mongo(item))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting clothing item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/clothing-items/{item_id}", response_model=ClothingItem)
async def update_clothing_item(item_id: str, update_data: ClothingItemUpdate):
    try:
        item = await db.clothing_items.find_one({"id": item_id})
        if not item:
            raise HTTPException(status_code=404, detail="Clothing item not found")
        
        # Update only provided fields
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        # Prepare for MongoDB
        prepared_update = prepare_for_mongo(update_dict)
        
        await db.clothing_items.update_one(
            {"id": item_id},
            {"$set": prepared_update}
        )
        
        # Get updated item
        updated_item = await db.clothing_items.find_one({"id": item_id})
        return ClothingItem(**parse_from_mongo(updated_item))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating clothing item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/clothing-items/{item_id}")
async def delete_clothing_item(item_id: str):
    try:
        result = await db.clothing_items.delete_one({"id": item_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Clothing item not found")
        return {"message": "Clothing item deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting clothing item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Categories Routes
@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate):
    try:
        # Check if category already exists
        existing = await db.categories.find_one({"name": category.name})
        if existing:
            raise HTTPException(status_code=400, detail="Category already exists")
        
        category_obj = Category(**category.dict())
        category_data = prepare_for_mongo(category_obj.dict())
        
        await db.categories.insert_one(category_data)
        return category_obj
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    try:
        categories = await db.categories.find().sort("name", 1).to_list(length=None)
        return [Category(**parse_from_mongo(cat)) for cat in categories]
    except Exception as e:
        logging.error(f"Error getting categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, update_data: dict):
    try:
        category = await db.categories.find_one({"id": category_id})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Update only provided fields
        update_dict = {}
        if "custom_icon" in update_data:
            update_dict["custom_icon"] = update_data["custom_icon"]
        
        if update_dict:
            await db.categories.update_one(
                {"id": category_id},
                {"$set": update_dict}
            )
        
        # Get updated category
        updated_category = await db.categories.find_one({"id": category_id})
        return Category(**parse_from_mongo(updated_category))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    try:
        result = await db.categories.delete_one({"id": category_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"message": "Category deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Tags Management Routes
@api_router.post("/tags", response_model=Tag)
async def create_tag(tag: TagCreate):
    try:
        existing = await db.tags.find_one({"name": tag.name, "tag_type": tag.tag_type})
        if existing:
            raise HTTPException(status_code=400, detail="Tag already exists in this tag type")
        
        tag_obj = Tag(**tag.dict())
        tag_data = prepare_for_mongo(tag_obj.dict())
        
        await db.tags.insert_one(tag_data)
        return tag_obj
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating tag: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/tags", response_model=List[Tag])
async def get_tags():
    try:
        tags = await db.tags.find().sort("tag_type", 1).to_list(length=None)
        return [Tag(**parse_from_mongo(tag)) for tag in tags]
    except Exception as e:
        logging.error(f"Error getting tags: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/tags/{tag_type}")
async def get_tags_by_type(tag_type: str, category: Optional[str] = None):
    try:
        query = {"tag_type": tag_type}
        
        # If category specified, only return tags available for that category
        if category and category != "all":
            query["$or"] = [
                {"categories": []},  # Global tags (no category restriction)
                {"categories": {"$in": [category]}}  # Category-specific tags
            ]
        
        tags = await db.tags.find(query).sort("name", 1).to_list(length=None)
        return [Tag(**parse_from_mongo(tag)) for tag in tags]
    except Exception as e:
        logging.error(f"Error getting tags by type: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/tags/{tag_id}")
async def delete_tag(tag_id: str):
    try:
        result = await db.tags.delete_one({"id": tag_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Tag not found")
        return {"message": "Tag deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting tag: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Subcategories Routes
@api_router.post("/subcategories", response_model=Subcategory)
async def create_subcategory(subcategory: SubcategoryCreate):
    try:
        existing = await db.subcategories.find_one({
            "name": subcategory.name,
            "parent_category": subcategory.parent_category
        })
        if existing:
            raise HTTPException(status_code=400, detail="Subcategory already exists in this category")
        
        subcategory_obj = Subcategory(**subcategory.dict())
        subcategory_data = prepare_for_mongo(subcategory_obj.dict())
        
        await db.subcategories.insert_one(subcategory_data)
        return subcategory_obj
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating subcategory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/subcategories/{parent_category}")
async def get_subcategories(parent_category: str):
    try:
        subcategories = await db.subcategories.find({"parent_category": parent_category}).sort("name", 1).to_list(length=None)
        return [Subcategory(**parse_from_mongo(sub)) for sub in subcategories]
    except Exception as e:
        logging.error(f"Error getting subcategories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/subcategories/{subcategory_id}")
async def update_subcategory(subcategory_id: str, update_data: dict):
    try:
        subcategory = await db.subcategories.find_one({"id": subcategory_id})
        if not subcategory:
            raise HTTPException(status_code=404, detail="Subcategory not found")
        
        # Update only provided fields
        update_dict = {}
        if "custom_icon" in update_data:
            update_dict["custom_icon"] = update_data["custom_icon"]
        
        if update_dict:
            await db.subcategories.update_one(
                {"id": subcategory_id},
                {"$set": update_dict}
            )
        
        # Get updated subcategory
        updated_subcategory = await db.subcategories.find_one({"id": subcategory_id})
        return Subcategory(**parse_from_mongo(updated_subcategory))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating subcategory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/subcategories/{subcategory_id}")
async def delete_subcategory(subcategory_id: str):
    try:
        result = await db.subcategories.delete_one({"id": subcategory_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Subcategory not found")
        return {"message": "Subcategory deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting subcategory: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@api_router.post("/tag-categories", response_model=TagCategory)
async def create_tag_category(tag_category: TagCategoryCreate):
    try:
        # Check if tag category already exists
        existing = await db.tag_categories.find_one({"name": tag_category.name})
        if existing:
            raise HTTPException(status_code=400, detail="Tag category already exists")
        
        tag_category_obj = TagCategory(**tag_category.dict())
        tag_category_data = prepare_for_mongo(tag_category_obj.dict())
        
        await db.tag_categories.insert_one(tag_category_data)
        return tag_category_obj
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating tag category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/tag-categories", response_model=List[TagCategory])
async def get_tag_categories():
    try:
        tag_categories = await db.tag_categories.find().sort("name", 1).to_list(length=None)
        # Always include default tag categories if they don't exist
        default_categories = ["color", "theme", "features"]
        existing_names = [tc["name"].lower() for tc in tag_categories]
        
        for default_cat in default_categories:
            if default_cat not in existing_names:
                # Create default category
                default_tag_cat = TagCategory(name=default_cat)
                default_data = prepare_for_mongo(default_tag_cat.dict())
                await db.tag_categories.insert_one(default_data)
                tag_categories.append(default_data)
        
        return [TagCategory(**parse_from_mongo(tc)) for tc in tag_categories]
    except Exception as e:
        logging.error(f"Error getting tag categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/tag-categories/{tag_category_id}")
async def delete_tag_category(tag_category_id: str):
    try:
        # Don't allow deletion of default categories
        tag_cat = await db.tag_categories.find_one({"id": tag_category_id})
        if not tag_cat:
            raise HTTPException(status_code=404, detail="Tag category not found")
        
        if tag_cat["name"].lower() in ["color", "theme", "features"]:
            raise HTTPException(status_code=400, detail="Cannot delete default tag categories")
        
        result = await db.tag_categories.delete_one({"id": tag_category_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Tag category not found")
        return {"message": "Tag category deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting tag category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Search and Filter Routes
@api_router.get("/clothing-items/search/{query}")
async def search_clothing_items(query: str):
    try:
        # Search by inventory number (exact match)
        if query.isdigit():
            item = await db.clothing_items.find_one({"inventory_number": int(query)})
            if item:
                return [ClothingItem(**parse_from_mongo(item))]
        
        # Get all tag categories for dynamic search
        tag_categories = await db.tag_categories.find().to_list(length=None)
        tag_searches = []
        for tag_cat in tag_categories:
            tag_searches.append({f"tags.{tag_cat['name']}": {"$regex": query, "$options": "i"}})
        
        # Search by name, category, or tag values
        search_filter = {
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"category": {"$regex": query, "$options": "i"}},
                {"notes": {"$regex": query, "$options": "i"}},
                *tag_searches
            ]
        }
        
        items = await db.clothing_items.find(search_filter).sort("inventory_number", 1).to_list(length=None)
        return [ClothingItem(**parse_from_mongo(item)) for item in items]
    except Exception as e:
        logging.error(f"Error searching clothing items: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Stats Route
@api_router.get("/stats", response_model=StatsResponse)
async def get_stats():
    try:
        # Get total items count
        total_items = await db.clothing_items.count_documents({})
        
        # Get category counts
        category_pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        category_stats = await db.clothing_items.aggregate(category_pipeline).to_list(length=None)
        categories = {item["_id"]: item["count"] for item in category_stats}
        
        # Get tag counts
        tag_stats = {}
        tag_categories = await db.tag_categories.find().to_list(length=None)
        
        for tag_cat in tag_categories:
            tag_name = tag_cat["name"]
            # Aggregate tags for this category
            tag_pipeline = [
                {"$unwind": f"$tags.{tag_name}"},
                {"$group": {"_id": f"$tags.{tag_name}", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            tag_results = await db.clothing_items.aggregate(tag_pipeline).to_list(length=None)
            tag_stats[tag_name] = {item["_id"]: item["count"] for item in tag_results}
        
        return StatsResponse(
            total_items=total_items,
            categories=categories,
            tags=tag_stats
        )
    except Exception as e:
        logging.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Test route
@api_router.get("/")
async def root():
    return {"message": "Clothing Catalog API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()