import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [currentView, setCurrentView] = useState('welcome'); // welcome, dashboard, activities

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

  const loadActivities = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/activities`);
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

  const handleLogout = () => {
    setUser(null);
    setDashboardData(null);
    setActivities([]);
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
      'default': '🏃‍♂️'
    };
    return icons[sportType] || icons.default;
  };

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
              Your free Strava alternative - No subscription required!
            </p>
            <div className="flex justify-center space-x-8 text-white/80 text-sm">
              <div className="flex items-center">
                <span className="mr-2">✅</span>
                Connect to Strava
              </div>
              <div className="flex items-center">
                <span className="mr-2">✅</span>
                Advanced Analytics
              </div>
              <div className="flex items-center">
                <span className="mr-2">✅</span>
                100% Free Forever
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
                  Import your activities from Strava and get advanced analytics without paying for premium features.
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

              <div className="mt-8 grid md:grid-cols-3 gap-6 text-left">
                <div className="bg-white/10 rounded-xl p-6">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="text-white font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-white/80 text-sm">Get detailed insights into your performance and progress</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <div className="text-3xl mb-3">🔄</div>
                  <h3 className="text-white font-semibold mb-2">Real-time Sync</h3>
                  <p className="text-white/80 text-sm">Your activities sync automatically from Strava</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <div className="text-3xl mb-3">🆓</div>
                  <h3 className="text-white font-semibold mb-2">Forever Free</h3>
                  <p className="text-white/80 text-sm">No subscriptions, no hidden fees, no premium tiers</p>
                </div>
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
                  <span className="mr-2">🔗</span>
                  Strava Integration
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🎨</span>
                  Tailwind CSS
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
    );
  }

  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
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
                  onClick={loadActivities}
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

        {/* Dashboard Content */}
        <div className="container mx-auto px-4 py-8">
          {dashboardData ? (
            <>
              {/* Stats Grid */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Activities</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.total_activities}</p>
                    </div>
                    <div className="text-4xl">🏃‍♂️</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Distance</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.total_distance}</p>
                      <p className="text-gray-500 text-sm">km</p>
                    </div>
                    <div className="text-4xl">📏</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Time</p>
                      <p className="text-3xl font-bold text-gray-900">{formatTime(dashboardData.total_time)}</p>
                    </div>
                    <div className="text-4xl">⏱️</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Avg Speed</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.avg_speed}</p>
                      <p className="text-gray-500 text-sm">km/h</p>
                    </div>
                    <div className="text-4xl">⚡</div>
                  </div>
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
                      onClick={loadActivities}
                      disabled={isLoading}
                      className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <span className="mr-3">📋</span>
                        <span>View All Activities</span>
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
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{getSportIcon(activity.sport_type)}</span>
                          <div>
                            <p className="font-medium text-gray-900">{activity.name}</p>
                            <p className="text-sm text-gray-600">{activity.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{activity.distance}</p>
                          <p className="text-sm text-gray-600">{activity.time} • {activity.speed}</p>
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
        {/* Navigation */}
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
                  onClick={loadActivities}
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

        {/* Activities Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Activities</h2>
            <button
              onClick={loadActivities}
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
                <div key={activity.id} className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl">{getSportIcon(activity.sport_type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{activity.name}</h3>
                        <p className="text-gray-600">
                          {new Date(activity.start_date).toLocaleDateString()} • {activity.sport_type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-6 text-center">
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
                      </div>
                    </div>
                  </div>
                  
                  {(activity.average_heartrate || activity.total_elevation_gain) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex space-x-6 text-sm text-gray-600">
                        {activity.average_heartrate && (
                          <span>❤️ Avg HR: {Math.round(activity.average_heartrate)} bpm</span>
                        )}
                        {activity.total_elevation_gain && (
                          <span>⛰️ Elevation: {Math.round(activity.total_elevation_gain)}m</span>
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
                onClick={loadActivities}
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

  return null;
}

export default App;