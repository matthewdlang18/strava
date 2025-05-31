// Demo Data Initializer for GitHub Pages
// This file ensures rich demo data is available for the static site

const DEMO_DATA_VERSION = '1.0.0';

export const initializeDemoData = () => {
  const storageKey = 'strava_fittracker_data';
  const versionKey = 'strava_demo_version';
  
  // Check if we already have the latest demo data
  const currentVersion = localStorage.getItem(versionKey);
  if (currentVersion === DEMO_DATA_VERSION) {
    return; // Demo data already initialized
  }

  console.log('🎯 Initializing GitHub Pages demo data...');
  
  const today = new Date();
  const demoData = {
    activities: generateDemoActivities(today),
    user: generateDemoUser(),
    settings: generateDemoSettings(),
    achievements: generateAchievements(),
    stats: generateDemoStats()
  };

  localStorage.setItem(storageKey, JSON.stringify(demoData));
  localStorage.setItem(versionKey, DEMO_DATA_VERSION);
  
  console.log('✅ Demo data initialized for GitHub Pages');
  return demoData;
};

const generateDemoActivities = (today) => {
  const activities = [];
  const activityTypes = ['Run', 'Ride', 'Hike', 'Walk', 'Workout', 'Swim'];
  const names = {
    Run: ['Morning Run 🌅', 'Evening Jog 🌆', 'Trail Run 🌲', 'Speed Training ⚡', 'Long Run 🏃‍♂️'],
    Ride: ['Bike Commute 🚴‍♀️', 'Mountain Bike 🚵‍♂️', 'Road Cycling 🛣️', 'Evening Ride 🌅'],
    Hike: ['Trail Hike 🥾', 'Mountain Hike ⛰️', 'Nature Walk 🌿', 'Summit Quest 🏔️'],
    Walk: ['Lunch Walk 🚶‍♀️', 'Dog Walk 🐕', 'City Stroll 🏙️', 'Beach Walk 🏖️'],
    Workout: ['Gym Session 💪', 'HIIT Training 🔥', 'Strength Training 🏋️‍♂️', 'Yoga 🧘‍♀️'],
    Swim: ['Pool Swim 🏊‍♂️', 'Open Water 🌊', 'Lap Swimming 💦']
  };

  // Generate 15 activities over the past 30 days
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const activityDate = new Date(today.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const nameList = names[type] || [`${type} Activity`];
    const name = nameList[Math.floor(Math.random() * nameList.length)];
    
    const activity = generateActivityByType(type, name, activityDate, i + 1);
    activities.push(activity);
  }

  return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const generateActivityByType = (type, name, date, id) => {
  const baseActivity = {
    id: id.toString(),
    name,
    type,
    date: date.toISOString(),
    created_at: date.toISOString(),
    weather: getRandomWeather()
  };

  switch (type) {
    case 'Run':
      return {
        ...baseActivity,
        distance: +(Math.random() * 15 + 2).toFixed(1), // 2-17km
        duration: Math.floor(Math.random() * 3600 + 1200), // 20-80 minutes
        calories: Math.floor(Math.random() * 500 + 200),
        avg_speed: +(Math.random() * 8 + 8).toFixed(1), // 8-16 km/h
        max_speed: +(Math.random() * 5 + 15).toFixed(1), // 15-20 km/h
        elevation_gain: Math.floor(Math.random() * 200 + 20),
        avg_heart_rate: Math.floor(Math.random() * 30 + 140),
        max_heart_rate: Math.floor(Math.random() * 20 + 165),
        has_map: Math.random() > 0.3,
        route_coordinates: generateRouteCoordinates()
      };
    
    case 'Ride':
      return {
        ...baseActivity,
        distance: +(Math.random() * 40 + 10).toFixed(1), // 10-50km
        duration: Math.floor(Math.random() * 4800 + 1800), // 30-110 minutes
        calories: Math.floor(Math.random() * 800 + 300),
        avg_speed: +(Math.random() * 15 + 20).toFixed(1), // 20-35 km/h
        max_speed: +(Math.random() * 15 + 35).toFixed(1), // 35-50 km/h
        elevation_gain: Math.floor(Math.random() * 500 + 50),
        avg_heart_rate: Math.floor(Math.random() * 25 + 125),
        max_heart_rate: Math.floor(Math.random() * 20 + 155),
        has_map: Math.random() > 0.2,
        route_coordinates: generateRouteCoordinates()
      };
    
    case 'Hike':
      return {
        ...baseActivity,
        distance: +(Math.random() * 12 + 3).toFixed(1), // 3-15km
        duration: Math.floor(Math.random() * 7200 + 2400), // 40-160 minutes
        calories: Math.floor(Math.random() * 600 + 250),
        avg_speed: +(Math.random() * 3 + 4).toFixed(1), // 4-7 km/h
        max_speed: +(Math.random() * 5 + 8).toFixed(1), // 8-13 km/h
        elevation_gain: Math.floor(Math.random() * 800 + 100),
        avg_heart_rate: Math.floor(Math.random() * 20 + 120),
        max_heart_rate: Math.floor(Math.random() * 25 + 150),
        has_map: Math.random() > 0.1,
        route_coordinates: generateRouteCoordinates()
      };
    
    default:
      return {
        ...baseActivity,
        distance: type === 'Workout' ? 0 : +(Math.random() * 5 + 1).toFixed(1),
        duration: Math.floor(Math.random() * 2400 + 600), // 10-50 minutes
        calories: Math.floor(Math.random() * 300 + 100),
        has_map: false
      };
  }
};

const generateRouteCoordinates = () => {
  if (Math.random() < 0.3) return null; // 30% chance of no route
  
  const baseLatitude = 37.7749 + (Math.random() - 0.5) * 0.1;
  const baseLongitude = -122.4194 + (Math.random() - 0.5) * 0.1;
  const coordinates = [];
  
  for (let i = 0; i < Math.floor(Math.random() * 8 + 4); i++) {
    coordinates.push([
      baseLatitude + (Math.random() - 0.5) * 0.01,
      baseLongitude + (Math.random() - 0.5) * 0.01
    ]);
  }
  
  return coordinates;
};

const getRandomWeather = () => {
  const weather = [
    '☀️ Sunny, 22°C', '⛅ Partly Cloudy, 19°C', '☁️ Cloudy, 18°C',
    '🌤️ Mostly Sunny, 16°C', '🌦️ Light Rain, 15°C', '❄️ Cold, 8°C',
    '🌡️ Hot, 28°C', '💨 Windy, 20°C', '🌈 Clear after rain, 17°C'
  ];
  return weather[Math.floor(Math.random() * weather.length)];
};

const generateDemoUser = () => ({
  name: 'Alex Fitness',
  email: 'demo@stravatracker.com',
  id: 'github_pages_demo_user',
  profile_picture: '🏃‍♂️',
  join_date: '2024-01-15',
  location: 'San Francisco, CA',
  bio: 'Passionate about fitness and outdoor adventures! 🌟',
  total_activities: 127,
  total_distance: 1247.8,
  total_time: 198720, // 55.2 hours
  followers: 89,
  following: 134
});

const generateDemoSettings = () => ({
  theme: 'light',
  units: 'metric',
  notifications: true,
  privacy: 'friends',
  auto_detect_activities: true,
  show_heart_rate: true,
  weekly_goals: {
    distance: 25,
    activities: 4,
    calories: 2000,
    time: 300 // 5 hours
  }
});

const generateAchievements = () => [
  { id: 1, name: 'First Steps', icon: '👶', earned: true, date: '2024-01-16', description: 'Complete your first activity' },
  { id: 2, name: 'Week Warrior', icon: '📅', earned: true, date: '2024-01-22', description: 'Stay active for 7 consecutive days' },
  { id: 3, name: '5K Runner', icon: '🏃‍♂️', earned: true, date: '2024-02-05', description: 'Complete a 5K run' },
  { id: 4, name: 'Century Club', icon: '💯', earned: true, date: '2024-02-28', description: 'Log 100km total distance' },
  { id: 5, name: 'Mountain Climber', icon: '⛰️', earned: true, date: '2024-03-10', description: 'Gain 1000m elevation in activities' },
  { id: 6, name: 'Speed Demon', icon: '⚡', earned: true, date: '2024-04-12', description: 'Achieve 20+ km/h average speed' },
  { id: 7, name: 'Early Bird', icon: '🌅', earned: true, date: '2024-04-20', description: 'Complete 10 morning workouts' },
  { id: 8, name: 'Distance Master', icon: '🎯', earned: false, target: 'Complete a 20K run', progress: 62 },
  { id: 9, name: 'Iron Person', icon: '🦾', earned: false, target: 'Log 50 activities', progress: 78 },
  { id: 10, name: 'Calorie Crusher', icon: '🔥', earned: false, target: 'Burn 10,000 calories total', progress: 45 }
];

const generateDemoStats = () => ({
  thisWeek: {
    activities: 4,
    distance: 28.7,
    time: 8640, // 2.4 hours
    calories: 1340,
    elevation: 234
  },
  thisMonth: {
    activities: 12,
    distance: 96.3,
    time: 29520, // 8.2 hours
    calories: 4680,
    elevation: 892
  },
  allTime: {
    activities: 127,
    distance: 1247.8,
    time: 198720, // 55.2 hours
    calories: 68540,
    elevation: 12450,
    longestRun: 21.1,
    fastestPace: 3.2, // min/km
    bestWeek: 45.6 // km
  }
});

export default { initializeDemoData };
