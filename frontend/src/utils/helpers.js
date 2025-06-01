// Utility functions for the FitTracker Pro app

export const formatTime = (seconds) => {
  if (!seconds || seconds === 0) return '0:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

export const formatDistance = (meters) => {
  if (!meters) return '0.0 km';
  return `${(meters / 1000).toFixed(1)} km`;
};

export const formatPace = (metersPerSecond) => {
  if (!metersPerSecond || metersPerSecond === 0) return '0:00 min/km';
  
  const minPerKm = 1000 / (metersPerSecond * 60);
  const minutes = Math.floor(minPerKm);
  const seconds = Math.floor((minPerKm - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
};

export const formatSpeed = (metersPerSecond) => {
  if (!metersPerSecond) return '0.0 km/h';
  return `${(metersPerSecond * 3.6).toFixed(1)} km/h`;
};

export const getSportIcon = (sportType) => {
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

export const getSportColor = (sportType) => {
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

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculatePace = (distance, time) => {
  if (!distance || !time) return 0;
  return time / (distance / 1000); // seconds per km
};

export const calculateCaloriesPerMinute = (calories, timeInSeconds) => {
  if (!calories || !timeInSeconds) return 0;
  return (calories / (timeInSeconds / 60)).toFixed(1);
};

export const getActivityTypeClass = (sportType) => {
  const classes = {
    'Run': 'activity-run',
    'Ride': 'activity-ride',
    'Swim': 'activity-swim',
    'Walk': 'activity-walk',
    'Workout': 'activity-workout',
    'default': 'activity-default'
  };
  return classes[sportType] || classes.default;
};

export const generateRouteCoordinates = (centerLat = 37.7749, centerLng = -122.4194, points = 10) => {
  const coordinates = [];
  for (let i = 0; i < points; i++) {
    coordinates.push([
      centerLat + (Math.random() - 0.5) * 0.01,
      centerLng + (Math.random() - 0.5) * 0.01
    ]);
  }
  return coordinates;
};

export const formatElevation = (meters) => {
  if (!meters) return '0 m';
  return `${Math.round(meters)} m`;
};

export const formatHeartRate = (bpm) => {
  if (!bpm) return '--';
  return `${Math.round(bpm)} bpm`;
};

export const formatPower = (watts) => {
  if (!watts) return '--';
  return `${Math.round(watts)}W`;
};

export const getWeatherIcon = (condition) => {
  if (!condition) return '☀️';
  
  const lower = condition.toLowerCase();
  if (lower.includes('rain')) return '🌧️';
  if (lower.includes('cloud')) return '☁️';
  if (lower.includes('sun')) return '☀️';
  if (lower.includes('snow')) return '❄️';
  if (lower.includes('wind')) return '💨';
  return '☀️';
};

export const categorizeActivity = (distance, duration, sportType) => {
  const categories = {
    short: { distance: 5, duration: 30 * 60 },
    medium: { distance: 15, duration: 90 * 60 },
    long: { distance: 25, duration: 180 * 60 }
  };
  
  if (sportType === 'Run') {
    if (distance < categories.short.distance) return 'Short Run';
    if (distance < categories.medium.distance) return 'Medium Run';
    return 'Long Run';
  }
  
  if (sportType === 'Ride') {
    if (distance < categories.medium.distance) return 'Short Ride';
    if (distance < categories.long.distance) return 'Medium Ride';
    return 'Long Ride';
  }
  
  return sportType;
};

export const calculateZoneTime = (heartRateData, zones) => {
  if (!heartRateData || !zones) return { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
  
  const zoneDistribution = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
  
  heartRateData.forEach(hr => {
    if (hr < zones.zone1) zoneDistribution.zone1++;
    else if (hr < zones.zone2) zoneDistribution.zone2++;
    else if (hr < zones.zone3) zoneDistribution.zone3++;
    else if (hr < zones.zone4) zoneDistribution.zone4++;
    else zoneDistribution.zone5++;
  });
  
  const total = heartRateData.length;
  Object.keys(zoneDistribution).forEach(zone => {
    zoneDistribution[zone] = Math.round((zoneDistribution[zone] / total) * 100);
  });
  
  return zoneDistribution;
};

export default {
  formatTime,
  formatDistance,
  formatPace,
  formatSpeed,
  getSportIcon,
  getSportColor,
  formatDate,
  formatDateTime,
  calculatePace,
  calculateCaloriesPerMinute,
  getActivityTypeClass,
  generateRouteCoordinates,
  formatElevation,
  formatHeartRate,
  formatPower,
  getWeatherIcon,
  categorizeActivity,
  calculateZoneTime
};