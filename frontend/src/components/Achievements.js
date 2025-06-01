import React from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiLock, FiCheck, FiTrendingUp } from 'react-icons/fi';
import { formatDate } from '../utils/helpers';

const Achievements = ({ achievements, loadAchievements, isLoading }) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  if (isLoading && achievements.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your achievements...</p>
      </div>
    );
  }

  const earnedAchievements = achievements.filter(a => a.earned);
  const lockedAchievements = achievements.filter(a => !a.earned);

  const getAchievementCategory = (name) => {
    const categories = {
      distance: ['distance', 'km', 'marathon', 'century'],
      consistency: ['week', 'day', 'streak', 'consistent'],
      speed: ['speed', 'fast', 'pace', 'quick'],
      milestone: ['first', 'milestone', 'club', 'member'],
      challenge: ['challenge', 'beast', 'hero', 'master']
    };

    const lowerName = name.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }
    return 'general';
  };

  const getCategoryColor = (category) => {
    const colors = {
      distance: 'from-blue-500 to-blue-600',
      consistency: 'from-green-500 to-green-600',
      speed: 'from-yellow-500 to-orange-500',
      milestone: 'from-purple-500 to-purple-600',
      challenge: 'from-red-500 to-pink-500',
      general: 'from-gray-500 to-gray-600'
    };
    return colors[category] || colors.general;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      distance: '🎯',
      consistency: '📅',
      speed: '⚡',
      milestone: '🏆',
      challenge: '🔥',
      general: '🏅'
    };
    return icons[category] || icons.general;
  };

  const achievementCategories = achievements.reduce((acc, achievement) => {
    const category = getAchievementCategory(achievement.name);
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
          <p className="text-gray-600 mt-1">
            {earnedAchievements.length} of {achievements.length} achievements unlocked
          </p>
        </div>
        <motion.button
          onClick={loadAchievements}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiRefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </motion.button>
      </div>

      {achievements.length > 0 ? (
        <div className="space-y-8">
          {/* Progress Overview */}
          <motion.div 
            className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">Achievement Progress</h3>
                <p className="text-purple-100">Keep pushing your limits!</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {Math.round((earnedAchievements.length / achievements.length) * 100)}%
                </div>
                <div className="text-purple-100">Complete</div>
              </div>
            </div>
            
            <div className="w-full bg-purple-400/30 rounded-full h-3">
              <motion.div 
                className="bg-white rounded-full h-3"
                initial={{ width: 0 }}
                animate={{ width: `${(earnedAchievements.length / achievements.length) * 100}%` }}
                transition={{ delay: 0.5, duration: 1 }}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div>
                <div className="text-2xl font-bold">{earnedAchievements.length}</div>
                <div className="text-purple-100 text-sm">Earned</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{lockedAchievements.length}</div>
                <div className="text-purple-100 text-sm">Remaining</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {lockedAchievements.filter(a => a.progress && a.progress > 50).length}
                </div>
                <div className="text-purple-100 text-sm">Nearly There</div>
              </div>
            </div>
          </motion.div>

          {/* Earned Achievements */}
          {earnedAchievements.length > 0 && (
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FiCheck className="mr-2 text-green-500" />
                Earned Achievements ({earnedAchievements.length})
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {earnedAchievements.map((achievement, index) => {
                  const category = getAchievementCategory(achievement.name);
                  return (
                    <motion.div 
                      key={achievement.id}
                      className={`bg-gradient-to-br ${getCategoryColor(category)} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">
                          {achievement.icon || getCategoryIcon(category)}
                        </div>
                        <h4 className="font-bold text-lg mb-2">{achievement.name}</h4>
                        <p className="text-white/90 text-sm mb-3">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-center text-xs text-white/80">
                          <FiCheck className="mr-1" size={12} />
                          Earned {formatDate(achievement.date || achievement.earned_at)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Locked Achievements */}
          {lockedAchievements.length > 0 && (
            <motion.div 
              variants={fadeInUp} 
              initial="initial" 
              animate="animate"
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FiLock className="mr-2 text-gray-500" />
                Locked Achievements ({lockedAchievements.length})
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lockedAchievements.map((achievement, index) => {
                  const category = getAchievementCategory(achievement.name);
                  const progress = achievement.progress || 0;
                  
                  return (
                    <motion.div 
                      key={achievement.id}
                      className="bg-white rounded-xl p-6 shadow-sm border-2 border-dashed border-gray-200 hover:border-orange-300 transition-all"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -2 }}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3 grayscale opacity-50">
                          {achievement.icon || getCategoryIcon(category)}
                        </div>
                        <h4 className="font-bold text-lg mb-2 text-gray-700">
                          {achievement.name}
                        </h4>
                        <p className="text-gray-600 text-sm mb-3">
                          {achievement.description || achievement.target}
                        </p>
                        
                        {progress > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <motion.div 
                                className="bg-orange-500 rounded-full h-2"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ delay: 0.5, duration: 1 }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-center text-xs text-gray-500">
                          <FiLock className="mr-1" size={12} />
                          {achievement.target ? `Target: ${achievement.target}` : 'Locked'}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-4">🏅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No achievements yet</h3>
          <p className="text-gray-600 mb-6">
            Start your fitness journey to unlock your first achievements!
          </p>
          <motion.button
            onClick={loadAchievements}
            disabled={isLoading}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? 'Loading...' : 'Refresh Achievements'}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Achievements;