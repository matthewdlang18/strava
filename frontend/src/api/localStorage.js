// Local Storage Service for GitHub Pages deployment
// Handles all data persistence using browser localStorage

class LocalStorageService {
  constructor() {
    this.storageKey = 'fittracker_pro_data';
    this.versionKey = 'fittracker_pro_version';
    this.currentVersion = '2.0.0';
  }

  // Initialize storage with default structure
  initializeStorage() {
    if (!this.hasData() || this.needsUpgrade()) {
      const defaultData = {
        user: null,
        activities: [],
        achievements: [],
        settings: {
          theme: 'light',
          units: 'metric',
          notifications: true
        },
        stats: {
          thisWeek: { activities: 0, distance: 0, time: 0, calories: 0 },
          thisMonth: { activities: 0, distance: 0, time: 0, calories: 0 },
          allTime: { activities: 0, distance: 0, time: 0, calories: 0 }
        }
      };
      
      this.saveData(defaultData);
      localStorage.setItem(this.versionKey, this.currentVersion);
      console.log('✅ Storage initialized with default data');
    }
  }

  // Check if storage has data
  hasData() {
    return localStorage.getItem(this.storageKey) !== null;
  }

  // Check if data needs upgrade
  needsUpgrade() {
    const version = localStorage.getItem(this.versionKey);
    return version !== this.currentVersion;
  }

  // Get all data from storage
  getData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : this.getDefaultData();
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return this.getDefaultData();
    }
  }

  // Get default data structure
  getDefaultData() {
    return {
      user: null,
      activities: [],
      achievements: [],
      settings: {
        theme: 'light',
        units: 'metric',
        notifications: true
      },
      stats: {
        thisWeek: { activities: 0, distance: 0, time: 0, calories: 0 },
        thisMonth: { activities: 0, distance: 0, time: 0, calories: 0 },
        allTime: { activities: 0, distance: 0, time: 0, calories: 0 }
      }
    };
  }

  // Save data to storage
  saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return { success: true };
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return { success: false, error: error.message };
    }
  }

  // Get activities
  getActivities() {
    const data = this.getData();
    return data.activities || [];
  }

  // Save activity
  saveActivity(activity) {
    try {
      const data = this.getData();
      
      // Generate ID if not provided
      if (!activity.id) {
        activity.id = Date.now().toString();
      }
      
      // Add timestamps
      activity.created_at = activity.created_at || new Date().toISOString();
      activity.updated_at = new Date().toISOString();
      
      // Add or update activity
      const existingIndex = data.activities.findIndex(a => a.id === activity.id);
      if (existingIndex >= 0) {
        data.activities[existingIndex] = activity;
      } else {
        data.activities.push(activity);
      }
      
      // Sort by date (newest first)
      data.activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      this.saveData(data);
      this.updateStats(data);
      
      return { success: true, activity };
    } catch (error) {
      console.error('Error saving activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete activity
  deleteActivity(id) {
    try {
      const data = this.getData();
      const originalLength = data.activities.length;
      data.activities = data.activities.filter(activity => activity.id !== id);
      
      if (data.activities.length < originalLength) {
        this.saveData(data);
        this.updateStats(data);
        return { success: true };
      } else {
        return { success: false, error: 'Activity not found' };
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user data
  getUser() {
    const data = this.getData();
    return data.user;
  }

  // Save user data
  saveUser(user) {
    try {
      const data = this.getData();
      data.user = {
        ...data.user,
        ...user,
        updated_at: new Date().toISOString()
      };
      
      this.saveData(data);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Error saving user:', error);
      return { success: false, error: error.message };
    }
  }

  // Get achievements
  getAchievements() {
    const data = this.getData();
    return data.achievements || [];
  }

  // Save achievement
  saveAchievement(achievement) {
    try {
      const data = this.getData();
      
      if (!achievement.id) {
        achievement.id = Date.now().toString();
      }
      
      achievement.earned_at = achievement.earned_at || new Date().toISOString();
      
      const existingIndex = data.achievements.findIndex(a => a.id === achievement.id);
      if (existingIndex >= 0) {
        data.achievements[existingIndex] = achievement;
      } else {
        data.achievements.push(achievement);
      }
      
      this.saveData(data);
      return { success: true, achievement };
    } catch (error) {
      console.error('Error saving achievement:', error);
      return { success: false, error: error.message };
    }
  }

  // Update calculated stats
  updateStats(data = null) {
    try {
      if (!data) data = this.getData();
      
      const activities = data.activities || [];
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Calculate this week stats
      const thisWeekActivities = activities.filter(a => new Date(a.date) >= weekAgo);
      data.stats.thisWeek = this.calculateStatsFromActivities(thisWeekActivities);
      
      // Calculate this month stats
      const thisMonthActivities = activities.filter(a => new Date(a.date) >= monthAgo);
      data.stats.thisMonth = this.calculateStatsFromActivities(thisMonthActivities);
      
      // Calculate all time stats
      data.stats.allTime = this.calculateStatsFromActivities(activities);
      
      this.saveData(data);
      return { success: true };
    } catch (error) {
      console.error('Error updating stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate stats from activities array
  calculateStatsFromActivities(activities) {
    return {
      activities: activities.length,
      distance: activities.reduce((sum, a) => sum + (a.distance || 0), 0),
      time: activities.reduce((sum, a) => sum + (a.duration || 0), 0),
      calories: activities.reduce((sum, a) => sum + (a.calories || 0), 0),
      elevation: activities.reduce((sum, a) => sum + (a.elevation_gain || 0), 0)
    };
  }

  // Export data as JSON
  exportData() {
    const data = this.getData();
    return {
      ...data,
      exported_at: new Date().toISOString(),
      version: this.currentVersion
    };
  }

  // Import data from JSON
  importData(importedData) {
    try {
      // Validate data structure
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Invalid data format');
      }
      
      // Merge with existing data, preserving user preferences
      const currentData = this.getData();
      const mergedData = {
        ...currentData,
        ...importedData,
        settings: {
          ...currentData.settings,
          ...importedData.settings
        },
        imported_at: new Date().toISOString()
      };
      
      this.saveData(mergedData);
      this.updateStats(mergedData);
      
      return { success: true };
    } catch (error) {
      console.error('Error importing data:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear all data
  clearData() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.versionKey);
      this.initializeStorage();
      return { success: true };
    } catch (error) {
      console.error('Error clearing data:', error);
      return { success: false, error: error.message };
    }
  }

  // Get storage usage info
  getStorageInfo() {
    try {
      const data = JSON.stringify(this.getData());
      const sizeInBytes = new Blob([data]).size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      
      return {
        success: true,
        size: {
          bytes: sizeInBytes,
          kb: sizeInKB,
          readable: sizeInKB < 1024 ? `${sizeInKB} KB` : `${(sizeInKB / 1024).toFixed(2)} MB`
        },
        itemCount: {
          activities: this.getActivities().length,
          achievements: this.getAchievements().length
        }
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new LocalStorageService();