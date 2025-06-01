import React from 'react';
import { motion } from 'framer-motion';

const WelcomeScreen = ({ onLogin, isLoading }) => {
  const features = [
    { icon: "🗺️", text: "Interactive Maps" },
    { icon: "📊", text: "Advanced Analytics" },
    { icon: "💗", text: "Heart Rate Zones" },
    { icon: "🏆", text: "Personal Records" },
    { icon: "🎯", text: "Achievement System" },
    { icon: "🌤️", text: "Weather Integration" },
    { icon: "🤖", text: "AI Insights" },
    { icon: "💾", text: "Data Export" },
    { icon: "🆓", text: "100% Free" }
  ];

  const highlights = [
    { 
      icon: "🗺️", 
      title: "Interactive Maps", 
      desc: "View routes with elevation profiles and segment analysis" 
    },
    { 
      icon: "🏆", 
      title: "Personal Records", 
      desc: "Track PRs across all metrics with intelligent detection" 
    },
    { 
      icon: "🎯", 
      title: "Achievement System", 
      desc: "Unlock badges and milestones as you progress" 
    },
    { 
      icon: "🤖", 
      title: "AI-Powered Insights", 
      desc: "Get personalized training recommendations and trends" 
    }
  ];

  const techStack = [
    { icon: "⚡", text: "React & FastAPI" },
    { icon: "🗺️", text: "Leaflet Maps" },
    { icon: "📊", text: "Chart.js Analytics" },
    { icon: "🎨", text: "Framer Motion" },
    { icon: "🔗", text: "Demo Mode" },
    { icon: "🚀", text: "AI-Powered Development" }
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-pink-500">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl font-bold text-white mb-4">
            FitTracker Pro Ultimate (Demo)
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Demo version with sample data - No account required!
          </p>
          <motion.div 
            className="flex justify-center flex-wrap gap-4 text-white/80 text-sm"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="flex items-center"
                variants={fadeInUp}
              >
                <span className="mr-2">{feature.icon}</span>
                {feature.text}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Hero Section */}
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 text-center border border-white/20">
            <motion.div 
              className="mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, duration: 0.5, type: "spring" }}
            >
              <div className="text-8xl mb-4">🏃‍♂️</div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Try the Demo!
              </h2>
              <p className="text-lg text-white/90 mb-8">
                Experience all features with sample fitness data. No account required - 
                everything runs locally in your browser!
              </p>
            </motion.div>

            <motion.button
              onClick={onLogin}
              disabled={isLoading}
              className="inline-flex items-center px-8 py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Loading Demo...
                </>
              ) : (
                <>
                  <span className="mr-3">🚀</span>
                  Try Demo Now
                </>
              )}
            </motion.button>

            {/* Feature Highlights */}
            <motion.div 
              className="mt-8 grid md:grid-cols-4 gap-6 text-left"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {highlights.map((feature, index) => (
                <motion.div 
                  key={index}
                  className="bg-white/10 rounded-xl p-6"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-white/80 text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Credits Footer */}
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.8 }}
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <p className="text-white/90 text-lg mb-4">
                🏃‍♂️ Built with passion for the fitness community
              </p>
              <div className="flex justify-center items-center flex-wrap gap-6 text-white/70 text-sm">
                {techStack.map((tech, index) => (
                  <div key={index} className="flex items-center">
                    <span className="mr-2">{tech.icon}</span>
                    {tech.text}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white/60 text-xs">
                  Created with EmergentAgent AI • The Ultimate Open Source Fitness Platform
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomeScreen;