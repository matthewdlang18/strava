from fastapi import FastAPI, HTTPException, Request, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime, timedelta
import asyncio
import httpx
from urllib.parse import urlencode
import secrets

# Load environment variables
load_dotenv()

app = FastAPI(title="FitTracker Pro API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = None
db = None

@app.on_event("startup")
async def startup_db_client():
    global client, db
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")
    
    if not mongo_url or not db_name:
        raise ValueError("MONGO_URL and DB_NAME must be set in environment variables")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Test the connection
    try:
        await client.admin.command('ping')
        print(f"Connected to MongoDB: {db_name}")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()

# Strava configuration
STRAVA_CLIENT_ID = os.getenv("STRAVA_CLIENT_ID")
STRAVA_CLIENT_SECRET = os.getenv("STRAVA_CLIENT_SECRET")
STRAVA_REDIRECT_URI = os.getenv("STRAVA_REDIRECT_URI")

# Pydantic models
class User(BaseModel):
    id: str
    strava_id: Optional[int] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    email: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class Activity(BaseModel):
    id: str
    strava_id: int
    user_id: str
    name: str
    sport_type: str
    distance: Optional[float] = None
    moving_time: Optional[int] = None
    elapsed_time: Optional[int] = None
    total_elevation_gain: Optional[float] = None
    average_speed: Optional[float] = None
    max_speed: Optional[float] = None
    average_heartrate: Optional[float] = None
    max_heartrate: Optional[float] = None
    start_date: datetime
    created_at: datetime

class DashboardStats(BaseModel):
    total_activities: int
    total_distance: float
    total_time: int
    this_week_activities: int
    this_week_distance: float
    avg_speed: float
    recent_activities: List[Dict[str, Any]]

# Helper functions
def generate_state() -> str:
    """Generate a secure random state for OAuth"""
    return secrets.token_urlsafe(32)

def format_distance(meters: float) -> str:
    """Convert meters to km with proper formatting"""
    if meters is None:
        return "0 km"
    km = meters / 1000
    return f"{km:.1f} km"

def format_time(seconds: int) -> str:
    """Convert seconds to HH:MM:SS format"""
    if seconds is None:
        return "0:00:00"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"

def format_speed(mps: float) -> str:
    """Convert m/s to km/h"""
    if mps is None:
        return "0.0 km/h"
    kmh = mps * 3.6
    return f"{kmh:.1f} km/h"

# Routes
@app.get("/")
async def root():
    return {"message": "FitTracker Pro API - Your free Strava alternative"}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/auth/strava")
async def strava_auth():
    """Initiate Strava OAuth flow"""
    state = generate_state()
    
    # Store state in database for verification
    await db.oauth_states.insert_one({
        "state": state,
        "created_at": datetime.now(),
        "expires_at": datetime.now() + timedelta(minutes=10)
    })
    
    params = {
        "client_id": STRAVA_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": STRAVA_REDIRECT_URI,
        "approval_prompt": "force",
        "scope": "read,activity:read_all,profile:read_all",
        "state": state
    }
    
    auth_url = f"https://www.strava.com/oauth/authorize?{urlencode(params)}"
    return {"auth_url": auth_url}

@app.get("/api/auth/strava/callback")
async def strava_callback(code: str = Query(...), state: str = Query(...)):
    """Handle Strava OAuth callback"""
    
    # Verify state
    state_doc = await db.oauth_states.find_one({"state": state})
    if not state_doc:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    # Clean up used state
    await db.oauth_states.delete_one({"state": state})
    
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://www.strava.com/oauth/token",
            data={
                "client_id": STRAVA_CLIENT_ID,
                "client_secret": STRAVA_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code"
            }
        )
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code for token")
    
    token_data = response.json()
    athlete_data = token_data.get("athlete", {})
    
    # Create or update user
    user_id = str(uuid.uuid4())
    now = datetime.now()
    
    user_doc = {
        "id": user_id,
        "strava_id": athlete_data.get("id"),
        "firstname": athlete_data.get("firstname"),
        "lastname": athlete_data.get("lastname"),
        "email": athlete_data.get("email"),
        "access_token": token_data.get("access_token"),
        "refresh_token": token_data.get("refresh_token"),
        "created_at": now,
        "updated_at": now
    }
    
    # Check if user already exists
    existing_user = await db.users.find_one({"strava_id": athlete_data.get("id")})
    if existing_user:
        # Update existing user
        await db.users.update_one(
            {"strava_id": athlete_data.get("id")},
            {"$set": {
                "access_token": token_data.get("access_token"),
                "refresh_token": token_data.get("refresh_token"),
                "updated_at": now
            }}
        )
        user_id = existing_user["id"]
    else:
        # Create new user
        await db.users.insert_one(user_doc)
    
    # Return success with user info
    return {
        "success": True,
        "user_id": user_id,
        "athlete": {
            "id": athlete_data.get("id"),
            "name": f"{athlete_data.get('firstname', '')} {athlete_data.get('lastname', '')}".strip(),
            "email": athlete_data.get("email")
        }
    }

