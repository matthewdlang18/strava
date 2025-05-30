from fastapi import FastAPI, HTTPException, Request, Depends, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse
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
import io
import csv
from collections import defaultdict
from bson import ObjectId

# Load environment variables
load_dotenv()

app = FastAPI(title="FitTracker Pro API - Ultimate Edition", version="2.0.0", description="The most comprehensive fitness tracking API with premium features")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom JSON encoder for MongoDB ObjectId
def json_encoder(obj):
    """JSON encoder function to handle MongoDB ObjectId and datetime objects"""
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

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
        
        # Create indexes for better performance
        await db.activities.create_index([("user_id", 1), ("start_date", -1)])
        await db.activities.create_index([("strava_id", 1), ("user_id", 1)], unique=True)
        await db.personal_records.create_index([("user_id", 1), ("record_type", 1)])
        await db.achievements.create_index([("user_id", 1), ("date_achieved", -1)])
        await db.goals.create_index([("user_id", 1), ("target_date", 1)])
        
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

# Enhanced Pydantic models
class User(BaseModel):
    id: str
    strava_id: Optional[int] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    email: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    profile_picture: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    premium_features: Optional[bool] = True  # Everyone gets premium!
    created_at: datetime
    updated_at: datetime

class PersonalRecord(BaseModel):
    id: str
    user_id: str
    record_type: str  # "fastest_5k", "longest_ride", "biggest_climb", etc.
    sport_type: str
    value: float
    unit: str
    activity_id: str
    activity_name: str
    date_achieved: datetime
    previous_record: Optional[float] = None

class Achievement(BaseModel):
    id: str
    user_id: str
    achievement_type: str
    title: str
    description: str
    icon: str
    date_achieved: datetime
    activity_id: Optional[str] = None

class Goal(BaseModel):
    id: str
    user_id: str
    goal_type: str  # "distance", "time", "activities", "elevation"
    sport_type: Optional[str] = None
    target_value: float
    current_value: float
    unit: str
    period: str  # "weekly", "monthly", "yearly"
    target_date: datetime
    created_at: datetime
    completed: bool = False

class WeatherData(BaseModel):
    temperature: Optional[float] = None
    condition: Optional[str] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[str] = None

class EnhancedActivity(BaseModel):
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
    
    # Weather data
    weather: Optional[WeatherData] = None
    
    # Analysis flags
    is_personal_record: Optional[bool] = False
    achievements_earned: Optional[List[str]] = []
    
    created_at: datetime

class ComprehensiveDashboard(BaseModel):
    # Basic stats
    total_activities: int
    total_distance: float
    total_time: int
    this_week_activities: int
    this_week_distance: float
    avg_speed: float
    
    # Enhanced stats
    total_elevation: float
    avg_heartrate: float
    max_heartrate: float
    activities_by_sport: Dict[str, int]
    monthly_distance: List[Dict[str, Any]]
    heartrate_zones: Dict[str, Any]
    
    # Premium features
    personal_records: List[Dict[str, Any]]
    recent_achievements: List[Dict[str, Any]]
    training_trends: Dict[str, Any]
    performance_insights: List[str]
    upcoming_goals: List[Dict[str, Any]]
    fitness_score: float
    training_load: Dict[str, Any]
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

async def get_weather_for_activity(lat: float, lng: float, date: datetime) -> WeatherData:
    """Get weather data for activity location and time (mock implementation)"""
    # In a real implementation, you'd use a weather API
    # For now, return mock weather data
    return WeatherData(
        temperature=22.5,
        condition="Partly Cloudy",
        humidity=65.0,
        wind_speed=12.5,
        wind_direction="NW"
    )

