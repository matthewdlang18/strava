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
import polyline
import json

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

class ActivityDetailed(BaseModel):
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
    
    # Enhanced fields
    polyline_map: Optional[str] = None
    summary_polyline: Optional[str] = None
    start_latlng: Optional[List[float]] = None
    end_latlng: Optional[List[float]] = None
    
    # Performance metrics
    average_cadence: Optional[float] = None
    average_watts: Optional[float] = None
    weighted_average_watts: Optional[int] = None
    kilojoules: Optional[float] = None
    device_watts: Optional[bool] = None
    has_heartrate: Optional[bool] = None
    
    # Additional details
    description: Optional[str] = None
    calories: Optional[float] = None
    has_kudos: Optional[bool] = None
    kudos_count: Optional[int] = None
    comment_count: Optional[int] = None
    photo_count: Optional[int] = None
    
    # Training metrics
    suffer_score: Optional[float] = None
    training_stress_score: Optional[float] = None
    intensity_factor: Optional[float] = None
    normalized_power: Optional[int] = None
    
    created_at: datetime

class ActivityLaps(BaseModel):
    id: str
    activity_id: str
    lap_index: int
    name: Optional[str] = None
    elapsed_time: Optional[int] = None
    moving_time: Optional[int] = None
    start_date: Optional[datetime] = None
    distance: Optional[float] = None
    start_index: Optional[int] = None
    end_index: Optional[int] = None
    total_elevation_gain: Optional[float] = None
    average_speed: Optional[float] = None
    max_speed: Optional[float] = None
    average_cadence: Optional[float] = None
    average_heartrate: Optional[float] = None
    max_heartrate: Optional[float] = None

class DashboardStats(BaseModel):
    total_activities: int
    total_distance: float
    total_time: int
    this_week_activities: int
    this_week_distance: float
    avg_speed: float
    recent_activities: List[Dict[str, Any]]
    
    # Enhanced stats
    total_elevation: float
    avg_heartrate: float
    max_heartrate: float
    activities_by_sport: Dict[str, int]
    monthly_distance: List[Dict[str, Any]]
    heartrate_zones: Dict[str, Any]

class ActivityStreams(BaseModel):
    time: Optional[List[int]] = None
    latlng: Optional[List[List[float]]] = None
    distance: Optional[List[float]] = None
    altitude: Optional[List[float]] = None
    velocity_smooth: Optional[List[float]] = None
    heartrate: Optional[List[int]] = None
    cadence: Optional[List[int]] = None
    watts: Optional[List[int]] = None
    temp: Optional[List[int]] = None
    moving: Optional[List[bool]] = None
    grade_smooth: Optional[List[float]] = None

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

def calculate_heartrate_zones(heartrate_data: List[int], max_hr: int = 200) -> Dict[str, Any]:
    """Calculate time spent in different heart rate zones"""
    if not heartrate_data:
        return {"zone1": 0, "zone2": 0, "zone3": 0, "zone4": 0, "zone5": 0}
    
    zones = {"zone1": 0, "zone2": 0, "zone3": 0, "zone4": 0, "zone5": 0}
    
    for hr in heartrate_data:
        if hr < max_hr * 0.6:
            zones["zone1"] += 1
        elif hr < max_hr * 0.7:
            zones["zone2"] += 1
        elif hr < max_hr * 0.8:
            zones["zone3"] += 1
        elif hr < max_hr * 0.9:
            zones["zone4"] += 1
        else:
            zones["zone5"] += 1
    
    # Convert to percentages
    total = sum(zones.values())
    if total > 0:
        for zone in zones:
            zones[zone] = round((zones[zone] / total) * 100, 1)
    
    return zones

def decode_polyline(encoded_polyline: str) -> List[List[float]]:
    """Decode Strava's polyline into lat/lng coordinates"""
    try:
        return polyline.decode(encoded_polyline)
    except:
        return []

