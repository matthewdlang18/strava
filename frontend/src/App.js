import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  FiActivity, FiTrendingUp, FiAward, FiTarget, FiDownload, FiShare2, 
  FiHeart, FiZap, FiMapPin, FiClock, FiBarChart2, FiStar,
  FiSun, FiCloud, FiCloudRain, FiWind, FiThermometer
} from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';
import 'leaflet/dist/leaflet.css';
import './App.css';
import localStorageAPI from './api/localStorage';
import { initializeDemoData } from './utils/demoData';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

// Check if we're in GitHub Pages demo mode
const DEMO_MODE = process.env.REACT_APP_STORAGE_MODE === 'local' || !process.env.REACT_APP_API_URL;
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL;

// Custom Map Component to handle initialization issues
const ActivityMap = ({ activity }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    // Cleanup any existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Only create map if we have route coordinates
    if (activity.route_coordinates && activity.route_coordinates.length > 0 && mapContainerRef.current) {
      import('leaflet').then((L) => {
        try {
          // Create new map instance
          const map = L.map(mapContainerRef.current, {
            center: activity.route_coordinates[0],
            zoom: 13,
            scrollWheelZoom: true
          });

          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);

          // Add route polyline
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

          L.polyline(activity.route_coordinates, {
            color: getSportColor(activity.sport_type),
            weight: 4,
            opacity: 0.8
          }).addTo(map);

          // Add start marker
          if (activity.start_latlng) {
            L.marker(activity.start_latlng)
              .addTo(map)
              .bindPopup(`
                <div style="text-align: center;">
                  <div style="color: #10b981; font-weight: bold;">🚀 START</div>
                  <div style="font-size: 12px;">${activity.name}</div>
                </div>
              `);
          }

          // Add finish marker
          if (activity.end_latlng) {
            L.marker(activity.end_latlng)
              .addTo(map)
              .bindPopup(`
                <div style="text-align: center;">
                  <div style="color: #ef4444; font-weight: bold;">🏁 FINISH</div>
                  <div style="font-size: 12px;">
                    ${activity.distance ? `${(activity.distance / 1000).toFixed(1)} km` : 'Unknown distance'}
                  </div>
                </div>
              `);
          }

          // Fit map to route bounds
          if (activity.route_coordinates.length > 1) {
            const group = new L.featureGroup([L.polyline(activity.route_coordinates)]);
            map.fitBounds(group.getBounds().pad(0.1));
          }

          mapRef.current = map;
        } catch (error) {
          console.error('Error creating map:', error);
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [activity]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '400px', width: '100%' }}
      className="rounded-lg overflow-hidden"
    />
  );
};

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
  const [currentView, setCurrentView] = useState('welcome'); 
  const [exportLoading, setExportLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize app state
  useEffect(() => {
    const initializeApp = async () => {
      if (DEMO_MODE) {
        // Initialize comprehensive demo data for GitHub Pages
        initializeDemoData();
        
        // Load the demo data
        const demoData = localStorageAPI.getData();
        setUser(demoData.user);
        setActivities(demoData.activities || []);
        setAchievements(demoData.achievements || []);
        setPersonalRecords(demoData.user?.personal_records || []);
        
        // Set demo dashboard data
        setDashboardData({
          total_activities: demoData.stats?.allTime?.activities || demoData.activities?.length || 0,
          total_distance: demoData.stats?.allTime?.distance || 0,
          total_time: demoData.stats?.allTime?.time || 0,
          recent_activities: demoData.activities?.slice(0, 5) || []
        });
        
        console.log('✅ GitHub Pages demo mode initialized with comprehensive data');
      } else {
          setActivities(demoData.activities);
          setCurrentView('dashboard');
        } else {
          setUser(existingData.user);
          setActivities(existingData.activities);
          setCurrentView('dashboard');
        }
      } else {
        // Original behavior for Strava integration
        const savedUser = localStorage.getItem('fittracker_user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            setCurrentView('dashboard');
            loadDashboardData(userData.user_id);
          } catch (error) {
            console.error('Error parsing saved user:', error);
            localStorage.removeItem('fittracker_user');
          }
        }
      }
      setIsInitialized(true);
    };

    initializeApp();
  }, []);

  // Handle URL parameters only on initial load
  useEffect(() => {
    if (!isInitialized) return;

    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth_success');
    const authError = urlParams.get('auth_error');
    const userId = urlParams.get('user_id');
    const athleteId = urlParams.get('athlete_id');
    const athleteName = urlParams.get('athlete_name');
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    // Only process auth parameters if we don't already have a user
    if (!user) {
      // Handle authentication errors
      if (authError) {
        console.error('Authentication error:', authError);
        let errorMessage = 'Authentication failed. Please try again.';
        
        switch (authError) {
          case 'invalid_state':
            errorMessage = 'Session expired. Please try logging in again.';
            break;
          case 'token_exchange_failed':
            errorMessage = 'Failed to connect to Strava. Please try again.';
            break;
          case 'callback_error':
            errorMessage = 'Authentication error occurred. Please try again.';
            break;
        }
        
        alert(errorMessage);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      // Handle successful redirect from backend
      if (authSuccess === 'true' && userId) {
        handleStravaSuccess(userId, athleteId, athleteName);
      }
      // Handle direct OAuth callback (legacy)
      else if (code && state) {
        handleStravaCallback(code, state);
      }
    }
    
    // Always clean up URL parameters after processing
    if (authSuccess || authError || code || state) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isInitialized, user]);

  // Improved navigation handling
  const navigateToView = (viewName) => {
    setCurrentView(viewName);
    // Update URL without triggering auth flow
    window.history.pushState({ view: viewName }, document.title, window.location.pathname);
  };

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
    const authError = urlParams.get('auth_error');
    const userId = urlParams.get('user_id');
    const athleteId = urlParams.get('athlete_id');
    const athleteName = urlParams.get('athlete_name');
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    // Handle authentication errors
    if (authError) {
      console.error('Authentication error:', authError);
      let errorMessage = 'Authentication failed. Please try again.';
      
      switch (authError) {
        case 'invalid_state':
          errorMessage = 'Session expired. Please try logging in again.';
          break;
        case 'token_exchange_failed':
          errorMessage = 'Failed to connect to Strava. Please try again.';
          break;
        case 'callback_error':
          errorMessage = 'Authentication error occurred. Please try again.';
          break;
      }
      
      alert(errorMessage);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    // Handle successful redirect from backend
    if (authSuccess === 'true' && userId) {
      handleStravaSuccess(userId, athleteId, athleteName);
    }
    // Handle direct OAuth callback (legacy)
    else if (code && state) {
      handleStravaCallback(code, state);
    }
    // If there are auth-related parameters but they're invalid, clear them
    else if (code || state || authSuccess) {
      console.warn('Invalid auth parameters detected, clearing URL');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle browser navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = (event) => {
      // Check if user is still logged in when navigating
      const savedUser = localStorage.getItem('fittracker_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Set appropriate view based on current path or default to dashboard
        setCurrentView('dashboard');
      } else {
        // If no saved user, go to welcome page
        setCurrentView('welcome');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleStravaLogin = async () => {
    if (DEMO_MODE) {
      // In demo mode, just populate demo data and proceed
      const demoData = localStorageAPI.populateDemoData();
      setUser(demoData.user);
      setActivities(demoData.activities);
      setCurrentView('dashboard');
      return;
    }

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
    if (DEMO_MODE) {
      // In demo mode, create mock dashboard data from localStorage
      const data = localStorageAPI.getData();
      const activities = data.activities || [];
      
      const mockDashboard = {
        total_activities: activities.length,
        total_distance: activities.reduce((sum, act) => sum + (act.distance || 0), 0),
        total_time: activities.reduce((sum, act) => sum + (act.duration || 0), 0),
        total_elevation: activities.reduce((sum, act) => sum + (act.elevation_gain || 0), 0),
        recent_activities: activities.slice(0, 5)
      };
      
      setDashboardData(mockDashboard);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}/dashboard`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const loadActivities = async (detailed = false, syncAll = false) => {
    if (!user) return;
    
    if (DEMO_MODE) {
      // In demo mode, load from localStorage
      const data = localStorageAPI.getData();
      setActivities(data.activities || []);
      navigateToView('activities');
      return;
    }
    
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        detailed: detailed.toString(),
        sync_all: syncAll.toString()
      });
      
      const response = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/activities?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setActivities(data.activities || []);
        navigateToView('activities');
        
        if (syncAll) {
          alert(`Successfully synced ${data.count} activities from ${data.synced_pages || 1} pages!`);
        }
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
    
    if (DEMO_MODE) {
      // Generate mock personal records from localStorage activities
      const data = localStorageAPI.getData();
      const activities = data.activities || [];
      
      const mockRecords = [
        { type: 'Longest Run', value: Math.max(...activities.filter(a => a.type === 'Run').map(a => a.distance || 0), 0), unit: 'km' },
        { type: 'Fastest 5K', value: 1800, unit: 'seconds' },
        { type: 'Longest Ride', value: Math.max(...activities.filter(a => a.type === 'Ride').map(a => a.distance || 0), 0), unit: 'km' },
        { type: 'Most Calories', value: Math.max(...activities.map(a => a.calories || 0), 0), unit: 'cal' }
      ];
      
      setPersonalRecords(mockRecords);
      navigateToView('records');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/personal-records`);
      const data = await response.json();
      
      if (response.ok) {
        setPersonalRecords(data.personal_records || []);
        navigateToView('records');
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
    
    if (DEMO_MODE) {
      // Generate mock achievements
      const mockAchievements = [
        { name: 'First Activity', description: 'Completed your first activity!', date: new Date().toISOString(), icon: '🥇' },
        { name: 'Distance Master', description: 'Completed 100km total distance', date: new Date().toISOString(), icon: '📏' },
        { name: 'Consistency King', description: 'Worked out 3 days in a row', date: new Date().toISOString(), icon: '📅' }
      ];
      
      setAchievements(mockAchievements);
      navigateToView('achievements');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/achievements`);
      const data = await response.json();
      
      if (response.ok) {
        setAchievements(data.achievements || []);
        navigateToView('achievements');
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
    
    if (DEMO_MODE) {
      // Export localStorage data as JSON
      const data = localStorageAPI.exportData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'strava_demo_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return;
    }
    
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
    
    if (DEMO_MODE) {
      // In demo mode, find activity by ID from localStorage
      const data = localStorageAPI.getData();
      const activity = data.activities.find(act => act.id === stravaId);
      
      if (activity) {
        setSelectedActivity(activity);
        // Generate mock streams and laps data
        setActivityStreams({
          time: [0, 300, 600, 900, 1200, 1500, 1800],
          distance: [0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8],
          elevation: [100, 105, 110, 95, 90, 85, 80]
        });
        setActivityLaps([
          { lap_index: 1, total_time_seconds: 900, distance: 2.5, max_speed: 12.5 },
          { lap_index: 2, total_time_seconds: 900, distance: 2.7, max_speed: 13.2 }
        ]);
        setCurrentView('activity-detail');
      }
      return;
    }
    
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
              <div>
                <span className="text-gray-600">
                  Welcome, {user.athlete?.name || user.name || 'Athlete'}! 🏆
                </span>
                {DEMO_MODE && (
                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full mt-1 inline-block ml-2">
                    🚀 Demo Mode - Sample Data
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${currentView === 'dashboard' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiBarChart2 className="inline mr-2" />
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
              FitTracker Pro Ultimate {DEMO_MODE && '(Demo)'}
            </h1>
            <p className="text-xl text-white/90 mb-8">
              {DEMO_MODE 
                ? "Demo version with sample data - No Strava connection required!" 
                : "The most advanced fitness tracking platform - Features that put Strava Premium to shame. Forever free!"
              }</p>
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
                  {DEMO_MODE ? "Try the Demo!" : "Connect Your Fitness Data"}
                </h2>
                <p className="text-lg text-white/90 mb-8">
                  {DEMO_MODE 
                    ? "Experience all features with sample fitness data. No account required - everything runs locally in your browser!"
                    : "Import your activities from Strava and unlock the most comprehensive fitness analytics platform ever built. Personal records tracking, achievement systems, AI-powered insights, weather data, and so much more!"
                  }
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
                    <span className="mr-3">{DEMO_MODE ? '🚀' : '🔗'}</span>
                    {DEMO_MODE ? 'Try Demo Now' : 'Connect with Strava'}
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
                        tension: 0.3
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

  if (currentView === 'activities') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        {/* Activities Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Activities</h2>
            <div className="flex space-x-2">
              <motion.button
                onClick={() => loadActivities(true, false)}
                disabled={isLoading}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                {isLoading ? 'Syncing...' : 'Sync Latest'}
              </motion.button>
              <motion.button
                onClick={() => loadActivities(true, true)}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                {isLoading ? 'Syncing All...' : 'Sync All Data'}
              </motion.button>
            </div>
          </div>

          {isLoading && activities.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your activities...</p>
            </div>
          ) : activities.length > 0 ? (
            <div className="grid gap-4">
              {activities.map((activity) => (
                <motion.div 
                  key={activity.id} 
                  className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer activity-card"
                  onClick={() => loadActivityDetail(activity.strava_id)}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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
                          {activity.weather && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">🌤️ Weather</span>
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
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏃‍♂️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600 mb-6">
                Click "Sync Latest" to fetch your activities from Strava
              </p>
              <motion.button
                onClick={() => loadActivities(true, true)}
                disabled={isLoading}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                {isLoading ? 'Syncing...' : 'Sync All Activities'}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'records') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Personal Records</h2>
            <motion.button
              onClick={loadPersonalRecords}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </motion.button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your personal records...</p>
            </div>
          ) : personalRecords.length > 0 ? (
            <div className="grid gap-4">
              {personalRecords.map((record, index) => (
                <motion.div 
                  key={record.id}
                  className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">🏆</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{record.type}</h3>
                        <p className="text-gray-600">{record.sport} • {record.date}</p>
                        <p className="text-sm text-gray-500">{record.activity_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-yellow-600">{record.value} {record.unit}</p>
                      {record.improvement > 0 && (
                        <p className="text-sm text-green-600">Improvement: +{record.improvement.toFixed(1)} {record.unit}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No personal records yet</h3>
              <p className="text-gray-600 mb-6">
                Complete more activities to set your first personal records!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'achievements') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
            <motion.button
              onClick={loadAchievements}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </motion.button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your achievements...</p>
            </div>
          ) : achievements.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement, index) => (
                <motion.div 
                  key={achievement.id}
                  className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="text-6xl mb-4">{achievement.icon}</div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{achievement.title}</h3>
                  <p className="text-gray-600 mb-3">{achievement.description}</p>
                  <p className="text-sm text-gray-500">Achieved on {achievement.date}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No achievements yet</h3>
              <p className="text-gray-600 mb-6">
                Keep training to unlock your first achievements!
              </p>
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
            <motion.button
              onClick={() => setCurrentView('activities')}
              className="flex items-center text-gray-600 hover:text-gray-900"
              whileHover={{ x: -5 }}
            >
              <span className="mr-2">←</span>
              Back to Activities
            </motion.button>
            <h2 className="text-2xl font-bold text-gray-900">{selectedActivity.name}</h2>
            <div className="text-sm text-gray-500">
              {new Date(selectedActivity.start_date).toLocaleDateString()}
            </div>
          </div>

          {/* Activity Summary */}
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-sm border mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
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
          </motion.div>

          {/* Map */}
          {selectedActivity.route_coordinates && selectedActivity.route_coordinates.length > 0 && (
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-sm border mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Route Map</h3>
              <ActivityMap activity={selectedActivity} />
              
              {/* Route Stats */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="font-semibold text-gray-900">Route Distance</div>
                  <div className="text-blue-600">{selectedActivity.distance ? `${(selectedActivity.distance / 1000).toFixed(1)} km` : 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="font-semibold text-gray-900">Elevation Gain</div>
                  <div className="text-orange-600">{selectedActivity.total_elevation_gain ? `${Math.round(selectedActivity.total_elevation_gain)} m` : 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="font-semibold text-gray-900">Avg Grade</div>
                  <div className="text-purple-600">
                    {selectedActivity.distance && selectedActivity.total_elevation_gain 
                      ? `${((selectedActivity.total_elevation_gain / selectedActivity.distance) * 100).toFixed(1)}%`
                      : 'N/A'
                    }
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="font-semibold text-gray-900">Route Points</div>
                  <div className="text-green-600">{selectedActivity.route_coordinates.length} GPS points</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Enhanced Charts and Analysis */}
          {activityStreams && Object.keys(activityStreams).length > 0 && (
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-sm border mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Performance Analysis</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Elevation Profile */}
                {activityStreams.altitude && activityStreams.distance && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Elevation Profile</h4>
                    <div className="h-64">
                      <Line 
                        data={{
                          labels: activityStreams.distance.map(d => (d / 1000).toFixed(1)),
                          datasets: [{
                            label: 'Elevation (m)',
                            data: activityStreams.altitude,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.1,
                            pointRadius: 0,
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            x: { 
                              title: { display: true, text: 'Distance (km)' },
                              grid: { display: false }
                            },
                            y: { 
                              title: { display: true, text: 'Elevation (m)' },
                              grid: { color: 'rgba(0,0,0,0.1)' }
                            }
                          },
                          elements: {
                            point: { radius: 0 },
                            line: { tension: 0.1 }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Heart Rate */}
                {activityStreams.heartrate && activityStreams.time && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Heart Rate</h4>
                    <div className="h-64">
                      <Line 
                        data={{
                          labels: activityStreams.time.map(t => Math.floor(t / 60)),
                          datasets: [{
                            label: 'Heart Rate (bpm)',
                            data: activityStreams.heartrate,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            tension: 0.1,
                            pointRadius: 0,
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            x: { 
                              title: { display: true, text: 'Time (min)' },
                              grid: { display: false }
                            },
                            y: { 
                              title: { display: true, text: 'Heart Rate (bpm)' },
                              grid: { color: 'rgba(0,0,0,0.1)' },
                              suggestedMin: Math.min(...activityStreams.heartrate) - 10,
                              suggestedMax: Math.max(...activityStreams.heartrate) + 10
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Speed/Pace */}
                {activityStreams.velocity_smooth && activityStreams.time && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Speed Profile</h4>
                    <div className="h-64">
                      <Line 
                        data={{
                          labels: activityStreams.time.map(t => Math.floor(t / 60)),
                          datasets: [{
                            label: 'Speed (km/h)',
                            data: activityStreams.velocity_smooth.map(v => v * 3.6),
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.1,
                            pointRadius: 0,
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            x: { 
                              title: { display: true, text: 'Time (min)' },
                              grid: { display: false }
                            },
                            y: { 
                              title: { display: true, text: 'Speed (km/h)' },
                              grid: { color: 'rgba(0,0,0,0.1)' },
                              suggestedMin: 0
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Power */}
                {activityStreams.watts && activityStreams.time && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Power Output</h4>
                    <div className="h-64">
                      <Line 
                        data={{
                          labels: activityStreams.time.map(t => Math.floor(t / 60)),
                          datasets: [{
                            label: 'Power (W)',
                            data: activityStreams.watts,
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            tension: 0.1,
                            pointRadius: 0,
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            x: { 
                              title: { display: true, text: 'Time (min)' },
                              grid: { display: false }
                            },
                            y: { 
                              title: { display: true, text: 'Power (W)' },
                              grid: { color: 'rgba(0,0,0,0.1)' },
                              suggestedMin: 0
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Zones */}
              {activityStreams.heartrate && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-700 mb-3">Training Zones Distribution</h4>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {[
                      { name: 'Zone 1', color: '#10b981', range: '< 60%', percent: 25 },
                      { name: 'Zone 2', color: '#3b82f6', range: '60-70%', percent: 35 },
                      { name: 'Zone 3', color: '#f59e0b', range: '70-80%', percent: 20 },
                      { name: 'Zone 4', color: '#ef4444', range: '80-90%', percent: 15 },
                      { name: 'Zone 5', color: '#8b5cf6', range: '> 90%', percent: 5 }
                    ].map((zone, index) => (
                      <div key={index} className="text-center">
                        <div 
                          className="h-20 rounded mb-2 flex items-end justify-center text-white font-semibold"
                          style={{ 
                            backgroundColor: zone.color,
                            height: `${Math.max(zone.percent * 2, 20)}px`
                          }}
                        >
                          {zone.percent}%
                        </div>
                        <div className="font-medium">{zone.name}</div>
                        <div className="text-gray-500">{zone.range}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Lap Analysis */}
          {activityLaps && activityLaps.length > 0 && (
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-sm border mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Lap Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold">Lap</th>
                      <th className="text-right py-3 px-4 font-semibold">Distance</th>
                      <th className="text-right py-3 px-4 font-semibold">Time</th>
                      <th className="text-right py-3 px-4 font-semibold">Pace</th>
                      <th className="text-right py-3 px-4 font-semibold">Avg HR</th>
                      <th className="text-right py-3 px-4 font-semibold">Elevation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLaps.map((lap, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium">{lap.name || `Lap ${lap.lap_index}`}</td>
                        <td className="text-right py-3 px-4">
                          {lap.distance ? (lap.distance / 1000).toFixed(2) : '0.00'} km
                        </td>
                        <td className="text-right py-3 px-4">{formatTime(lap.moving_time)}</td>
                        <td className="text-right py-3 px-4">
                          {lap.average_speed ? (lap.average_speed * 3.6).toFixed(1) : '0.0'} km/h
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={lap.average_heartrate ? 'text-red-600' : 'text-gray-400'}>
                            {lap.average_heartrate ? Math.round(lap.average_heartrate) : '--'} bpm
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={lap.total_elevation_gain ? 'text-orange-600' : 'text-gray-400'}>
                            {lap.total_elevation_gain ? Math.round(lap.total_elevation_gain) : '0'} m
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Segment Analysis Placeholder */}
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-sm border mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Segment Analysis</h3>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🏁</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Segment Detection</h4>
              <p className="text-gray-600 mb-4">
                Premium feature: Automatic segment detection and leaderboard comparison
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg">
                  <div className="text-lg font-bold">🏔️ Climb Segments</div>
                  <div className="text-sm opacity-90">Detected: 3 segments</div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-lg">
                  <div className="text-lg font-bold">🏃‍♂️ Sprint Segments</div>
                  <div className="text-sm opacity-90">Detected: 2 segments</div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
                  <div className="text-lg font-bold">⏱️ Time Trials</div>
                  <div className="text-sm opacity-90">Detected: 1 segment</div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-sm border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Activity Details</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {selectedActivity.weather && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Weather Conditions</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>🌡️ {selectedActivity.weather.temperature}°C</span>
                    <span>☁️ {selectedActivity.weather.condition}</span>
                    <span>💨 {selectedActivity.weather.wind_speed} km/h</span>
                  </div>
                </div>
              )}
              
              {selectedActivity.social_stats && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Social Stats</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>👍 {selectedActivity.social_stats.kudos_count} Kudos</span>
                    <span>💬 {selectedActivity.social_stats.comment_count} Comments</span>
                    <span>📸 {selectedActivity.social_stats.photo_count} Photos</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;