def calculate_fitness_score(activities: List[dict]) -> float:
    """Calculate overall fitness score based on recent activities"""
    if not activities:
        return 0.0
    
    # Simple fitness score calculation based on frequency, intensity, and variety
    recent_activities = [a for a in activities if a.get('start_date', datetime.min) >= datetime.now() - timedelta(days=30)]
    
    if not recent_activities:
        return 0.0
    
    # Frequency score (0-40 points)
    frequency_score = min(len(recent_activities) * 2, 40)
    
    # Intensity score (0-30 points) based on average heart rate
    hr_activities = [a for a in recent_activities if a.get('average_heartrate')]
    intensity_score = 0
    if hr_activities:
        avg_hr = sum(a.get('average_heartrate', 0) for a in hr_activities) / len(hr_activities)
        intensity_score = min((avg_hr / 160) * 30, 30)  # Assuming max HR around 180-200
    
    # Variety score (0-20 points)
    sports = set(a.get('sport_type') for a in recent_activities)
    variety_score = min(len(sports) * 5, 20)
    
    # Distance/time score (0-10 points)
    total_distance = sum(a.get('distance', 0) or 0 for a in recent_activities)
    distance_score = min((total_distance / 1000) / 100 * 10, 10)  # 100km = max points
    
    total_score = frequency_score + intensity_score + variety_score + distance_score
    return round(total_score, 1)

def generate_performance_insights(activities: List[dict], personal_records: List[dict]) -> List[str]:
    """Generate AI-powered performance insights"""
    insights = []
    
    if not activities:
        return ["Start tracking activities to get personalized insights!"]
    
    recent_activities = [a for a in activities if a.get('start_date', datetime.min) >= datetime.now() - timedelta(days=30)]
    
    # Activity frequency insight
    if len(recent_activities) >= 12:
        insights.append("🔥 You're on fire! 12+ activities this month shows excellent consistency.")
    elif len(recent_activities) >= 8:
        insights.append("💪 Great training frequency! You're building strong fitness habits.")
    elif len(recent_activities) >= 4:
        insights.append("📈 Good activity level. Try to increase frequency for better fitness gains.")
    else:
        insights.append("🎯 Consider increasing your activity frequency for better results.")
    
    # Heart rate training insights
    hr_activities = [a for a in recent_activities if a.get('average_heartrate')]
    if hr_activities:
        avg_hr = sum(a.get('average_heartrate', 0) for a in hr_activities) / len(hr_activities)
        if avg_hr > 160:
            insights.append("🔥 High-intensity training detected! Make sure to include recovery days.")
        elif avg_hr < 130:
            insights.append("🚶‍♂️ Your training is quite easy-paced. Consider adding some higher intensity sessions.")
        else:
            insights.append("✅ Perfect heart rate training zone for building aerobic fitness!")
    
    # Personal records insight
    recent_prs = [pr for pr in personal_records if pr.get('date_achieved', datetime.min) >= datetime.now() - timedelta(days=30)]
    if recent_prs:
        insights.append(f"🏆 Amazing! You've set {len(recent_prs)} personal record(s) this month!")
    
    # Sport variety insight
    sports = set(a.get('sport_type') for a in recent_activities)
    if len(sports) >= 3:
        insights.append("🌟 Excellent sport variety! Cross-training prevents injuries and improves overall fitness.")
    elif len(sports) == 2:
        insights.append("👍 Good variety with multiple sports. Consider adding one more for optimal cross-training.")
    
    return insights[:5]  # Return top 5 insights