# Routes
@app.get("/")
async def root():
    return {"message": "FitTracker Pro API - Your free Strava alternative with premium features"}

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
    
    # Redirect back to frontend with success data
    frontend_url = f"https://ca56087f-904a-47d2-9ebe-bb5f787bfe7e.preview.emergentagent.com"
    redirect_params = {
        "auth_success": "true",
        "user_id": user_id,
        "athlete_id": athlete_data.get("id"),
        "athlete_name": f"{athlete_data.get('firstname', '')} {athlete_data.get('lastname', '')}".strip()
    }
    
    # Create redirect URL with parameters
    redirect_url = f"{frontend_url}?{urlencode(redirect_params)}"
    return RedirectResponse(url=redirect_url)

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
async def get_user_activities(user_id: str, page: int = 1, per_page: int = 30, detailed: bool = False):
    """Fetch and return user's Strava activities with enhanced data"""
    
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
    
    # Process and store activities with enhanced data
    activities = []
    for activity_data in activities_data:
        activity_id = str(uuid.uuid4())
        now = datetime.now()
        
        # If detailed is requested, fetch full activity details
        if detailed:
            activity_detail_response = await client.get(
                f"https://www.strava.com/api/v3/activities/{activity_data.get('id')}",
                headers={"Authorization": f"Bearer {user['access_token']}"}
            )
            
            if activity_detail_response.status_code == 200:
                activity_data = activity_detail_response.json()
        
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
            
            # Enhanced fields
            "polyline_map": activity_data.get("map", {}).get("polyline"),
            "summary_polyline": activity_data.get("map", {}).get("summary_polyline"),
            "start_latlng": activity_data.get("start_latlng"),
            "end_latlng": activity_data.get("end_latlng"),
            
            # Performance metrics
            "average_cadence": activity_data.get("average_cadence"),
            "average_watts": activity_data.get("average_watts"),
            "weighted_average_watts": activity_data.get("weighted_average_watts"),
            "kilojoules": activity_data.get("kilojoules"),
            "device_watts": activity_data.get("device_watts"),
            "has_heartrate": activity_data.get("has_heartrate"),
            
            # Additional details
            "description": activity_data.get("description"),
            "calories": activity_data.get("calories"),
            "has_kudos": activity_data.get("has_kudos"),
            "kudos_count": activity_data.get("kudos_count"),
            "comment_count": activity_data.get("comment_count"),
            "photo_count": activity_data.get("photo_count"),
            
            # Training metrics
            "suffer_score": activity_data.get("suffer_score"),
            "training_stress_score": activity_data.get("training_stress_score"),
            "intensity_factor": activity_data.get("intensity_factor"),
            "normalized_power": activity_data.get("normalized_power"),
            
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

@app.get("/api/user/{user_id}/activity/{activity_id}/streams")
async def get_activity_streams(user_id: str, activity_id: int):
    """Get detailed streams data for an activity (GPS, heart rate, power, etc.)"""
    
    # Get user's access token
    user = await db.users.find_one({"id": user_id})
    if not user or not user.get("access_token"):
        raise HTTPException(status_code=404, detail="User not found or not authenticated")
    
    # Available stream types
    stream_types = "time,latlng,distance,altitude,velocity_smooth,heartrate,cadence,watts,temp,moving,grade_smooth"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://www.strava.com/api/v3/activities/{activity_id}/streams",
            headers={"Authorization": f"Bearer {user['access_token']}"},
            params={
                "keys": stream_types,
                "key_by_type": "true"
            }
        )
    
    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Strava token expired")
    elif response.status_code != 200:
        return {"streams": {}}
    
    streams_data = response.json()
    
    # Format streams data
    formatted_streams = {}
    for stream_type, stream_data in streams_data.items():
        if stream_data and stream_data.get("data"):
            formatted_streams[stream_type] = stream_data["data"]
    
    return {"streams": formatted_streams}

