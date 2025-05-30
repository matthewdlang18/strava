import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityStreams, setActivityStreams] = useState(null);
  const [activityLaps, setActivityLaps] = useState(null);
  const [currentView, setCurrentView] = useState('welcome'); // welcome, dashboard, activities, activity-detail

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem('fittracker_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setCurrentView('dashboard');
      loadDashboardData(userData.user_id);
    }
  }, []);

  const handleStravaSuccess = async (userId, athleteId, athleteName) => {
    try {
      setIsLoading(true);
      const userData = {
        user_id: userId,
        athlete: {
          id: athleteId,
          name: athleteName
        }
      };
      setUser(userData);
      localStorage.setItem('fittracker_user', JSON.stringify(userData));
      setCurrentView('dashboard');
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Load dashboard data
      await loadDashboardData(userId);
    } catch (error) {
      console.error('Failed to complete Strava authentication:', error);
      alert('Failed to authenticate with Strava. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Strava OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth_success');
    const userId = urlParams.get('user_id');
    const athleteId = urlParams.get('athlete_id');
    const athleteName = urlParams.get('athlete_name');
    
    if (authSuccess === 'true' && userId) {
      handleStravaSuccess(userId, athleteId, athleteName);
    } else {
      // Legacy callback handling for direct OAuth codes
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state) {
        handleStravaCallback(code, state);
      }
    }
  }, []);

  const handleStravaLogin = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/strava`);
      const data = await response.json();
      
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error('Failed to initiate Strava login:', error);
      alert('Failed to connect to Strava. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStravaCallback = async (code, state) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/strava/callback?code=${code}&state=${state}`);
      const data = await response.json();
      
      if (data.success) {
        const userData = {
          user_id: data.user_id,
          athlete: data.athlete
        };
        setUser(userData);
        localStorage.setItem('fittracker_user', JSON.stringify(userData));
        setCurrentView('dashboard');
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Load dashboard data
        await loadDashboardData(data.user_id);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Failed to complete Strava authentication:', error);
      alert('Failed to authenticate with Strava. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}/dashboard`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const loadActivities = async (detailed = false) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/activities?detailed=${detailed}`);
      const data = await response.json();
      
      if (response.ok) {
        setActivities(data.activities || []);
        setCurrentView('activities');
      } else {
        throw new Error(data.detail || 'Failed to load activities');
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      alert('Failed to load activities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivityDetail = async (stravaId) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Load activity details
      const activityResponse = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/activity/${stravaId}`);
      const activityData = await activityResponse.json();
      
      if (activityResponse.ok) {
        setSelectedActivity(activityData.activity);
        
        // Load streams data
        const streamsResponse = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/activity/${stravaId}/streams`);
        const streamsData = await streamsResponse.json();
        setActivityStreams(streamsData.streams || {});
        
        // Load laps data
        const lapsResponse = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/activity/${stravaId}/laps`);
        const lapsData = await lapsResponse.json();
        setActivityLaps(lapsData.laps || []);
        
        setCurrentView('activity-detail');
      } else {
        throw new Error(activityData.detail || 'Failed to load activity details');
      }
    } catch (error) {
      console.error('Failed to load activity details:', error);
      alert('Failed to load activity details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setDashboardData(null);
    setActivities([]);
    setSelectedActivity(null);
    setActivityStreams(null);
    setActivityLaps(null);
    setCurrentView('welcome');
    localStorage.removeItem('fittracker_user');
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSportIcon = (sportType) => {
    const icons = {
      'Run': '🏃‍♂️',
      'Ride': '🚴‍♂️',
      'Swim': '🏊‍♂️',
      'Walk': '🚶‍♂️',
      'Hike': '🥾',
      'Workout': '💪',
      'VirtualRide': '🚴‍♂️',
      'EBikeRide': '🚴‍♂️',
      'default': '🏃‍♂️'
    };
    return icons[sportType] || icons.default;
  };

  const getSportColor = (sportType) => {
    const colors = {
      'Run': '#10b981',
      'Ride': '#3b82f6',
      'Swim': '#06b6d4',
      'Walk': '#8b5cf6',
      'Hike': '#f59e0b',
      'Workout': '#ef4444',
      'VirtualRide': '#6366f1',
      'EBikeRide': '#14b8a6',
      'default': '#6b7280'
    };
    return colors[sportType] || colors.default;
  };

  // Navigation Component
  const Navigation = () => (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">FitTracker Pro</h1>
            {user && (
              <span className="text-gray-600">
                Welcome, {user.athlete?.name || 'Athlete'}!
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium ${currentView === 'dashboard' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => loadActivities(true)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium ${currentView === 'activities' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Activities
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-red-600 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  if (currentView === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-pink-500">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-white mb-4">
              FitTracker Pro
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Your premium Strava alternative - Advanced analytics, maps, and insights. Forever free!
            </p>
            <div className="flex justify-center space-x-8 text-white/80 text-sm">
              <div className="flex items-center">
                <span className="mr-2">🗺️</span>
                Interactive Maps
              </div>
              <div className="flex items-center">
                <span className="mr-2">📊</span>
                Advanced Analytics
              </div>
              <div className="flex items-center">
                <span className="mr-2">💗</span>
                Heart Rate Zones
              </div>
              <div className="flex items-center">
                <span className="mr-2">🏃‍♂️</span>
                Lap Analysis
              </div>
              <div className="flex items-center">
                <span className="mr-2">🆓</span>
                100% Free
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 text-center border border-white/20">
              <div className="mb-8">
                <div className="text-8xl mb-4">🏃‍♂️</div>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Connect Your Fitness Data
                </h2>
                <p className="text-lg text-white/90 mb-8">
                  Import your activities from Strava and get premium features including interactive maps, detailed analytics, heart rate zones, and lap breakdowns - all completely free!
                </p>
              </div>

              <button
                onClick={handleStravaLogin}
                disabled={isLoading}
                className="inline-flex items-center px-8 py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <span className="mr-3">🔗</span>
                    Connect with Strava
                  </>
                )}
              </button>

              <div className="mt-8 grid md:grid-cols-4 gap-6 text-left">
                <div className="bg-white/10 rounded-xl p-6">
                  <div className="text-3xl mb-3">🗺️</div>
                  <h3 className="text-white font-semibold mb-2">Interactive Maps</h3>
                  <p className="text-white/80 text-sm">View your routes with detailed elevation profiles</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <div className="text-3xl mb-3">💗</div>
                  <h3 className="text-white font-semibold mb-2">Heart Rate Zones</h3>
                  <p className="text-white/80 text-sm">Analyze training intensity and recovery</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <div className="text-3xl mb-3">🏃‍♂️</div>
                  <h3 className="text-white font-semibold mb-2">Lap Analysis</h3>
                  <p className="text-white/80 text-sm">Detailed breakdowns of splits and pace</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="text-white font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-white/80 text-sm">Training trends and performance insights</p>
                </div>
              </div>
            </div>

            {/* Credits Footer */}
            <div className="mt-16 text-center">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <p className="text-white/90 text-lg mb-4">
                  🏃‍♂️ Built with passion for the fitness community
                </p>
                <div className="flex justify-center items-center space-x-6 text-white/70 text-sm">
                  <div className="flex items-center">
                    <span className="mr-2">⚡</span>
                    React & FastAPI
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">🗺️</span>
                    Leaflet Maps
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">📊</span>
                    Chart.js Analytics
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">🔗</span>
                    Strava Integration
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">🚀</span>
                    AI-Powered Development
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white/60 text-xs">
                    Created with EmergentAgent AI • Open Source Alternative to Premium Fitness Apps
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        {/* Dashboard Content */}
        <div className="container mx-auto px-4 py-8">
          {dashboardData ? (
            <>
              {/* Enhanced Stats Grid */}
              <div className="grid md:grid-cols-6 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border stats-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Activities</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.total_activities}</p>
                    </div>
                    <div className="text-4xl">🏃‍♂️</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border stats-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Distance</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.total_distance}</p>
                      <p className="text-gray-500 text-sm">km</p>
                    </div>
                    <div className="text-4xl">📏</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border stats-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Time</p>
                      <p className="text-2xl font-bold text-gray-900">{formatTime(dashboardData.total_time)}</p>
                    </div>
                    <div className="text-4xl">⏱️</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border stats-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Avg Speed</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.avg_speed}</p>
                      <p className="text-gray-500 text-sm">km/h</p>
                    </div>
                    <div className="text-4xl">⚡</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border stats-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Elevation</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.total_elevation}</p>
                      <p className="text-gray-500 text-sm">m</p>
                    </div>
                    <div className="text-4xl">⛰️</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border stats-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Avg HR</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.avg_heartrate}</p>
                      <p className="text-gray-500 text-sm">bpm</p>
                    </div>
                    <div className="text-4xl">💗</div>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Monthly Distance Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Monthly Distance</h3>
                  <Line 
                    data={{
                      labels: dashboardData.monthly_distance.map(d => d.month),
                      datasets: [{
                        label: 'Distance (km)',
                        data: dashboardData.monthly_distance.map(d => d.distance),
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        tension: 0.3,
                        fill: true
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } }
                    }}
                  />
                </div>

                {/* Activities by Sport Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Activities by Sport</h3>
                  <Doughnut 
                    data={{
                      labels: Object.keys(dashboardData.activities_by_sport),
                      datasets: [{
                        data: Object.values(dashboardData.activities_by_sport),
                        backgroundColor: Object.keys(dashboardData.activities_by_sport).map(sport => getSportColor(sport)),
                        borderWidth: 2,
                        borderColor: '#fff'
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: { 
                        legend: { position: 'bottom', labels: { usePointStyle: true } }
                      }
                    }}
                  />
                </div>

                {/* Heart Rate Zones */}
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Heart Rate Zones</h3>
                  <Bar 
                    data={{
                      labels: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'],
                      datasets: [{
                        label: 'Time %',
                        data: Object.values(dashboardData.heartrate_zones),
                        backgroundColor: [
                          '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'
                        ],
                        borderRadius: 4
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true, max: 50 } }
                    }}
                  />
                </div>
              </div>

              {/* This Week Section */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
                  <h3 className="text-lg font-semibold mb-4">This Week</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-orange-100 text-sm">Activities</p>
                      <p className="text-2xl font-bold">{dashboardData.this_week_activities}</p>
                    </div>
                    <div>
                      <p className="text-orange-100 text-sm">Distance</p>
                      <p className="text-2xl font-bold">{dashboardData.this_week_distance} km</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => loadActivities(true)}
                      disabled={isLoading}
                      className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <span className="mr-3">🗺️</span>
                        <span>View Activities with Maps</span>
                      </div>
                    </button>
                    <button
                      onClick={() => loadDashboardData(user.user_id)}
                      disabled={isLoading}
                      className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <span className="mr-3">🔄</span>
                        <span>Sync Latest Data</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              {dashboardData.recent_activities && dashboardData.recent_activities.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Activities</h3>
                  <div className="space-y-3">
                    {dashboardData.recent_activities.map((activity, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer activity-card"
                        onClick={() => activity.strava_id && loadActivityDetail(activity.strava_id)}
                      >
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{getSportIcon(activity.sport_type)}</span>
                          <div>
                            <p className="font-medium text-gray-900">{activity.name}</p>
                            <p className="text-sm text-gray-600">{activity.date}</p>
                            {activity.has_map && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">📍 Route</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{activity.distance}</p>
                          <p className="text-sm text-gray-600">{activity.time} • {activity.speed}</p>
                          {activity.heartrate && <p className="text-xs text-red-600">{activity.heartrate}</p>}
                          {activity.elevation && <p className="text-xs text-gray-500">{activity.elevation}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your fitness data...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'activities') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        {/* Activities Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Activities</h2>
            <button
              onClick={() => loadActivities(true)}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isLoading ? 'Syncing...' : 'Sync Latest'}
            </button>
          </div>

          {isLoading && activities.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your activities...</p>
            </div>
          ) : activities.length > 0 ? (
            <div className="grid gap-4">
              {activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer activity-card"
                  onClick={() => loadActivityDetail(activity.strava_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl">{getSportIcon(activity.sport_type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{activity.name}</h3>
                        <p className="text-gray-600">
                          {new Date(activity.start_date).toLocaleDateString()} • {activity.sport_type}
                        </p>
                        <div className="flex space-x-2 mt-1">
                          {(activity.polyline_map || activity.summary_polyline) && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">🗺️ Route</span>
                          )}
                          {activity.has_heartrate && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">💗 HR</span>
                          )}
                          {activity.average_watts && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">⚡ Power</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-4 gap-6 text-center">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            {activity.distance ? (activity.distance / 1000).toFixed(1) : '0.0'}
                          </p>
                          <p className="text-sm text-gray-600">km</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatTime(activity.moving_time)}
                          </p>
                          <p className="text-sm text-gray-600">time</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            {activity.average_speed ? (activity.average_speed * 3.6).toFixed(1) : '0.0'}
                          </p>
                          <p className="text-sm text-gray-600">km/h</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            {activity.total_elevation_gain ? Math.round(activity.total_elevation_gain) : '0'}
                          </p>
                          <p className="text-sm text-gray-600">m</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {(activity.average_heartrate || activity.average_watts || activity.calories) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex space-x-6 text-sm text-gray-600">
                        {activity.average_heartrate && (
                          <span>💗 Avg HR: {Math.round(activity.average_heartrate)} bpm</span>
                        )}
                        {activity.average_watts && (
                          <span>⚡ Avg Power: {Math.round(activity.average_watts)}W</span>
                        )}
                        {activity.calories && (
                          <span>🔥 Calories: {Math.round(activity.calories)}</span>
                        )}
                        {activity.kudos_count > 0 && (
                          <span>👍 Kudos: {activity.kudos_count}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏃‍♂️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600 mb-6">
                Click "Sync Latest" to fetch your activities from Strava
              </p>
              <button
                onClick={() => loadActivities(true)}
                disabled={isLoading}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isLoading ? 'Syncing...' : 'Sync Activities'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'activity-detail' && selectedActivity) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        {/* Activity Detail Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentView('activities')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <span className="mr-2">←</span>
              Back to Activities
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{selectedActivity.name}</h2>
            <div className="text-sm text-gray-500">
              {new Date(selectedActivity.start_date).toLocaleDateString()}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className="text-4xl">{getSportIcon(selectedActivity.sport_type)}</span>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedActivity.name}</h1>
                  <p className="text-gray-600">{selectedActivity.sport_type} • {new Date(selectedActivity.start_date).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-6 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {selectedActivity.distance ? (selectedActivity.distance / 1000).toFixed(2) : '0.00'}
                </p>
                <p className="text-sm text-gray-600">Distance (km)</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {formatTime(selectedActivity.moving_time)}
                </p>
                <p className="text-sm text-gray-600">Moving Time</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {selectedActivity.average_speed ? (selectedActivity.average_speed * 3.6).toFixed(1) : '0.0'}
                </p>
                <p className="text-sm text-gray-600">Avg Speed (km/h)</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {selectedActivity.total_elevation_gain ? Math.round(selectedActivity.total_elevation_gain) : '0'}
                </p>
                <p className="text-sm text-gray-600">Elevation (m)</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {selectedActivity.average_heartrate ? Math.round(selectedActivity.average_heartrate) : '--'}
                </p>
                <p className="text-sm text-gray-600">Avg HR (bpm)</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {selectedActivity.average_watts ? Math.round(selectedActivity.average_watts) : '--'}
                </p>
                <p className="text-sm text-gray-600">Avg Power (W)</p>
              </div>
            </div>
          </div>

          {/* Map */}
          {selectedActivity.route_coordinates && selectedActivity.route_coordinates.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Route Map</h3>
              <div className="h-96 rounded-lg overflow-hidden">
                <MapContainer
                  center={selectedActivity.route_coordinates[0]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Polyline 
                    positions={selectedActivity.route_coordinates} 
                    color={getSportColor(selectedActivity.sport_type)}
                    weight={4}
                  />
                  {selectedActivity.start_latlng && (
                    <Marker position={selectedActivity.start_latlng}>
                      <Popup>Start</Popup>
                    </Marker>
                  )}
                  {selectedActivity.end_latlng && (
                    <Marker position={selectedActivity.end_latlng}>
                      <Popup>Finish</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          )}

          {/* Charts Row */}
          {activityStreams && (
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Elevation Profile */}
              {activityStreams.altitude && activityStreams.distance && (
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Elevation Profile</h3>
                  <Line 
                    data={{
                      labels: activityStreams.distance.map(d => (d / 1000).toFixed(1)),
                      datasets: [{
                        label: 'Elevation (m)',
                        data: activityStreams.altitude,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.1,
                        fill: true
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { title: { display: true, text: 'Distance (km)' } },
                        y: { title: { display: true, text: 'Elevation (m)' } }
                      }
                    }}
                  />
                </div>
              )}

              {/* Heart Rate */}
              {activityStreams.heartrate && activityStreams.time && (
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Heart Rate</h3>
                  <Line 
                    data={{
                      labels: activityStreams.time.map(t => Math.floor(t / 60)),
                      datasets: [{
                        label: 'Heart Rate (bpm)',
                        data: activityStreams.heartrate,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.1
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { title: { display: true, text: 'Time (min)' } },
                        y: { title: { display: true, text: 'Heart Rate (bpm)' } }
                      }
                    }}
                  />
                </div>
              )}

              {/* Speed */}
              {activityStreams.velocity_smooth && activityStreams.time && (
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Speed</h3>
                  <Line 
                    data={{
                      labels: activityStreams.time.map(t => Math.floor(t / 60)),
                      datasets: [{
                        label: 'Speed (km/h)',
                        data: activityStreams.velocity_smooth.map(v => v * 3.6),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.1
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { title: { display: true, text: 'Time (min)' } },
                        y: { title: { display: true, text: 'Speed (km/h)' } }
                      }
                    }}
                  />
                </div>
              )}

              {/* Power */}
              {activityStreams.watts && activityStreams.time && (
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Power</h3>
                  <Line 
                    data={{
                      labels: activityStreams.time.map(t => Math.floor(t / 60)),
                      datasets: [{
                        label: 'Power (W)',
                        data: activityStreams.watts,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.1
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { title: { display: true, text: 'Time (min)' } },
                        y: { title: { display: true, text: 'Power (W)' } }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Laps */}
          {activityLaps && activityLaps.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Lap Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Lap</th>
                      <th className="text-right py-2">Distance</th>
                      <th className="text-right py-2">Time</th>
                      <th className="text-right py-2">Avg Speed</th>
                      <th className="text-right py-2">Avg HR</th>
                      <th className="text-right py-2">Elevation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLaps.map((lap, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2">{lap.name || `Lap ${lap.lap_index}`}</td>
                        <td className="text-right py-2">
                          {lap.distance ? (lap.distance / 1000).toFixed(2) : '0.00'} km
                        </td>
                        <td className="text-right py-2">{formatTime(lap.moving_time)}</td>
                        <td className="text-right py-2">
                          {lap.average_speed ? (lap.average_speed * 3.6).toFixed(1) : '0.0'} km/h
                        </td>
                        <td className="text-right py-2">
                          {lap.average_heartrate ? Math.round(lap.average_heartrate) : '--'} bpm
                        </td>
                        <td className="text-right py-2">
                          {lap.total_elevation_gain ? Math.round(lap.total_elevation_gain) : '0'} m
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default App;