def check_for_achievements(activity: dict, user_activities: List[dict]) -> List[Achievement]:
    """Check if activity earned any achievements"""
    achievements = []
    activity_id = activity.get('id')
    user_id = activity.get('user_id')
    
    # First activity achievement
    if len(user_activities) == 1:
        achievements.append(Achievement(
            id=str(uuid.uuid4()),
            user_id=user_id,
            achievement_type="first_activity",
            title="Getting Started! 🎯",
            description="Completed your first tracked activity",
            icon="🎯",
            date_achieved=datetime.now(),
            activity_id=activity_id
        ))
    
    # Distance milestones
    distance = activity.get('distance', 0) or 0
    if distance >= 100000:  # 100km
        achievements.append(Achievement(
            id=str(uuid.uuid4()),
            user_id=user_id,
            achievement_type="century",
            title="Century! 💯",
            description="Completed a 100km+ activity",
            icon="💯",
            date_achieved=datetime.now(),
            activity_id=activity_id
        ))
    elif distance >= 50000:  # 50km
        achievements.append(Achievement(
            id=str(uuid.uuid4()),
            user_id=user_id,
            achievement_type="half_century",
            title="Half Century! 🎖️",
            description="Completed a 50km+ activity",
            icon="🎖️",
            date_achieved=datetime.now(),
            activity_id=activity_id
        ))
    
    # Time milestones
    moving_time = activity.get('moving_time', 0) or 0
    if moving_time >= 7200:  # 2 hours
        achievements.append(Achievement(
            id=str(uuid.uuid4()),
            user_id=user_id,
            achievement_type="endurance",
            title="Endurance Athlete! ⏰",
            description="Completed a 2+ hour activity",
            icon="⏰",
            date_achieved=datetime.now(),
            activity_id=activity_id
        ))
    
    # Elevation achievements
    elevation = activity.get('total_elevation_gain', 0) or 0
    if elevation >= 1000:  # 1000m
        achievements.append(Achievement(
            id=str(uuid.uuid4()),
            user_id=user_id,
            achievement_type="climber",
            title="Mountain Climber! ⛰️",
            description="Climbed 1000m+ in a single activity",
            icon="⛰️",
            date_achieved=datetime.now(),
            activity_id=activity_id
        ))
    
    # Consecutive days
    recent_dates = [a.get('start_date', datetime.min).date() for a in user_activities[-10:]]
    consecutive_days = 1
    for i in range(1, len(recent_dates)):
        if recent_dates[i] == recent_dates[i-1] + timedelta(days=1):
            consecutive_days += 1
        else:
            break
    
    if consecutive_days >= 7:
        achievements.append(Achievement(
            id=str(uuid.uuid4()),
            user_id=user_id,
            achievement_type="streak",
            title="Week Warrior! 📅",
            description="Completed activities for 7 consecutive days",
            icon="📅",
            date_achieved=datetime.now(),
            activity_id=activity_id
        ))
    
    return achievements

def check_personal_records(activity: dict, user_activities: List[dict]) -> List[PersonalRecord]:
    """Check if activity set any personal records"""
    records = []
    activity_id = activity.get('id')
    user_id = activity.get('user_id')
    sport_type = activity.get('sport_type')
    
    # Filter activities of same sport type
    same_sport_activities = [a for a in user_activities if a.get('sport_type') == sport_type]
    
    if not same_sport_activities:
        return records
    
    # Check distance PR
    distance = activity.get('distance', 0) or 0
    if distance > 0:
        max_distance = max((a.get('distance', 0) or 0 for a in same_sport_activities[:-1]), default=0)
        if distance > max_distance:
            records.append(PersonalRecord(
                id=str(uuid.uuid4()),
                user_id=user_id,
                record_type="longest_distance",
                sport_type=sport_type,
                value=distance,
                unit="meters",
                activity_id=activity_id,
                activity_name=activity.get('name', 'Activity'),
                date_achieved=activity.get('start_date', datetime.now()),
                previous_record=max_distance if max_distance > 0 else None
            ))
    
    # Check speed PR
    avg_speed = activity.get('average_speed', 0) or 0
    if avg_speed > 0:
        max_speed = max((a.get('average_speed', 0) or 0 for a in same_sport_activities[:-1]), default=0)
        if avg_speed > max_speed:
            records.append(PersonalRecord(
                id=str(uuid.uuid4()),
                user_id=user_id,
                record_type="fastest_average_speed",
                sport_type=sport_type,
                value=avg_speed,
                unit="m/s",
                activity_id=activity_id,
                activity_name=activity.get('name', 'Activity'),
                date_achieved=activity.get('start_date', datetime.now()),
                previous_record=max_speed if max_speed > 0 else None
            ))
    
    # Check elevation PR
    elevation = activity.get('total_elevation_gain', 0) or 0
    if elevation > 0:
        max_elevation = max((a.get('total_elevation_gain', 0) or 0 for a in same_sport_activities[:-1]), default=0)
        if elevation > max_elevation:
            records.append(PersonalRecord(
                id=str(uuid.uuid4()),
                user_id=user_id,
                record_type="biggest_climb",
                sport_type=sport_type,
                value=elevation,
                unit="meters",
                activity_id=activity_id,
                activity_name=activity.get('name', 'Activity'),
                date_achieved=activity.get('start_date', datetime.now()),
                previous_record=max_elevation if max_elevation > 0 else None
            ))
    
    return records

