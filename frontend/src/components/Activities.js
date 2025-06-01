import React from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw } from 'react-icons/fi';
import { formatTime, formatDate, getSportIcon } from '../utils/helpers';

const Activities = ({ activities, loadActivities, loadActivityDetail, isLoading }) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  if (isLoading && activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your activities...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Activities</h2>
        <div className="flex space-x-2">
          <motion.button
            onClick={loadActivities}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiRefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </motion.button>
        </div>
      </div>

      {/* Activities List */}
      {activities.length > 0 ? (
        <div className="grid gap-4">
          {activities.map((activity, index) => (
            <motion.div 
              key={activity.id} 
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-all cursor-pointer activity-card group"
              onClick={() => loadActivityDetail(activity.id)}
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2, scale: 1.01 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform">
                    {getSportIcon(activity.type || activity.sport_type)}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg group-hover:text-orange-600 transition-colors">
                      {activity.name}
                    </h3>
                    <p className="text-gray-600">
                      {formatDate(activity.date)} • {activity.type || activity.sport_type}
                    </p>
                    <div className="flex space-x-2 mt-2">
                      {activity.has_map && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          🗺️ Route
                        </span>
                      )}
                      {activity.avg_heart_rate && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          💗 HR
                        </span>
                      )}
                      {activity.weather && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          🌤️ Weather
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="grid grid-cols-4 gap-6 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {activity.distance ? activity.distance.toFixed(1) : '0.0'}
                      </p>
                      <p className="text-sm text-gray-600">km</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatTime(activity.duration)}
                      </p>
                      <p className="text-sm text-gray-600">time</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {activity.avg_speed ? activity.avg_speed.toFixed(1) : '0.0'}
                      </p>
                      <p className="text-sm text-gray-600">km/h</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {activity.elevation_gain ? Math.round(activity.elevation_gain) : '0'}
                      </p>
                      <p className="text-sm text-gray-600">m</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Stats */}
              {(activity.avg_heart_rate || activity.calories || activity.weather) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {activity.avg_heart_rate && (
                      <span className="flex items-center">
                        💗 Avg HR: {Math.round(activity.avg_heart_rate)} bpm
                      </span>
                    )}
                    {activity.max_heart_rate && (
                      <span className="flex items-center">
                        ❤️ Max HR: {Math.round(activity.max_heart_rate)} bpm
                      </span>
                    )}
                    {activity.calories && (
                      <span className="flex items-center">
                        🔥 Calories: {Math.round(activity.calories)}
                      </span>
                    )}
                    {activity.weather && (
                      <span className="flex items-center">
                        🌤️ {activity.weather}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-4">🏃‍♂️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No activities found</h3>
          <p className="text-gray-600 mb-6">
            Your fitness activities will appear here once you start tracking!
          </p>
          <motion.button
            onClick={loadActivities}
            disabled={isLoading}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? 'Loading...' : 'Refresh Activities'}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Activities;