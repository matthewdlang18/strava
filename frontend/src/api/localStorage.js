// Local Storage API for GitHub Pages deployment
// Replaces MongoDB with browser local storage

class LocalStorageAPI {
  constructor() {
    this.storageKey = 'strava_fittracker_data';
    this.initializeStorage();
  }

  initializeStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({
        activities: [],
        user: null,
        settings: {}
      }));
    }
  }

  getData() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || {
        activities: [],
        user: null,
        settings: {}
      };
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return { activities: [], user: null, settings: {} };
    }
  }

  saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  // Mock API methods
  async getActivities() {
    const data = this.getData();
    return { activities: data.activities || [] };
  }

  async saveActivity(activity) {
    const data = this.getData();
    activity.id = Date.now().toString();
    activity.created_at = new Date().toISOString();
    data.activities.push(activity);
    this.saveData(data);
    return { success: true, activity };
  }

  async deleteActivity(id) {
    const data = this.getData();
    data.activities = data.activities.filter(activity => activity.id !== id);
    this.saveData(data);
    return { success: true };
  }

  async getUser() {
    const data = this.getData();
    return { user: data.user };
  }

  async saveUser(user) {
    const data = this.getData();
    data.user = user;
    this.saveData(data);
    return { success: true, user };
  }

  // Demo data population
  populateDemoData() {
    const today = new Date();
    const demoData = {
      activities: [
        {
          id: '1',
          name: 'Morning Run 🌅',
          type: 'Run',
          distance: 5.2,
          duration: 1800, // 30 minutes
          calories: 320,
          avg_speed: 10.4,
          max_speed: 15.2,
          elevation_gain: 45,
          avg_heart_rate: 145,
          max_heart_rate: 168,
          weather: '☀️ Sunny, 22°C',
          date: today.toISOString(),
          created_at: today.toISOString(),
          has_map: true,
          route_coordinates: [
            [37.7749, -122.4194], [37.7759, -122.4184], [37.7769, -122.4174],
            [37.7779, -122.4164], [37.7789, -122.4154], [37.7799, -122.4144]
          ]
        },
        {
          id: '2',
          name: 'Evening Bike Ride 🚴‍♂️',
          type: 'Ride',
          distance: 15.8,
          duration: 2700, // 45 minutes
          calories: 480,
          avg_speed: 21.1,
          max_speed: 35.4,
          elevation_gain: 234,
          avg_heart_rate: 132,
          max_heart_rate: 158,
          weather: '⛅ Partly Cloudy, 19°C',
          date: new Date(Date.now() - 86400000).toISOString(),
          created_at: new Date(Date.now() - 86400000).toISOString(),
          has_map: true,
          route_coordinates: [
            [37.7849, -122.4094], [37.7859, -122.4084], [37.7869, -122.4074],
            [37.7879, -122.4064], [37.7889, -122.4054], [37.7899, -122.4044]
          ]
        },
        {
          id: '3',
          name: 'Weekend Trail Hike 🥾',
          type: 'Hike',
          distance: 8.5,
          duration: 4200, // 70 minutes
          calories: 540,
          avg_speed: 7.3,
          max_speed: 12.8,
          elevation_gain: 456,
          avg_heart_rate: 128,
          max_heart_rate: 155,
          weather: '🌤️ Mostly Sunny, 16°C',
          date: new Date(Date.now() - 172800000).toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString(),
          has_map: true,
          route_coordinates: [
            [37.7949, -122.3994], [37.7959, -122.3984], [37.7969, -122.3974],
            [37.7979, -122.3964], [37.7989, -122.3954], [37.7999, -122.3944]
          ]
        },
        {
          id: '4',
          name: 'Lunch Break Walk 🚶‍♀️',
          type: 'Walk',
          distance: 2.1,
          duration: 1200, // 20 minutes
          calories: 85,
          avg_speed: 6.3,
          max_speed: 8.1,
          elevation_gain: 12,
          weather: '☁️ Cloudy, 18°C',
          date: new Date(Date.now() - 259200000).toISOString(),
          created_at: new Date(Date.now() - 259200000).toISOString(),
          has_map: false
        },
        {
          id: '5',
          name: 'Gym Workout 💪',
          type: 'Workout',
          distance: 0,
          duration: 3600, // 60 minutes
          calories: 425,
          avg_heart_rate: 140,
          max_heart_rate: 175,
          date: new Date(Date.now() - 345600000).toISOString(),
          created_at: new Date(Date.now() - 345600000).toISOString(),
          has_map: false,
          notes: 'Upper body strength training'
        },
        {
          id: '6',
          name: 'Long Weekend Run 🏃‍♂️',
          type: 'Run',
          distance: 12.5,
          duration: 4500, // 75 minutes
          calories: 780,
          avg_speed: 10.0,
          max_speed: 16.8,
          elevation_gain: 89,
          avg_heart_rate: 148,
          max_heart_rate: 172,
          weather: '🌦️ Light Rain, 15°C',
          date: new Date(Date.now() - 432000000).toISOString(),
          created_at: new Date(Date.now() - 432000000).toISOString(),
          has_map: true,
          route_coordinates: [
            [37.8049, -122.3894], [37.8059, -122.3884], [37.8069, -122.3874],
            [37.8079, -122.3864], [37.8089, -122.3854], [37.8099, -122.3844],
            [37.8109, -122.3834], [37.8119, -122.3824], [37.8129, -122.3814]
          ]
        }
      ],
      user: {
        name: 'Alex Runner',
        email: 'demo@stravatracker.com',
        id: 'demo_user_2025',
        profile_picture: '🏃‍♂️',
        join_date: '2024-01-15',
        total_activities: 47,
        total_distance: 284.6,
        total_time: 89400, // 24.8 hours
        achievements: [
          { id: 1, name: 'First Run', icon: '🥇', earned: true, date: '2024-01-16' },
          { id: 2, name: 'Week Warrior', icon: '📅', earned: true, date: '2024-01-22' },
          { id: 3, name: '50K Hero', icon: '🏃‍♂️', earned: true, date: '2024-02-15' },
          { id: 4, name: 'Mountain Climber', icon: '⛰️', earned: true, date: '2024-03-10' },
          { id: 5, name: 'Speed Demon', icon: '⚡', earned: false, target: 'Run 5K in under 20 minutes' },
          { id: 6, name: 'Century Rider', icon: '🚴‍♂️', earned: false, target: 'Bike 100K in one ride' }
        ],
        personal_records: {
          fastest_5k: { time: 1260, date: '2024-04-12' }, // 21:00
          longest_run: { distance: 12.5, date: '2024-05-26' },
          fastest_bike_ride: { speed: 35.4, date: '2024-05-30' },
          most_elevation: { elevation: 456, date: '2024-05-29' }
        },
        weekly_goals: {
          distance: 25,
          activities: 4,
          calories: 2000
        },
        preferences: {
          units: 'metric',
          public_profile: false,
          email_notifications: true
        }
      },
      settings: {
        theme: 'light',
        units: 'metric',
        notifications: true
      }
    };
    
    this.saveData(demoData);
    return demoData;
  }

  // Clear all data
  clearData() {
    localStorage.removeItem(this.storageKey);
    this.initializeStorage();
  }

  // Export data
  exportData() {
    return this.getData();
  }

  // Import data
  importData(data) {
    try {
      this.saveData(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new LocalStorageAPI();
