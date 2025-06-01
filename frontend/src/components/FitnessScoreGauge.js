import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const FitnessScoreGauge = ({ score = 85 }) => {
  const [ref, inView] = useInView({ triggerOnce: true });
  
  return (
    <div ref={ref} className="relative w-32 h-32 mx-auto">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
        {/* Background circle */}
        <path
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        {/* Progress circle */}
        <motion.path
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          strokeDasharray="100, 100"
          initial={{ strokeDashoffset: 100 }}
          animate={inView ? { strokeDashoffset: 100 - score } : { strokeDashoffset: 100 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="text-2xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            {score}
          </motion.div>
          <div className="text-xs text-white/80">Fitness Score</div>
        </div>
      </div>
    </div>
  );
};

export default FitnessScoreGauge;