@app.get("/api/user/{user_id}/activity/{activity_id}/laps")
async def get_activity_laps(user_id: str, activity_id: int):
    """Get lap data for an activity"""
    
    # Get user's access token
    user = await db.users.find_one({"id": user_id})
    if not user or not user.get("access_token"):
        raise HTTPException(status_code=404, detail="User not found or not authenticated")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://www.strava.com/api/v3/activities/{activity_id}/laps",
            headers={"Authorization": f"Bearer {user['access_token']}"}
        )
    
    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Strava token expired")
    elif response.status_code != 200:
        return {"laps": []}
    
    laps_data = response.json()
    
    # Format and store laps
    formatted_laps = []
    for i, lap_data in enumerate(laps_data):
        lap_doc = {
            "id": str(uuid.uuid4()),
            "activity_id": str(activity_id),
            "lap_index": i + 1,
            "name": lap_data.get("name", f"Lap {i + 1}"),
            "elapsed_time": lap_data.get("elapsed_time"),
            "moving_time": lap_data.get("moving_time"),
            "start_date": datetime.fromisoformat(lap_data.get("start_date").replace("Z", "+00:00")) if lap_data.get("start_date") else None,
            "distance": lap_data.get("distance"),
            "start_index": lap_data.get("start_index"),
            "end_index": lap_data.get("end_index"),
            "total_elevation_gain": lap_data.get("total_elevation_gain"),
            "average_speed": lap_data.get("average_speed"),
            "max_speed": lap_data.get("max_speed"),
            "average_cadence": lap_data.get("average_cadence"),
            "average_heartrate": lap_data.get("average_heartrate"),
            "max_heartrate": lap_data.get("max_heartrate")
        }
        formatted_laps.append(lap_doc)
    
    return {"laps": formatted_laps}

@app.get("/api/user/{user_id}/dashboard")
async def get_dashboard_stats(user_id: str):
    """Get enhanced dashboard statistics for user"""
    
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
            recent_activities=[],
            total_elevation=0.0,
            avg_heartrate=0.0,
            max_heartrate=0.0,
            activities_by_sport={},
            monthly_distance=[],
            heartrate_zones={}
        )
    
    # Calculate basic stats
    total_activities = len(activities)
    total_distance = sum(a.get("distance", 0) or 0 for a in activities)
    total_time = sum(a.get("moving_time", 0) or 0 for a in activities)
    total_elevation = sum(a.get("total_elevation_gain", 0) or 0 for a in activities)
    
    # Heart rate stats
    hr_activities = [a for a in activities if a.get("average_heartrate")]
    avg_heartrate = sum(a.get("average_heartrate", 0) for a in hr_activities) / len(hr_activities) if hr_activities else 0
    max_heartrate = max((a.get("max_heartrate", 0) for a in activities), default=0)
    
    # This week's activities
    week_start = datetime.now() - timedelta(days=7)
    this_week_activities = [a for a in activities if a.get("start_date", datetime.min) >= week_start]
    this_week_count = len(this_week_activities)
    this_week_distance = sum(a.get("distance", 0) or 0 for a in this_week_activities)
    
    # Average speed calculation
    avg_speed = 0.0
    if total_time > 0:
        avg_speed = total_distance / total_time
    
    # Activities by sport type
    activities_by_sport = {}
    for activity in activities:
        sport = activity.get("sport_type", "Unknown")
        activities_by_sport[sport] = activities_by_sport.get(sport, 0) + 1
    
    # Monthly distance for the last 12 months
    monthly_distance = []
    for i in range(12):
        month_start = datetime.now().replace(day=1) - timedelta(days=i*30)
        month_end = month_start + timedelta(days=30)
        month_activities = [a for a in activities if month_start <= a.get("start_date", datetime.min) < month_end]
        month_dist = sum(a.get("distance", 0) or 0 for a in month_activities) / 1000  # Convert to km
        monthly_distance.append({
            "month": month_start.strftime("%b %Y"),
            "distance": round(month_dist, 1)
        })
    
    monthly_distance.reverse()  # Chronological order
    
    # Heart rate zones (mock calculation - in real implementation, you'd use streams data)
    heartrate_zones = {
        "zone1": 25.0,  # Recovery
        "zone2": 35.0,  # Aerobic Base
        "zone3": 20.0,  # Aerobic
        "zone4": 15.0,  # Threshold
        "zone5": 5.0    # VO2 Max
    }
    
    # Recent activities (last 5)
    recent = sorted(activities, key=lambda x: x.get("start_date", datetime.min), reverse=True)[:5]
    recent_formatted = []
    
    for activity in recent:
        recent_formatted.append({
            "id": activity.get("id"),
            "strava_id": activity.get("strava_id"),
            "name": activity.get("name"),
            "sport_type": activity.get("sport_type"),
            "distance": format_distance(activity.get("distance")),
            "time": format_time(activity.get("moving_time")),
            "speed": format_speed(activity.get("average_speed")),
            "elevation": f"{activity.get('total_elevation_gain', 0):.0f}m" if activity.get('total_elevation_gain') else "0m",
            "heartrate": f"{activity.get('average_heartrate', 0):.0f} bpm" if activity.get('average_heartrate') else None,
            "date": activity.get("start_date").strftime("%Y-%m-%d") if activity.get("start_date") else "Unknown",
            "has_map": bool(activity.get("polyline_map") or activity.get("summary_polyline"))
        })
    
    return DashboardStats(
        total_activities=total_activities,
        total_distance=round(total_distance / 1000, 1),  # Convert to km
        total_time=total_time,
        this_week_activities=this_week_count,
        this_week_distance=round(this_week_distance / 1000, 1),  # Convert to km
        avg_speed=round(avg_speed * 3.6, 1) if avg_speed > 0 else 0.0,  # Convert to km/h
        recent_activities=recent_formatted,
        total_elevation=round(total_elevation, 1),
        avg_heartrate=round(avg_heartrate, 1) if avg_heartrate > 0 else 0.0,
        max_heartrate=max_heartrate,
        activities_by_sport=activities_by_sport,
        monthly_distance=monthly_distance,
        heartrate_zones=heartrate_zones
    )

