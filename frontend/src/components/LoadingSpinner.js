import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="inline-block w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p 
          className="text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {message}
        </motion.p>
        <motion.div
          className="mt-2 text-orange-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          🏃‍♂️ Preparing your fitness data...
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;