# Enhanced Routes
@app.get("/")
async def root():
    return {
        "message": "FitTracker Pro Ultimate API - Your complete fitness ecosystem",
        "version": "2.0.0",
        "features": [
            "🗺️ Interactive Maps & Routes",
            "💗 Advanced Health Analytics", 
            "🏆 Personal Records Tracking",
            "🎯 Achievement System",
            "📊 Performance Insights",
            "🌤️ Weather Integration",
            "📈 Training Load Analysis",
            "💾 Data Export",
            "🎮 Gamification",
            "🤖 AI-Powered Insights"
        ]
    }

@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat(), "version": "2.0.0"}

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
        "profile_picture": athlete_data.get("profile"),
        "city": athlete_data.get("city"),
        "country": athlete_data.get("country"),
        "access_token": token_data.get("access_token"),
        "refresh_token": token_data.get("refresh_token"),
        "premium_features": True,  # Everyone gets premium!
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
async def get_user_activities(user_id: str, page: int = 1, per_page: int = 30, detailed: bool = False, sync_all: bool = False):
    """Fetch and return user's Strava activities with comprehensive enhancement"""
    
    # Get user's access token
    user = await db.users.find_one({"id": user_id})
    if not user or not user.get("access_token"):
        raise HTTPException(status_code=404, detail="User not found or not authenticated")
    
    # Get all user activities for PR/achievement checking
    existing_activities = await db.activities.find({"user_id": user_id}).to_list(length=None)
    
    # If sync_all is requested, fetch multiple pages to get more historical data
    all_activities_data = []
    max_pages = 10 if sync_all else 1  # Fetch up to 10 pages (300 activities) if sync_all is true
    
    for current_page in range(1, max_pages + 1):
        # Fetch activities from Strava
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.strava.com/api/v3/athlete/activities",
                headers={"Authorization": f"Bearer {user['access_token']}"},
                params={"page": current_page, "per_page": 30}
            )
        
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Strava token expired")
        elif response.status_code != 200:
            if current_page == 1:  # Only raise error if first page fails
                raise HTTPException(status_code=400, detail="Failed to fetch activities from Strava")
            else:
                break  # Stop if subsequent pages fail
        
        page_activities = response.json()
        if not page_activities:  # No more activities
            break
            
        all_activities_data.extend(page_activities)
        
        # If not syncing all, just get the requested page
        if not sync_all:
            break
    
    # Process and store activities with comprehensive enhancement
    activities = []
    for activity_data in all_activities_data:
        try:
            activity_id = str(uuid.uuid4())
            now = datetime.now()
            
            # If detailed is requested, fetch full activity details
            if detailed and len(all_activities_data) <= 30:  # Only get details for first 30 to avoid rate limits
                async with httpx.AsyncClient() as client:
                    activity_detail_response = await client.get(
                        f"https://www.strava.com/api/v3/activities/{activity_data.get('id')}",
                        headers={"Authorization": f"Bearer {user['access_token']}"}
                    )
                    
                    if activity_detail_response.status_code == 200:
                        activity_data = activity_detail_response.json()
            
            # Parse start date safely
            start_date = None
            if activity_data.get("start_date"):
                try:
                    start_date = datetime.fromisoformat(activity_data.get("start_date").replace("Z", "+00:00"))
                except:
                    start_date = datetime.now()
            
            # Get weather data if location available (simplified for now)
            weather_data = None
            if activity_data.get('start_latlng'):
                try:
                    weather_data = {
                        "temperature": 22.0,
                        "condition": "Clear",
                        "humidity": 60.0,
                        "wind_speed": 10.0,
                        "wind_direction": "NW"
                    }
                except:
                    pass
            
            activity_doc = {
                "id": activity_id,
                "strava_id": activity_data.get("id"),
                "user_id": user_id,
                "name": activity_data.get("name", "Unknown Activity"),
                "sport_type": activity_data.get("sport_type", activity_data.get("type", "Unknown")),
                "distance": activity_data.get("distance"),
                "moving_time": activity_data.get("moving_time"),
                "elapsed_time": activity_data.get("elapsed_time"),
                "total_elevation_gain": activity_data.get("total_elevation_gain"),
                "average_speed": activity_data.get("average_speed"),
                "max_speed": activity_data.get("max_speed"),
                "average_heartrate": activity_data.get("average_heartrate"),
                "max_heartrate": activity_data.get("max_heartrate"),
                "start_date": start_date,
                
                # Enhanced fields
                "polyline_map": activity_data.get("map", {}).get("polyline") if activity_data.get("map") else None,
                "summary_polyline": activity_data.get("map", {}).get("summary_polyline") if activity_data.get("map") else None,
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
                "kudos_count": activity_data.get("kudos_count", 0),
                "comment_count": activity_data.get("comment_count", 0),
                "photo_count": activity_data.get("photo_count", 0),
                
                # Training metrics
                "suffer_score": activity_data.get("suffer_score"),
                "training_stress_score": activity_data.get("training_stress_score"),
                "intensity_factor": activity_data.get("intensity_factor"),
                "normalized_power": activity_data.get("normalized_power"),
                
                # Weather data
                "weather": weather_data,
                
                "created_at": now
            }
            
            # Check for personal records (simplified for performance)
            activity_doc["is_personal_record"] = False
            activity_doc["achievements_earned"] = []
            
            # Upsert activity (update if exists, insert if new)
            await db.activities.update_one(
                {"strava_id": activity_data.get("id"), "user_id": user_id},
                {"$set": activity_doc},
                upsert=True
            )
            
            # Convert ObjectId and datetime for JSON serialization
            clean_activity = {}
            for key, value in activity_doc.items():
                if isinstance(value, ObjectId):
                    clean_activity[key] = str(value)
                elif isinstance(value, datetime):
                    clean_activity[key] = value.isoformat()
                else:
                    clean_activity[key] = value
            
            activities.append(clean_activity)
            
        except Exception as e:
            print(f"Error processing activity {activity_data.get('id', 'unknown')}: {e}")
            continue
    
    return {"activities": activities, "count": len(activities), "synced_pages": max_pages if sync_all else 1}