@app.get("/api/user/{user_id}/activity/{strava_id}")
async def get_activity_detail(user_id: str, strava_id: int):
    """Get detailed information for a specific activity"""
    
    # Check if activity exists in our database
    activity = await db.activities.find_one({"strava_id": strava_id, "user_id": user_id})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Get user's access token for fresh data
    user = await db.users.find_one({"id": user_id})
    if not user or not user.get("access_token"):
        raise HTTPException(status_code=404, detail="User not found or not authenticated")
    
    # Fetch detailed activity data from Strava
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://www.strava.com/api/v3/activities/{strava_id}",
            headers={"Authorization": f"Bearer {user['access_token']}"}
        )
    
    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Strava token expired")
    elif response.status_code != 200:
        # Return cached data if Strava API fails
        return {"activity": activity}
    
    activity_data = response.json()
    
    # Decode polyline if available
    route_coordinates = []
    if activity_data.get("map", {}).get("polyline"):
        route_coordinates = decode_polyline(activity_data["map"]["polyline"])
    elif activity_data.get("map", {}).get("summary_polyline"):
        route_coordinates = decode_polyline(activity_data["map"]["summary_polyline"])
    
    # Enhanced activity data
    enhanced_activity = {
        **activity,
        "route_coordinates": route_coordinates,
        "detailed_stats": {
            "calories": activity_data.get("calories"),
            "device_watts": activity_data.get("device_watts"),
            "has_heartrate": activity_data.get("has_heartrate"),
            "workout_type": activity_data.get("workout_type"),
            "gear_id": activity_data.get("gear_id"),
            "external_id": activity_data.get("external_id"),
            "upload_id": activity_data.get("upload_id"),
            "achievement_count": activity_data.get("achievement_count"),
            "pr_count": activity_data.get("pr_count"),
            "segment_efforts": len(activity_data.get("segment_efforts", [])),
        },
        "social_stats": {
            "kudos_count": activity_data.get("kudos_count", 0),
            "comment_count": activity_data.get("comment_count", 0),
            "athlete_count": activity_data.get("athlete_count", 1),
            "photo_count": activity_data.get("total_photo_count", 0)
        }
    }
    
    return {"activity": enhanced_activity}

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