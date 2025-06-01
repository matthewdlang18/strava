import React from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiTrendingUp, FiAward, FiTarget } from 'react-icons/fi';
import { formatDate, getSportIcon } from '../utils/helpers';

const PersonalRecords = ({ records, loadPersonalRecords, isLoading }) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  if (isLoading && records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your personal records...</p>
      </div>
    );
  }

  const recordCategories = {
    distance: records.filter(r => r.type.toLowerCase().includes('distance') || r.type.toLowerCase().includes('longest')),
    speed: records.filter(r => r.type.toLowerCase().includes('fastest') || r.type.toLowerCase().includes('speed')),
    endurance: records.filter(r => r.type.toLowerCase().includes('time') || r.type.toLowerCase().includes('duration')),
    power: records.filter(r => r.type.toLowerCase().includes('elevation') || r.type.toLowerCase().includes('calories') || r.type.toLowerCase().includes('power'))
  };

  const getCategoryIcon = (category) => {
    const icons = {
      distance: <FiTarget className="text-blue-500" />,
      speed: <FiTrendingUp className="text-green-500" />,
      endurance: <FiAward className="text-purple-500" />,
      power: <FiAward className="text-orange-500" />
    };
    return icons[category] || <FiAward className="text-gray-500" />;
  };

  const getCategoryTitle = (category) => {
    const titles = {
      distance: 'Distance Records',
      speed: 'Speed Records',
      endurance: 'Endurance Records',
      power: 'Power & Elevation Records'
    };
    return titles[category] || 'Other Records';
  };

  const getRecordColor = (type) => {
    if (type.toLowerCase().includes('fastest') || type.toLowerCase().includes('speed')) return 'text-green-600';
    if (type.toLowerCase().includes('longest') || type.toLowerCase().includes('distance')) return 'text-blue-600';
    if (type.toLowerCase().includes('elevation') || type.toLowerCase().includes('climb')) return 'text-orange-600';
    if (type.toLowerCase().includes('calories') || type.toLowerCase().includes('power')) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personal Records</h2>
          <p className="text-gray-600 mt-1">Your best performances across all activities</p>
        </div>
        <motion.button
          onClick={loadPersonalRecords}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiRefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </motion.button>
      </div>

      {records.length > 0 ? (
        <div className="space-y-8">
          {/* Summary Cards */}
          <motion.div 
            className="grid md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {Object.entries(recordCategories).map(([category, categoryRecords], index) => (
              <motion.div
                key={category}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-sm border hover:shadow-md transition-all"
                whileHover={{ y: -3 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl">{getCategoryIcon(category)}</div>
                  <span className="text-2xl font-bold text-gray-900">{categoryRecords.length}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{getCategoryTitle(category)}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {categoryRecords.length > 0 ? 'Records achieved' : 'No records yet'}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* All Records List */}
          <motion.div
            className="bg-white rounded-xl p-6 shadow-sm border"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900">All Personal Records</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold">Record Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Sport</th>
                    <th className="text-right py-3 px-4 font-semibold">Value</th>
                    <th className="text-right py-3 px-4 font-semibold">Date Achieved</th>
                    <th className="text-left py-3 px-4 font-semibold">Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <motion.tr 
                      key={record.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">🏆</span>
                          <span className="font-medium text-gray-900">{record.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span>{getSportIcon(record.sport)}</span>
                          <span className="text-gray-700">{record.sport}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={`font-bold ${getRecordColor(record.type)}`}>
                          {record.value} {record.unit}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        {formatDate(record.date)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {record.activity_name || 'Unknown Activity'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No personal records yet</h3>
          <p className="text-gray-600 mb-6">
            Complete more activities to start setting personal records and track your progress!
          </p>
          <motion.button
            onClick={loadPersonalRecords}
            disabled={isLoading}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? 'Loading...' : 'Refresh Records'}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PersonalRecords;