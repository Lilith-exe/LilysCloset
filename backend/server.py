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
    image: str  # base64 encoded image
    tags: Dict[str, List[str]] = Field(default_factory=dict)  # {"color": ["red", "blue"], "theme": ["casual"], "features": ["pockets"]}
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClothingItemCreate(BaseModel):
    name: str
    category: str
    image: str  # base64 encoded image
    tags: Dict[str, List[str]] = Field(default_factory=dict)
    notes: str = ""

class ClothingItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    tags: Optional[Dict[str, List[str]]] = None
    notes: Optional[str] = None

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str

class TagCategory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TagCategoryCreate(BaseModel):
    name: str

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

# Search and Filter Routes
@api_router.get("/clothing-items/search/{query}")
async def search_clothing_items(query: str):
    try:
        # Search by inventory number (exact match)
        if query.isdigit():
            item = await db.clothing_items.find_one({"inventory_number": int(query)})
            if item:
                return [ClothingItem(**parse_from_mongo(item))]
        
        # Search by name, category, or tag values
        search_filter = {
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"category": {"$regex": query, "$options": "i"}},
                {"notes": {"$regex": query, "$options": "i"}},
                {"tags.color": {"$regex": query, "$options": "i"}},
                {"tags.theme": {"$regex": query, "$options": "i"}},
                {"tags.features": {"$regex": query, "$options": "i"}}
            ]
        }
        
        items = await db.clothing_items.find(search_filter).sort("inventory_number", 1).to_list(length=None)
        return [ClothingItem(**parse_from_mongo(item)) for item in items]
    except Exception as e:
        logging.error(f"Error searching clothing items: {e}")
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