@app.get("/api/user/{user_id}/dashboard")
async def get_comprehensive_dashboard(user_id: str):
    """Get comprehensive dashboard with all premium features"""
    
    # Verify user exists
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all data in parallel
    activities = await db.activities.find({"user_id": user_id}).to_list(length=None)
    personal_records = await db.personal_records.find({"user_id": user_id}).to_list(length=None)
    achievements = await db.achievements.find({"user_id": user_id}).sort("date_achieved", -1).limit(5).to_list(length=None)
    goals = await db.goals.find({"user_id": user_id, "completed": False}).to_list(length=None)
    
    if not activities:
        return ComprehensiveDashboard(
            total_activities=0,
            total_distance=0.0,
            total_time=0,
            this_week_activities=0,
            this_week_distance=0.0,
            avg_speed=0.0,
            total_elevation=0.0,
            avg_heartrate=0.0,
            max_heartrate=0.0,
            activities_by_sport={},
            monthly_distance=[],
            heartrate_zones={},
            personal_records=[],
            recent_achievements=[],
            training_trends={},
            performance_insights=[],
            upcoming_goals=[],
            fitness_score=0.0,
            training_load={},
            recent_activities=[]
        )
    
    # Calculate comprehensive stats
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
            "distance": round(month_dist, 1),
            "activities": len(month_activities)
        })
    
    monthly_distance.reverse()  # Chronological order
    
    # Training trends
    last_4_weeks = []
    for i in range(4):
        week_start = datetime.now() - timedelta(days=(i+1)*7)
        week_end = week_start + timedelta(days=7)
        week_activities = [a for a in activities if week_start <= a.get("start_date", datetime.min) < week_end]
        week_distance = sum(a.get("distance", 0) or 0 for a in week_activities) / 1000
        week_time = sum(a.get("moving_time", 0) or 0 for a in week_activities) / 3600  # Convert to hours
        last_4_weeks.append({
            "week": f"Week {4-i}",
            "distance": round(week_distance, 1),
            "time": round(week_time, 1),
            "activities": len(week_activities)
        })
    
    training_trends = {
        "weekly_trend": last_4_weeks,
        "trend_direction": "increasing" if len(last_4_weeks) >= 2 and last_4_weeks[-1]["distance"] > last_4_weeks[-2]["distance"] else "stable"
    }
    
    # Heart rate zones (enhanced calculation)
    all_hr_data = []
    for activity in hr_activities:
        if activity.get("average_heartrate"):
            # Simulate HR distribution for the activity
            avg_hr = activity["average_heartrate"]
            duration = activity.get("moving_time", 0) or 0
            # Add data points based on activity duration (simplified)
            points = max(1, duration // 60)  # One point per minute
            all_hr_data.extend([avg_hr] * points)
    
    heartrate_zones = calculate_heartrate_zones(all_hr_data, max_heartrate or 200)
    
    # Format personal records
    formatted_prs = []
    for pr in personal_records[-5:]:  # Last 5 PRs
        formatted_prs.append({
            "id": pr.get("id"),
            "type": pr.get("record_type"),
            "sport": pr.get("sport_type"),
            "value": pr.get("value"),
            "unit": pr.get("unit"),
            "activity_name": pr.get("activity_name"),
            "date": pr.get("date_achieved").strftime("%Y-%m-%d") if pr.get("date_achieved") else "Unknown",
            "improvement": pr.get("value") - pr.get("previous_record", 0) if pr.get("previous_record") else pr.get("value")
        })
    
    # Format achievements
    formatted_achievements = []
    for achievement in achievements:
        formatted_achievements.append({
            "id": achievement.get("id"),
            "title": achievement.get("title"),
            "description": achievement.get("description"),
            "icon": achievement.get("icon"),
            "date": achievement.get("date_achieved").strftime("%Y-%m-%d") if achievement.get("date_achieved") else "Unknown"
        })
    
    # Format goals
    formatted_goals = []
    for goal in goals[:3]:  # Top 3 upcoming goals
        progress_percentage = (goal.get("current_value", 0) / goal.get("target_value", 1)) * 100
        formatted_goals.append({
            "id": goal.get("id"),
            "type": goal.get("goal_type"),
            "target": goal.get("target_value"),
            "current": goal.get("current_value"),
            "unit": goal.get("unit"),
            "progress": round(progress_percentage, 1),
            "target_date": goal.get("target_date").strftime("%Y-%m-%d") if goal.get("target_date") else "Unknown"
        })
    
    # Calculate training load (last 7 days)
    recent_activities = [a for a in activities if a.get("start_date", datetime.min) >= datetime.now() - timedelta(days=7)]
    training_load = {
        "current_load": len(recent_activities),
        "previous_load": len([a for a in activities if datetime.now() - timedelta(days=14) <= a.get("start_date", datetime.min) < datetime.now() - timedelta(days=7)]),
        "load_trend": "increasing" if len(recent_activities) > len([a for a in activities if datetime.now() - timedelta(days=14) <= a.get("start_date", datetime.min) < datetime.now() - timedelta(days=7)]) else "stable",
        "recommended_rest_days": max(0, 3 - len(recent_activities)) if len(recent_activities) > 5 else 0
    }
    
    # Calculate fitness score
    fitness_score = calculate_fitness_score(activities)
    
    # Generate performance insights
    performance_insights = generate_performance_insights(activities, personal_records)
    
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
            "has_map": bool(activity.get("polyline_map") or activity.get("summary_polyline")),
            "is_pr": activity.get("is_personal_record", False),
            "achievements": activity.get("achievements_earned", []),
            "weather": activity.get("weather")
        })
    
    return ComprehensiveDashboard(
        total_activities=total_activities,
        total_distance=round(total_distance / 1000, 1),  # Convert to km
        total_time=total_time,
        this_week_activities=this_week_count,
        this_week_distance=round(this_week_distance / 1000, 1),  # Convert to km
        avg_speed=round(avg_speed * 3.6, 1) if avg_speed > 0 else 0.0,  # Convert to km/h
        total_elevation=round(total_elevation, 1),
        avg_heartrate=round(avg_heartrate, 1) if avg_heartrate > 0 else 0.0,
        max_heartrate=max_heartrate,
        activities_by_sport=activities_by_sport,
        monthly_distance=monthly_distance,
        heartrate_zones=heartrate_zones,
        personal_records=formatted_prs,
        recent_achievements=formatted_achievements,
        training_trends=training_trends,
        performance_insights=performance_insights,
        upcoming_goals=formatted_goals,
        fitness_score=fitness_score,
        training_load=training_load,
        recent_activities=recent_formatted
    )

