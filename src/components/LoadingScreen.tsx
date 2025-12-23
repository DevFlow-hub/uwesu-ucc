import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-950 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated Logo Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.6,
            ease: "easeOut"
          }}
          className="mb-8 relative flex items-center justify-center"
        >
          {/* Outer rotating ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute w-40 h-40"
          >
            <div className="w-full h-full border-4 border-transparent border-t-cyan-400 border-r-cyan-400 rounded-full opacity-60" />
          </motion.div>

          {/* Center white circle with text */}
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative z-10 w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center"
          >
            <div className="text-cyan-600 font-bold text-center leading-tight">
              <div className="text-xl">UWESU</div>
              <div className="text-xl">UCC</div>
            </div>
          </motion.div>

          {/* Inner rotating ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute w-40 h-40"
          >
            <div className="w-full h-full border-4 border-transparent border-b-blue-400 border-l-blue-400 rounded-full opacity-40" />
          </motion.div>
        </motion.div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-3xl font-bold text-white">
            UWESU UCC
          </h2>
          <p className="text-cyan-200 text-lg font-medium">
            Upper West Students Union
          </p>
          
          {/* Animated dots */}
          <div className="flex items-center justify-center space-x-2 pt-2">
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0
              }}
              className="w-2.5 h-2.5 bg-cyan-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.2
              }}
              className="w-2.5 h-2.5 bg-cyan-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.4
              }}
              className="w-2.5 h-2.5 bg-cyan-400 rounded-full"
            />
          </div>

          <motion.p
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-cyan-300 text-sm mt-4"
          >
            Unity in Diversity
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;