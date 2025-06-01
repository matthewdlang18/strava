import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import { FiArrowLeft } from 'react-icons/fi';
import { formatTime, getSportIcon, formatDate } from '../utils/helpers';

const ActivityDetail = ({ activity, navigateToView, isLoading }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Initialize map when component mounts
  useEffect(() => {
    if (activity.route_coordinates && activity.route_coordinates.length > 0 && mapContainerRef.current) {
      initializeMap();
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [activity]);

  const initializeMap = async () => {
    try {
      const L = await import('leaflet');
      
      // Cleanup existing map
      if (mapRef.current) {
        mapRef.current.remove();
      }

      // Create new map
      const map = L.map(mapContainerRef.current, {
        center: activity.route_coordinates[0],
        zoom: 13,
        scrollWheelZoom: true
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add route polyline
      const getSportColor = (sportType) => {
        const colors = {
          'Run': '#10b981',
          'Ride': '#3b82f6',
          'Swim': '#06b6d4',
          'Walk': '#8b5cf6',
          'Hike': '#f59e0b',
          'Workout': '#ef4444'
        };
        return colors[sportType] || '#6b7280';
      };

      L.polyline(activity.route_coordinates, {
        color: getSportColor(activity.type),
        weight: 4,
        opacity: 0.8
      }).addTo(map);

      // Add start marker
      if (activity.route_coordinates.length > 0) {
        L.marker(activity.route_coordinates[0])
          .addTo(map)
          .bindPopup(`
            <div style="text-align: center;">
              <div style="color: #10b981; font-weight: bold;">🚀 START</div>
              <div style="font-size: 12px;">${activity.name}</div>
            </div>
          `);
      }

      // Add finish marker
      if (activity.route_coordinates.length > 1) {
        const lastPoint = activity.route_coordinates[activity.route_coordinates.length - 1];
        L.marker(lastPoint)
          .addTo(map)
          .bindPopup(`
            <div style="text-align: center;">
              <div style="color: #ef4444; font-weight: bold;">🏁 FINISH</div>
              <div style="font-size: 12px;">
                ${activity.distance ? `${activity.distance.toFixed(1)} km` : 'Unknown distance'}
              </div>
            </div>
          `);
      }

      // Fit map to route bounds
      if (activity.route_coordinates.length > 1) {
        const group = new L.featureGroup([L.polyline(activity.route_coordinates)]);
        map.fitBounds(group.getBounds().pad(0.1));
      }

      mapRef.current = map;
    } catch (error) {
      console.error('Error creating map:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading activity details...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❓</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Activity not found</h3>
        <p className="text-gray-600">The requested activity could not be loaded.</p>
      </div>
    );
  }

  const statsData = [
    { label: 'Distance', value: `${activity.distance?.toFixed(1) || '0.0'} km` },
    { label: 'Time', value: formatTime(activity.duration) },
    { label: 'Avg Speed', value: `${activity.avg_speed?.toFixed(1) || '0.0'} km/h` },
    { label: 'Max Speed', value: `${activity.max_speed?.toFixed(1) || '0.0'} km/h` },
    { label: 'Elevation', value: `${activity.elevation_gain || 0} m` },
    { label: 'Calories', value: `${activity.calories || 0} cal` }
  ];

  const heartRateData = activity.streams?.heartrate || [];
  const elevationData = activity.streams?.altitude || [];
  const timeLabels = activity.streams?.time?.map(t => Math.floor(t / 60)) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          onClick={() => navigateToView('activities')}
          className="flex items-center text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm border"
          whileHover={{ x: -5 }}
        >
          <FiArrowLeft className="mr-2" />
          Back to Activities
        </motion.button>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900">{activity.name}</h2>
          <p className="text-gray-600">{formatDate(activity.date)}</p>
        </div>
      </div>

      {/* Activity Summary */}
      <motion.div 
        className="bg-white rounded-xl p-6 shadow-sm border mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center mb-6">
          <span className="text-4xl mr-4">{getSportIcon(activity.type)}</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{activity.name}</h1>
            <p className="text-gray-600 text-lg">
              {activity.type} • {formatDate(activity.date)}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-6 gap-6">
          {statsData.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Map */}
      {activity.route_coordinates && activity.route_coordinates.length > 0 && (
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Route Map</h3>
          <div 
            ref={mapContainerRef} 
            style={{ height: '400px', width: '100%' }}
            className="rounded-lg overflow-hidden border"
          />
          
          {/* Route Stats */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="font-semibold text-gray-900">Route Distance</div>
              <div className="text-blue-600">
                {activity.distance ? `${activity.distance.toFixed(1)} km` : 'N/A'}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="font-semibold text-gray-900">Elevation Gain</div>
              <div className="text-orange-600">
                {activity.elevation_gain ? `${Math.round(activity.elevation_gain)} m` : 'N/A'}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="font-semibold text-gray-900">GPS Points</div>
              <div className="text-green-600">{activity.route_coordinates.length} points</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="font-semibold text-gray-900">Avg Grade</div>
              <div className="text-purple-600">
                {activity.distance && activity.elevation_gain 
                  ? `${((activity.elevation_gain / (activity.distance * 1000)) * 100).toFixed(1)}%`
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Charts */}
      {(heartRateData.length > 0 || elevationData.length > 0) && (
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Performance Analysis</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Heart Rate Chart */}
            {heartRateData.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Heart Rate</h4>
                <div className="h-64">
                  <Line 
                    data={{
                      labels: timeLabels,
                      datasets: [{
                        label: 'Heart Rate (bpm)',
                        data: heartRateData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.1,
                        pointRadius: 0,
                        borderWidth: 2
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { 
                          title: { display: true, text: 'Time (min)' },
                          grid: { display: false }
                        },
                        y: { 
                          title: { display: true, text: 'Heart Rate (bpm)' },
                          grid: { color: 'rgba(0,0,0,0.1)' }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Elevation Chart */}
            {elevationData.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Elevation Profile</h4>
                <div className="h-64">
                  <Line 
                    data={{
                      labels: timeLabels,
                      datasets: [{
                        label: 'Elevation (m)',
                        data: elevationData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.1,
                        pointRadius: 0,
                        borderWidth: 2,
                        fill: true
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { 
                          title: { display: true, text: 'Time (min)' },
                          grid: { display: false }
                        },
                        y: { 
                          title: { display: true, text: 'Elevation (m)' },
                          grid: { color: 'rgba(0,0,0,0.1)' }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Lap Analysis */}
      {activity.laps && activity.laps.length > 0 && (
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Lap Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold">Lap</th>
                  <th className="text-right py-3 px-4 font-semibold">Distance</th>
                  <th className="text-right py-3 px-4 font-semibold">Time</th>
                  <th className="text-right py-3 px-4 font-semibold">Pace</th>
                  <th className="text-right py-3 px-4 font-semibold">Avg HR</th>
                </tr>
              </thead>
              <tbody>
                {activity.laps.map((lap, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">Lap {lap.lap_index}</td>
                    <td className="text-right py-3 px-4">
                      {lap.distance ? (lap.distance / 1000).toFixed(2) : '0.00'} km
                    </td>
                    <td className="text-right py-3 px-4">{formatTime(lap.moving_time)}</td>
                    <td className="text-right py-3 px-4">
                      {lap.average_speed ? (lap.average_speed * 3.6).toFixed(1) : '0.0'} km/h
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={lap.average_heartrate ? 'text-red-600' : 'text-gray-400'}>
                        {lap.average_heartrate ? Math.round(lap.average_heartrate) : '--'} bpm
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Additional Details */}
      <motion.div 
        className="bg-white rounded-xl p-6 shadow-sm border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Activity Details</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Performance</h4>
            <div className="space-y-2 text-sm text-gray-600">
              {activity.avg_heart_rate && (
                <div>💗 Average Heart Rate: {Math.round(activity.avg_heart_rate)} bpm</div>
              )}
              {activity.max_heart_rate && (
                <div>❤️ Max Heart Rate: {Math.round(activity.max_heart_rate)} bpm</div>
              )}
              {activity.calories && (
                <div>🔥 Calories Burned: {Math.round(activity.calories)}</div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Environment</h4>
            <div className="space-y-2 text-sm text-gray-600">
              {activity.weather && (
                <div>🌤️ Weather: {activity.weather}</div>
              )}
              <div>📅 Activity Type: {activity.type}</div>
              <div>⏰ Started: {new Date(activity.date).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ActivityDetail;