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
  inline?: boolean;
  twoLine?: boolean;
  spaced?: boolean;
}

export function TitleStack({ animated = false, inline = false, twoLine = false, spaced = false }: TitleStackProps) {
  const titleStyle = inline
    ? { fontSize: 'clamp(2rem, 6vw, 3.5rem)', lineHeight: 1.1 }
    : { fontSize: 'clamp(3rem, 9vh, 4.5rem)', lineHeight: 1.1 };
  
  const spacingClass = spaced ? 'tracking-[0.15em]' : 'tracking-wide';
  
  const renderWords = (MotionOrSpan: any, useVariants: boolean) => {
    if (twoLine) {
      const line1 = titleWords.slice(0, 2);
      const line2 = titleWords.slice(2);
      return (
        <>
          <span className="block whitespace-nowrap">
            {line1.map((word, i) => (
              <MotionOrSpan
                key={word.text}
                className={word.color}
                {...(useVariants ? { variants: wordVariants } : {})}
                style={{
                  display: 'inline',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                }}
              >
                {word.text}{i < line1.length - 1 ? ' ' : ''}
              </MotionOrSpan>
            ))}
          </span>
          <span className="block whitespace-nowrap">
            {line2.map((word, i) => (
              <MotionOrSpan
                key={word.text}
                className={word.color}
                {...(useVariants ? { variants: wordVariants } : {})}
                style={{
                  display: 'inline',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                }}
              >
                {word.text}{i < line2.length - 1 ? ' ' : ''}
              </MotionOrSpan>
            ))}
          </span>
        </>
      );
    }

    const wordDisplay = inline ? 'inline' : 'block';
    return titleWords.map((word, i) => (
      <MotionOrSpan
        key={word.text}
        className={word.color}
        {...(useVariants ? { variants: wordVariants } : {})}
        style={{
          display: wordDisplay,
          textShadow: '0 4px 8px rgba(0,0,0,0.3)',
        }}
      >
        {word.text}{inline && i < titleWords.length - 1 ? ' ' : ''}
      </MotionOrSpan>
    ));
  };

  if (animated) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 
          className={`font-thin ${spacingClass} transform -rotate-2 ${inline ? 'whitespace-nowrap' : ''} ${spaced ? 'text-center' : ''}`}
          style={titleStyle}
        >
          {renderWords(motion.span, true)}
        </h1>
      </motion.div>
    );
  }
  
  return (
    <h1 
      className={`font-thin ${spacingClass} transform -rotate-2 ${inline ? 'whitespace-nowrap' : ''} ${spaced ? 'text-center' : ''}`}
      style={titleStyle}
    >
      {renderWords('span', false)}
    </h1>
  );
}

export const menuButtonBase = "w-full h-14 text-lg font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform text-white border-2";

export const menuButtonStyles = {
  pink: `${menuButtonBase} bg-pink-500 hover:bg-pink-400 border-pink-400`,
  cyan: `${menuButtonBase} bg-cyan-600 hover:bg-cyan-500 border-cyan-400`,
  purple: `${menuButtonBase} bg-purple-600 hover:bg-purple-500 border-purple-400`,
  yellow: `${menuButtonBase} bg-yellow-600 hover:bg-yellow-500 border-yellow-400`,
};

export const RAINBOW_COLORS = ['text-pink-400', 'text-cyan-400', 'text-yellow-400', 'text-green-400', 'text-purple-400'];

export function RainbowText({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text.split('').map((char, i) => (
        <span key={i} className={`${RAINBOW_COLORS[i % RAINBOW_COLORS.length]} rainbow-letter`}>
          {char}
        </span>
      ))}
    </>
  );
}