@app.get("/api/user/{user_id}")
async def get_user(user_id: str):
    """Get user information"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove sensitive data
    user.pop("access_token", None)
    user.pop("refresh_token", None)
    
    return user

@app.get("/api/user/{user_id}/activities")
async def get_user_activities(user_id: str, page: int = 1, per_page: int = 30):
    """Fetch and return user's Strava activities"""
    
    # Get user's access token
    user = await db.users.find_one({"id": user_id})
    if not user or not user.get("access_token"):
        raise HTTPException(status_code=404, detail="User not found or not authenticated")
    
    # Fetch activities from Strava
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.strava.com/api/v3/athlete/activities",
            headers={"Authorization": f"Bearer {user['access_token']}"},
            params={"page": page, "per_page": per_page}
        )
    
    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Strava token expired")
    elif response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch activities from Strava")
    
    activities_data = response.json()
    
    # Process and store activities
    activities = []
    for activity_data in activities_data:
        activity_id = str(uuid.uuid4())
        now = datetime.now()
        
        activity_doc = {
            "id": activity_id,
            "strava_id": activity_data.get("id"),
            "user_id": user_id,
            "name": activity_data.get("name"),
            "sport_type": activity_data.get("sport_type", activity_data.get("type")),
            "distance": activity_data.get("distance"),
            "moving_time": activity_data.get("moving_time"),
            "elapsed_time": activity_data.get("elapsed_time"),
            "total_elevation_gain": activity_data.get("total_elevation_gain"),
            "average_speed": activity_data.get("average_speed"),
            "max_speed": activity_data.get("max_speed"),
            "average_heartrate": activity_data.get("average_heartrate"),
            "max_heartrate": activity_data.get("max_heartrate"),
            "start_date": datetime.fromisoformat(activity_data.get("start_date").replace("Z", "+00:00")),
            "created_at": now
        }
        
        # Upsert activity (update if exists, insert if new)
        await db.activities.update_one(
            {"strava_id": activity_data.get("id"), "user_id": user_id},
            {"$set": activity_doc},
            upsert=True
        )
        
        activities.append(activity_doc)
    
    return {"activities": activities, "count": len(activities)}

@app.get("/api/user/{user_id}/dashboard")
async def get_dashboard_stats(user_id: str):
    """Get dashboard statistics for user"""
    
    # Verify user exists
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all activities for the user
    activities = await db.activities.find({"user_id": user_id}).to_list(length=None)
    
    if not activities:
        return DashboardStats(
            total_activities=0,
            total_distance=0.0,
            total_time=0,
            this_week_activities=0,
            this_week_distance=0.0,
            avg_speed=0.0,
            recent_activities=[]
        )
    
    # Calculate stats
    total_activities = len(activities)
    total_distance = sum(a.get("distance", 0) or 0 for a in activities)
    total_time = sum(a.get("moving_time", 0) or 0 for a in activities)
    
    # This week's activities
    week_start = datetime.now() - timedelta(days=7)
    this_week_activities = [a for a in activities if a.get("start_date", datetime.min) >= week_start]
    this_week_count = len(this_week_activities)
    this_week_distance = sum(a.get("distance", 0) or 0 for a in this_week_activities)
    
    # Average speed calculation
    avg_speed = 0.0
    if total_time > 0:
        avg_speed = total_distance / total_time
    
    # Recent activities (last 5)
    recent = sorted(activities, key=lambda x: x.get("start_date", datetime.min), reverse=True)[:5]
    recent_formatted = []
    
    for activity in recent:
        recent_formatted.append({
            "id": activity.get("id"),
            "name": activity.get("name"),
            "sport_type": activity.get("sport_type"),
            "distance": format_distance(activity.get("distance")),
            "time": format_time(activity.get("moving_time")),
            "speed": format_speed(activity.get("average_speed")),
            "date": activity.get("start_date").strftime("%Y-%m-%d") if activity.get("start_date") else "Unknown"
        })
    
    return DashboardStats(
        total_activities=total_activities,
        total_distance=round(total_distance / 1000, 1),  # Convert to km
        total_time=total_time,
        this_week_activities=this_week_count,
        this_week_distance=round(this_week_distance / 1000, 1),  # Convert to km
        avg_speed=round(avg_speed * 3.6, 1) if avg_speed > 0 else 0.0,  # Convert to km/h
        recent_activities=recent_formatted
    )

@app.delete("/api/user/{user_id}")
async def delete_user(user_id: str):
    """Delete user and all their data"""
    
    # Delete user's activities
    await db.activities.delete_many({"user_id": user_id})
    
    # Delete user
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User and all data deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)