import React from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { 
  FiActivity, 
  FiTrendingUp, 
  FiAward, 
  FiStar, 
  FiHeart, 
  FiZap, 
  FiMapPin, 
  FiClock 
} from 'react-icons/fi';
import FitnessScoreGauge from './FitnessScoreGauge';
import { formatTime, getSportIcon, getSportColor } from '../utils/helpers';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = ({ 
  dashboardData, 
  loadActivityDetail, 
  loadPersonalRecords, 
  loadAchievements,
  isLoading 
}) => {
  if (isLoading || !dashboardData) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your comprehensive fitness dashboard...</p>
      </div>
    );
  }

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

  const statsCards = [
    { 
      label: "Total Activities", 
      value: dashboardData.total_activities, 
      icon: <FiActivity />, 
      color: "blue" 
    },
    { 
      label: "Total Distance", 
      value: `${Math.round(dashboardData.total_distance || 0)} km`, 
      icon: <FiMapPin />, 
      color: "green" 
    },
    { 
      label: "Total Time", 
      value: formatTime(dashboardData.total_time || 0), 
      icon: <FiClock />, 
      color: "purple" 
    },
    { 
      label: "Avg Speed", 
      value: `${((dashboardData.total_distance || 0) / ((dashboardData.total_time || 1) / 3600)).toFixed(1)} km/h`, 
      icon: <FiZap />, 
      color: "yellow" 
    },
    { 
      label: "Total Elevation", 
      value: `${Math.round(dashboardData.total_elevation || 0)} m`, 
      icon: <FiTrendingUp />, 
      color: "orange" 
    },
    { 
      label: "Activities This Week", 
      value: dashboardData.stats?.thisWeek?.activities || 0, 
      icon: <FiHeart />, 
      color: "red" 
    }
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      {/* Hero Stats Section */}
      <motion.div 
        className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 text-white"
        variants={fadeInUp}
      >
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Your Fitness Journey</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-orange-100 text-sm">Activities This Week</p>
                <p className="text-3xl font-bold">{dashboardData.stats?.thisWeek?.activities || 0}</p>
              </div>
              <div>
                <p className="text-orange-100 text-sm">Distance This Week</p>
                <p className="text-3xl font-bold">{dashboardData.stats?.thisWeek?.distance || 0} km</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-orange-100 text-sm">Training Progress</p>
              <div className="w-full bg-orange-400/30 rounded-full h-2 mt-2">
                <motion.div 
                  className="bg-white rounded-full h-2"
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  transition={{ delay: 0.5, duration: 1 }}
                />
              </div>
            </div>
          </div>
          <div className="text-center">
            <FitnessScoreGauge score={85} />
          </div>
        </div>
      </motion.div>

      {/* Enhanced Stats Grid */}
      <motion.div 
        className="grid md:grid-cols-6 gap-6"
        variants={staggerContainer}
      >
        {statsCards.map((stat, index) => (
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

      {/* Charts Row */}
      <motion.div 
        className="grid md:grid-cols-3 gap-6"
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
              labels: dashboardData.monthly_distance?.map(d => d.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
              datasets: [{
                label: 'Distance (km)',
                data: dashboardData.monthly_distance?.map(d => d.distance) || [20, 35, 45, 60, 55],
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
              labels: Object.keys(dashboardData.activities_by_sport || { Run: 15, Ride: 8, Hike: 5, Walk: 2 }),
              datasets: [{
                data: Object.values(dashboardData.activities_by_sport || { Run: 15, Ride: 8, Hike: 5, Walk: 2 }),
                backgroundColor: Object.keys(dashboardData.activities_by_sport || { Run: 15, Ride: 8, Hike: 5, Walk: 2 }).map(sport => getSportColor(sport)),
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
                data: Object.values(dashboardData.heartrate_zones || { zone1: 20, zone2: 30, zone3: 25, zone4: 15, zone5: 10 }),
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
      <div className="grid md:grid-cols-2 gap-6">
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
            {(dashboardData.personal_records || [
              { type: 'Longest Run', sport: 'Run', date: '2024-05-26', value: '15.2', unit: 'km' },
              { type: 'Fastest 5K', sport: 'Run', date: '2024-04-12', value: '21:30', unit: 'time' },
              { type: 'Longest Ride', sport: 'Ride', date: '2024-05-20', value: '45.8', unit: 'km' }
            ]).slice(0, 3).map((pr, index) => (
              <motion.div 
                key={index}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div>
                  <p className="font-medium text-gray-900">{pr.type}</p>
                  <p className="text-sm text-gray-600">{pr.sport} • {pr.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-yellow-600">{pr.value} {pr.unit}</p>
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
            {(dashboardData.recent_achievements || [
              { icon: '🏆', name: 'Distance Master', description: 'Completed 500km total distance', date: '2024-05-28' },
              { icon: '⚡', name: 'Speed Demon', description: 'Achieved 20+ km/h average speed', date: '2024-04-12' },
              { icon: '🌅', name: 'Early Bird', description: 'Completed 10 morning workouts', date: '2024-04-20' }
            ]).slice(0, 3).map((achievement, index) => (
              <motion.div 
                key={index}
                className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <p className="font-medium text-gray-900">{achievement.name}</p>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  <p className="text-xs text-purple-600">{achievement.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activities */}
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
                onClick={() => activity.id && loadActivityDetail(activity.id)}
                whileHover={{ x: 4 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{getSportIcon(activity.type || activity.sport_type)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{activity.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(activity.date).toLocaleDateString()} • {activity.type || activity.sport_type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {activity.distance ? `${activity.distance.toFixed(1)} km` : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatTime(activity.duration)} • {activity.avg_speed?.toFixed(1) || 'N/A'} km/h
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard;