import { motion } from "framer-motion";

export default function AILoadingOverlay({ progress, isVisible }) {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center text-white p-8 max-w-sm">
        <motion.div
          className="text-6xl mb-6"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          🧠
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">Caricamento AI in corso...</h2>

        <p className="text-white/70 mb-6 text-sm">
          Sto preparando l'intelligenza artificiale per generare contenuti
          personalizzati per voi 💕
        </p>

        <div className="w-full bg-white/20 rounded-full h-3 mb-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <p className="text-sm text-white/60">
          {progress < 100 ? `${progress}% completato` : "Pronto!"}
        </p>

        {progress < 30 && (
          <p className="text-xs text-white/40 mt-4">
            La prima volta potrebbe richiedere qualche minuto...
          </p>
        )}
      </div>
    </motion.div>
  );
}
