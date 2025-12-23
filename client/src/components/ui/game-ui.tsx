import { motion } from "framer-motion";

export const titleWords = [
  { text: "Family", color: "text-pink-400" },
  { text: "Guess", color: "text-cyan-400" },
  { text: "Party", color: "text-yellow-400" },
  { text: "Fun", color: "text-green-400" },
  { text: "Time", color: "text-purple-400" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.15,
      staggerChildren: 0.22,
    },
  },
};

const wordVariants = {
  hidden: {
    opacity: 0,
    scale: 0.3,
    y: -60,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 600,
      damping: 18,
      mass: 1,
    },
  },
};

export function BackgroundGlow() {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary rounded-full blur-3xl animate-pulse delay-700"></div>
      <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-accent rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>
  );
}

interface TitleStackProps {
  animated?: boolean;
  size?: "lg" | "xl";
}

export function TitleStack({ animated = false, size = "xl" }: TitleStackProps) {
  const sizeClass = size === "xl" ? "text-7xl" : "text-6xl";
  
  if (animated) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className={`${sizeClass} font-thin tracking-wide transform -rotate-2 leading-none`}>
          {titleWords.map((word) => (
            <motion.span
              key={word.text}
              className={`block ${word.color}`}
              variants={wordVariants}
              style={{
                display: 'block',
                textShadow: '0 4px 8px rgba(0,0,0,0.3)',
              }}
            >
              {word.text}
            </motion.span>
          ))}
        </h1>
      </motion.div>
    );
  }
  
  return (
    <h1 className={`${sizeClass} font-thin tracking-wide transform -rotate-2 leading-none`}>
      {titleWords.map((word) => (
        <span
          key={word.text}
          className={`block ${word.color}`}
          style={{
            display: 'block',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
          }}
        >
          {word.text}
        </span>
      ))}
    </h1>
  );
}

export const menuButtonBase = "w-full h-14 text-lg font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform text-white border-2";

export const menuButtonStyles = {
  pink: `${menuButtonBase} bg-pink-500 hover:bg-pink-400 border-pink-400`,
  cyan: `${menuButtonBase} bg-cyan-600 hover:bg-cyan-500 border-cyan-400`,
  purple: `${menuButtonBase} bg-purple-600 hover:bg-purple-500 border-purple-400`,
};
