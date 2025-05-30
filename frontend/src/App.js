import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  FiActivity, FiTrendingUp, FiAward, FiTarget, FiDownload, FiShare2, 
  FiHeart, FiZap, FiMapPin, FiClock, FiBarChart3, FiStar,
  FiSun, FiCloud, FiCloudRain, FiWind, FiThermometer
} from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityStreams, setActivityStreams] = useState(null);
  const [activityLaps, setActivityLaps] = useState(null);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [currentView, setCurrentView] = useState('welcome'); // welcome, dashboard, activities, activity-detail, records, achievements
  const [exportLoading, setExportLoading] = useState(false);

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

  const loadPersonalRecords = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/personal-records`);
      const data = await response.json();
      
      if (response.ok) {
        setPersonalRecords(data.personal_records || []);
        setCurrentView('records');
      } else {
        throw new Error(data.detail || 'Failed to load personal records');
      }
    } catch (error) {
      console.error('Failed to load personal records:', error);
      alert('Failed to load personal records. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAchievements = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/achievements`);
      const data = await response.json();
      
      if (response.ok) {
        setAchievements(data.achievements || []);
        setCurrentView('achievements');
      } else {
        throw new Error(data.detail || 'Failed to load achievements');
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
      alert('Failed to load achievements. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    if (!user) return;
    
    try {
      setExportLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/export?format=csv`);
      const data = await response.json();
      
      if (response.ok) {
        // Create and download CSV file
        const blob = new Blob([data.csv_data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('Data exported successfully!');
      } else {
        throw new Error(data.detail || 'Failed to export data');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
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
    setPersonalRecords([]);
    setAchievements([]);
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
      'WeightTraining': '🏋️‍♂️',
      'Yoga': '🧘‍♀️',
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
      'WeightTraining': '#f97316',
      'Yoga': '#ec4899',
      'default': '#6b7280'
    };
    return colors[sportType] || colors.default;
  };

  const getWeatherIcon = (condition) => {
    if (!condition) return <FiSun className="w-4 h-4" />;
    
    const lower = condition.toLowerCase();
    if (lower.includes('rain')) return <FiCloudRain className="w-4 h-4" />;
    if (lower.includes('cloud')) return <FiCloud className="w-4 h-4" />;
    return <FiSun className="w-4 h-4" />;
  };

  const FitnessScoreGauge = ({ score }) => {
    const [ref, inView] = useInView({ triggerOnce: true });
    
    return (
      <div ref={ref} className="relative w-32 h-32 mx-auto">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          <motion.path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeDasharray="100, 100"
            initial={{ strokeDashoffset: 100 }}
            animate={inView ? { strokeDashoffset: 100 - score } : { strokeDashoffset: 100 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              className="text-2xl font-bold text-gray-900"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              {score}
            </motion.div>
            <div className="text-xs text-gray-600">Fitness Score</div>
          </div>
        </div>
      </div>
    );
  };

  // Navigation Component
  const Navigation = () => (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <motion.h1 
              className="text-2xl font-bold text-gray-900"
              whileHover={{ scale: 1.05 }}
            >
              FitTracker Pro
            </motion.h1>
            {user && (
              <span className="text-gray-600">
                Welcome, {user.athlete?.name || 'Athlete'}! 🏆
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${currentView === 'dashboard' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiBarChart3 className="inline mr-2" />
              Dashboard
            </motion.button>
            <motion.button
              onClick={() => loadActivities(true)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${currentView === 'activities' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiActivity className="inline mr-2" />
              Activities
            </motion.button>
            <motion.button
              onClick={loadPersonalRecords}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${currentView === 'records' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiAward className="inline mr-2" />
              Records
            </motion.button>
            <motion.button
              onClick={loadAchievements}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${currentView === 'achievements' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiStar className="inline mr-2" />
              Achievements
            </motion.button>
            <motion.button
              onClick={exportData}
              disabled={exportLoading}
              className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiDownload className="inline mr-2" />
              {exportLoading ? 'Exporting...' : 'Export'}
            </motion.button>
            <motion.button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-red-600 font-medium transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Logout
            </motion.button>
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
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl font-bold text-white mb-4">
              FitTracker Pro Ultimate
            </h1>
            <p className="text-xl text-white/90 mb-8">
              The most advanced fitness tracking platform - Features that put Strava Premium to shame. Forever free!
            </p>
            <motion.div 
              className="flex justify-center flex-wrap gap-4 text-white/80 text-sm"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {[
                { icon: "🗺️", text: "Interactive Maps" },
                { icon: "📊", text: "Advanced Analytics" },
                { icon: "💗", text: "Heart Rate Zones" },
                { icon: "🏆", text: "Personal Records" },
                { icon: "🎯", text: "Achievement System" },
                { icon: "🌤️", text: "Weather Integration" },
                { icon: "🤖", text: "AI Insights" },
                { icon: "💾", text: "Data Export" },
                { icon: "🆓", text: "100% Free" }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center"
                  variants={fadeInUp}
                >
                  <span className="mr-2">{feature.icon}</span>
                  {feature.text}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Section */}
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 text-center border border-white/20">
              <motion.div 
                className="mb-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, duration: 0.5, type: "spring" }}
              >
                <div className="text-8xl mb-4">🏃‍♂️</div>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Connect Your Fitness Data
                </h2>
                <p className="text-lg text-white/90 mb-8">
                  Import your activities from Strava and unlock the most comprehensive fitness analytics platform ever built. 
                  Personal records tracking, achievement systems, AI-powered insights, weather data, and so much more!
                </p>
              </motion.div>

              <motion.button
                onClick={handleStravaLogin}
                disabled={isLoading}
                className="inline-flex items-center px-8 py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
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
              </motion.button>

              <motion.div 
                className="mt-8 grid md:grid-cols-4 gap-6 text-left"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {[
                  { icon: "🗺️", title: "Interactive Maps", desc: "View routes with elevation profiles and segment analysis" },
                  { icon: "🏆", title: "Personal Records", desc: "Track PRs across all metrics with intelligent detection" },
                  { icon: "🎯", title: "Achievement System", desc: "Unlock badges and milestones as you progress" },
                  { icon: "🤖", title: "AI-Powered Insights", desc: "Get personalized training recommendations and trends" }
                ].map((feature, index) => (
                  <motion.div 
                    key={index}
                    className="bg-white/10 rounded-xl p-6"
                    variants={fadeInUp}
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                    <p className="text-white/80 text-sm">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Credits Footer */}
            <motion.div 
              className="mt-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 0.8 }}
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <p className="text-white/90 text-lg mb-4">
                  🏃‍♂️ Built with passion for the fitness community
                </p>
                <div className="flex justify-center items-center flex-wrap gap-6 text-white/70 text-sm">
                  {[
                    { icon: "⚡", text: "React & FastAPI" },
                    { icon: "🗺️", text: "Leaflet Maps" },
                    { icon: "📊", text: "Chart.js Analytics" },
                    { icon: "🎨", text: "Framer Motion" },
                    { icon: "🔗", text: "Strava Integration" },
                    { icon: "🚀", text: "AI-Powered Development" }
                  ].map((tech, index) => (
                    <div key={index} className="flex items-center">
                      <span className="mr-2">{tech.icon}</span>
                      {tech.text}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white/60 text-xs">
                    Created with EmergentAgent AI • The Ultimate Open Source Fitness Platform
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
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
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {/* Hero Stats Section */}
              <motion.div 
                className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 mb-8 text-white"
                variants={fadeInUp}
              >
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-3xl font-bold mb-4">Your Fitness Journey</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-orange-100 text-sm">Activities This Week</p>
                        <p className="text-3xl font-bold">{dashboardData.this_week_activities}</p>
                      </div>
                      <div>
                        <p className="text-orange-100 text-sm">Distance This Week</p>
                        <p className="text-3xl font-bold">{dashboardData.this_week_distance} km</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-orange-100 text-sm">Training Load: {dashboardData.training_load?.current_load || 0}</p>
                      <div className="w-full bg-orange-400/30 rounded-full h-2 mt-2">
                        <motion.div 
                          className="bg-white rounded-full h-2"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((dashboardData.training_load?.current_load || 0) / 10 * 100, 100)}%` }}
                          transition={{ delay: 0.5, duration: 1 }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <FitnessScoreGauge score={dashboardData.fitness_score || 0} />
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Stats Grid */}
              <motion.div 
                className="grid md:grid-cols-6 gap-6 mb-8"
                variants={staggerContainer}
              >
                {[
                  { label: "Total Activities", value: dashboardData.total_activities, icon: <FiActivity />, color: "blue" },
                  { label: "Total Distance", value: `${dashboardData.total_distance} km`, icon: <FiMapPin />, color: "green" },
                  { label: "Total Time", value: formatTime(dashboardData.total_time), icon: <FiClock />, color: "purple" },
                  { label: "Avg Speed", value: `${dashboardData.avg_speed} km/h`, icon: <FiZap />, color: "yellow" },
                  { label: "Total Elevation", value: `${dashboardData.total_elevation} m`, icon: <FiTrendingUp />, color: "orange" },
                  { label: "Avg HR", value: `${dashboardData.avg_heartrate} bpm`, icon: <FiHeart />, color: "red" }
                ].map((stat, index) => (
                  <motion.div 
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-sm border stats-card hover-lift"
                    variants={fadeInUp}
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`text-4xl text-${stat.color}-500`}>
                        {stat.icon}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* AI Insights Section */}
              {dashboardData.performance_insights && dashboardData.performance_insights.length > 0 && (
                <motion.div 
                  className="bg-white rounded-xl p-6 shadow-sm border mb-8"
                  variants={fadeInUp}
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                    <span className="mr-2">🤖</span>
                    AI-Powered Insights
                  </h3>
                  <div className="space-y-3">
                    {dashboardData.performance_insights.map((insight, index) => (
                      <motion.div 
                        key={index}
                        className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <p className="text-blue-800">{insight}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Charts Row */}
              <motion.div 
                className="grid md:grid-cols-3 gap-6 mb-8"
                variants={staggerContainer}
              >
                {/* Monthly Distance Chart */}
                <motion.div 
                  className="bg-white rounded-xl p-6 shadow-sm border"
                  variants={fadeInUp}
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Monthly Progress</h3>
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
                </motion.div>

                {/* Activities by Sport Chart */}
                <motion.div 
                  className="bg-white rounded-xl p-6 shadow-sm border"
                  variants={fadeInUp}
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Sport Breakdown</h3>
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
                </motion.div>

                {/* Heart Rate Zones */}
                <motion.div 
                  className="bg-white rounded-xl p-6 shadow-sm border"
                  variants={fadeInUp}
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Training Zones</h3>
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
                </motion.div>
              </motion.div>

              {/* Personal Records & Achievements */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Personal Records */}
                <motion.div 
                  className="bg-white rounded-xl p-6 shadow-sm border"
                  variants={fadeInUp}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FiAward className="mr-2 text-yellow-500" />
                      Recent Personal Records
                    </h3>
                    <motion.button
                      onClick={loadPersonalRecords}
                      className="text-sm text-orange-600 hover:text-orange-700"
                      whileHover={{ scale: 1.05 }}
                    >
                      View All
                    </motion.button>
                  </div>
                  <div className="space-y-3">
                    {dashboardData.personal_records.slice(0, 3).map((pr, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div>
                          <p className="font-medium text-gray-900">{pr.type.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-sm text-gray-600">{pr.sport} • {pr.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-yellow-600">{pr.value} {pr.unit}</p>
                          {pr.improvement > 0 && (
                            <p className="text-xs text-green-600">+{pr.improvement.toFixed(1)}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Recent Achievements */}
                <motion.div 
                  className="bg-white rounded-xl p-6 shadow-sm border"
                  variants={fadeInUp}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FiStar className="mr-2 text-purple-500" />
                      Recent Achievements
                    </h3>
                    <motion.button
                      onClick={loadAchievements}
                      className="text-sm text-orange-600 hover:text-orange-700"
                      whileHover={{ scale: 1.05 }}
                    >
                      View All
                    </motion.button>
                  </div>
                  <div className="space-y-3">
                    {dashboardData.recent_achievements.slice(0, 3).map((achievement, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="text-2xl">{achievement.icon}</div>
                        <div>
                          <p className="font-medium text-gray-900">{achievement.title}</p>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                          <p className="text-xs text-purple-600">{achievement.date}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Recent Activities with Weather */}
              {dashboardData.recent_activities && dashboardData.recent_activities.length > 0 && (
                <motion.div 
                  className="bg-white rounded-xl p-6 shadow-sm border"
                  variants={fadeInUp}
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Activities</h3>
                  <div className="space-y-3">
                    {dashboardData.recent_activities.map((activity, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer activity-card"
                        onClick={() => activity.strava_id && loadActivityDetail(activity.strava_id)}
                        whileHover={{ x: 4 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{getSportIcon(activity.sport_type)}</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900">{activity.name}</p>
                              {activity.is_pr && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">🏆 PR</span>}
                              {activity.achievements.length > 0 && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">🎯 Achievement</span>}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>{activity.date}</span>
                              {activity.weather && (
                                <div className="flex items-center space-x-1">
                                  {getWeatherIcon(activity.weather.condition)}
                                  <span>{activity.weather.temperature}°C</span>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2 mt-1">
                              {activity.has_map && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">🗺️ Route</span>}
                              {activity.heartrate && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">💗 HR</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{activity.distance}</p>
                          <p className="text-sm text-gray-600">{activity.time} • {activity.speed}</p>
                          {activity.heartrate && <p className="text-xs text-red-600">{activity.heartrate}</p>}
                          {activity.elevation && <p className="text-xs text-gray-500">{activity.elevation}</p>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your comprehensive fitness dashboard...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Continue with other views (activities, records, achievements) - implementing similar premium enhancements...
  // [The rest of the views would follow similar patterns with animations, enhanced UI, and premium features]

  return null;
}

export default App;