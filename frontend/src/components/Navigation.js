import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiActivity, 
  FiBarChart2, 
  FiAward, 
  FiStar, 
  FiDownload, 
  FiLogOut 
} from 'react-icons/fi';

const Navigation = ({ 
  currentView, 
  user, 
  navigateToView, 
  loadActivities, 
  loadPersonalRecords, 
  loadAchievements, 
  exportData, 
  handleLogout,
  isLoading 
}) => {
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: FiBarChart2, 
      action: () => navigateToView('dashboard') 
    },
    { 
      id: 'activities', 
      label: 'Activities', 
      icon: FiActivity, 
      action: loadActivities 
    },
    { 
      id: 'records', 
      label: 'Records', 
      icon: FiAward, 
      action: loadPersonalRecords 
    },
    { 
      id: 'achievements', 
      label: 'Achievements', 
      icon: FiStar, 
      action: loadAchievements 
    }
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and User Info */}
          <div className="flex items-center space-x-4">
            <motion.h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer"
              onClick={() => navigateToView('dashboard')}
              whileHover={{ scale: 1.05 }}
            >
              FitTracker Pro
            </motion.h1>
            
            {user && (
              <div className="hidden md:block">
                <span className="text-gray-600">
                  Welcome, {user.athlete?.name || 'Athlete'}! 🏆
                </span>
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full mt-1 inline-block ml-2">
                  🚀 Demo Mode
                </div>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={item.action}
                  disabled={isLoading}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all
                    ${isActive 
                      ? 'bg-orange-100 text-orange-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                    disabled:opacity-50
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="inline mr-2" size={16} />
                  <span className="hidden sm:inline">{item.label}</span>
                </motion.button>
              );
            })}

            {/* Export Button */}
            <motion.button
              onClick={exportData}
              className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiDownload className="inline mr-2" size={16} />
              <span className="hidden sm:inline">Export</span>
            </motion.button>

            {/* Logout Button */}
            <motion.button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-red-600 font-medium transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiLogOut className="inline mr-2" size={16} />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;