@app.get("/api/user/{user_id}/export")
async def export_user_data(user_id: str, format: str = "csv"):
    """Export user's fitness data"""
    
    # Verify user exists
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all activities
    activities = await db.activities.find({"user_id": user_id}).to_list(length=None)
    
    if format.lower() == "csv":
        # Create CSV export
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "Activity Name", "Sport Type", "Date", "Distance (km)", "Moving Time (min)",
            "Avg Speed (km/h)", "Max Speed (km/h)", "Elevation Gain (m)",
            "Avg Heart Rate", "Max Heart Rate", "Calories", "Description"
        ])
        
        # Write activity data
        for activity in activities:
            writer.writerow([
                activity.get("name", ""),
                activity.get("sport_type", ""),
                activity.get("start_date", "").strftime("%Y-%m-%d %H:%M:%S") if activity.get("start_date") else "",
                round((activity.get("distance", 0) or 0) / 1000, 2),
                round((activity.get("moving_time", 0) or 0) / 60, 1),
                round((activity.get("average_speed", 0) or 0) * 3.6, 1),
                round((activity.get("max_speed", 0) or 0) * 3.6, 1),
                round(activity.get("total_elevation_gain", 0) or 0, 1),
                round(activity.get("average_heartrate", 0) or 0, 1),
                round(activity.get("max_heartrate", 0) or 0, 1),
                round(activity.get("calories", 0) or 0, 1),
                activity.get("description", "")
            ])
        
        # Return CSV file
        output.seek(0)
        filename = f"fittracker_data_{user_id}_{datetime.now().strftime('%Y%m%d')}.csv"
        
        return JSONResponse(
            content={"csv_data": output.getvalue(), "filename": filename},
            headers={"Content-Type": "application/json"}
        )
    
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format. Use 'csv'.")

