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
    const demoData = {
      activities: [
        {
          id: '1',
          name: 'Morning Run',
          type: 'Run',
          distance: 5.2,
          duration: 1800,
          calories: 320,
          date: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Evening Bike Ride',
          type: 'Ride',
          distance: 15.8,
          duration: 2700,
          calories: 480,
          date: new Date(Date.now() - 86400000).toISOString(),
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          name: 'Weekend Hike',
          type: 'Hike',
          distance: 8.5,
          duration: 4200,
          calories: 540,
          date: new Date(Date.now() - 172800000).toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ],
      user: {
        name: 'Demo User',
        email: 'demo@stravaapp.com',
        id: 'demo_user',
        profile_picture: '🏃‍♂️'
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