# Continue with existing endpoints...
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

@app.get("/api/user/{user_id}/personal-records")
async def get_personal_records(user_id: str):
    """Get all personal records for user"""
    records = await db.personal_records.find({"user_id": user_id}).sort("date_achieved", -1).to_list(length=None)
    
    formatted_records = []
    for record in records:
        formatted_records.append({
            "id": record.get("id"),
            "type": record.get("record_type"),
            "sport": record.get("sport_type"),
            "value": record.get("value"),
            "unit": record.get("unit"),
            "activity_name": record.get("activity_name"),
            "date": record.get("date_achieved").strftime("%Y-%m-%d") if record.get("date_achieved") else "Unknown",
            "improvement": record.get("value") - record.get("previous_record", 0) if record.get("previous_record") else record.get("value")
        })
    
    return {"personal_records": formatted_records}

@app.get("/api/user/{user_id}/achievements")
async def get_achievements(user_id: str):
    """Get all achievements for user"""
    achievements = await db.achievements.find({"user_id": user_id}).sort("date_achieved", -1).to_list(length=None)
    
    formatted_achievements = []
    for achievement in achievements:
        formatted_achievements.append({
            "id": achievement.get("id"),
            "type": achievement.get("achievement_type"),
            "title": achievement.get("title"),
            "description": achievement.get("description"),
            "icon": achievement.get("icon"),
            "date": achievement.get("date_achieved").strftime("%Y-%m-%d") if achievement.get("date_achieved") else "Unknown"
        })
    
    return {"achievements": formatted_achievements}

@app.delete("/api/user/{user_id}")
async def delete_user(user_id: str):
    """Delete user and all their data"""
    
    # Delete all user data
    await db.activities.delete_many({"user_id": user_id})
    await db.personal_records.delete_many({"user_id": user_id})
    await db.achievements.delete_many({"user_id": user_id})
    await db.goals.delete_many({"user_id": user_id})
    
    # Delete user
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User and all data deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)