import { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Newspaper, 
  HelpCircle, 
  BookOpen, 
  Lightbulb, 
  CloudSun,
  Globe,
  Calculator,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Music,
  Camera
} from "lucide-react";

// Premium Bengali suggestion set
const BENGALI_SUGGESTIONS = [
  { icon: CloudSun, text: "ঢাকার আবহাওয়া কেমন?", category: "weather", color: "from-blue-500 to-cyan-500" },
  { icon: Newspaper, text: "আজকের খবর কি?", category: "news", color: "from-purple-500 to-pink-500" },
  { icon: HelpCircle, text: "বাংলাদেশ সম্পর্কে বলুন", category: "knowledge", color: "from-emerald-500 to-teal-500" },
  { icon: BookOpen, text: "একটি গল্প লিখুন", category: "creative", color: "from-orange-500 to-amber-500" },
  { icon: Lightbulb, text: "নতুন কিছু শিখতে চাই", category: "education", color: "from-indigo-500 to-blue-500" },
  { icon: Heart, text: "অনুপ্রাণিত করুন", category: "motivation", color: "from-rose-500 to-red-500" },
  { icon: Sparkles, text: "মজার কিছু বলুন", category: "fun", color: "from-violet-500 to-purple-500" },
  { icon: Music, text: "গান সম্পর্কে বলুন", category: "music", color: "from-pink-500 to-rose-500" }
];

// Premium English suggestion set
const ENGLISH_SUGGESTIONS = [
  { icon: CloudSun, text: "What's the weather in Dhaka?", category: "weather", color: "from-blue-500 to-cyan-500" },
  { icon: Newspaper, text: "Tell me today's news", category: "news", color: "from-purple-500 to-pink-500" },
  { icon: Globe, text: "Facts about Bangladesh", category: "knowledge", color: "from-emerald-500 to-teal-500" },
  { icon: BookOpen, text: "Write me a story", category: "creative", color: "from-orange-500 to-amber-500" },
  { icon: Calculator, text: "Help me learn something new", category: "education", color: "from-indigo-500 to-blue-500" },
  { icon: Heart, text: "Inspire me today", category: "motivation", color: "from-rose-500 to-red-500" },
  { icon: Sparkles, text: "Tell me something fun", category: "fun", color: "from-violet-500 to-purple-500" },
  { icon: Camera, text: "Describe a beautiful place", category: "travel", color: "from-teal-500 to-emerald-500" }
];

/**
 * Detect if text is primarily Bengali
 */
const isBengaliText = (text) => {
  if (!text) return true;
  const bengaliPattern = /[\u0980-\u09FF]/g;
  const bengaliMatches = (text.match(bengaliPattern) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  return totalChars === 0 || bengaliMatches / totalChars > 0.3;
};

/**
 * Individual Suggestion Chip
 */
const SuggestionChip = ({ suggestion, onClick, isLoading, index, isBengali }) => {
  const Icon = suggestion.icon;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 15, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ 
        delay: index * 0.05,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(suggestion.text)}
      disabled={isLoading}
      className="suggestion-chip group"
    >
      <span className={`w-5 h-5 rounded-lg bg-gradient-to-br ${suggestion.color} flex items-center justify-center`}>
        <Icon className="w-3 h-3 text-white" />
      </span>
      <span className={`${isBengali ? "bangla-body" : ""} text-sm`}>
        {suggestion.text}
      </span>
    </motion.button>
  );
};

/**
 * Premium Suggestion Chips Component
 * Horizontally scrollable with gradient fade edges
 */
export const SuggestionChips = ({ 
  onSuggestionClick, 
  lastMessage, 
  isLoading,
  showAll = false,
  className = ""
}) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  const isBengali = isBengaliText(lastMessage);
  
  const suggestions = useMemo(() => {
    const allSuggestions = isBengali ? BENGALI_SUGGESTIONS : ENGLISH_SUGGESTIONS;
    return showAll ? allSuggestions : allSuggestions.slice(0, 6);
  }, [showAll, isBengali]);
  
  // Check scroll position for arrow visibility
  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setShowLeftArrow(container.scrollLeft > 20);
    setShowRightArrow(container.scrollLeft < container.scrollWidth - container.clientWidth - 20);
  };
  
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      checkScroll();
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [suggestions]);
  
  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Grid layout for welcome screen
  if (showAll) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={className}
      >
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion, index) => (
            <SuggestionChip
              key={`${suggestion.category}-${index}`}
              suggestion={suggestion}
              onClick={onSuggestionClick}
              isLoading={isLoading}
              index={index}
              isBengali={isBengali}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Horizontal scroll layout for in-chat
  return (
    <div className="relative">
      {/* Left scroll arrow */}
      <AnimatePresence>
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full glass-panel flex items-center justify-center text-foreground hover:bg-primary/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Gradient fade left */}
      {showLeftArrow && (
        <div className="absolute left-8 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none" />
      )}
      
      {/* Scrollable chips container */}
      <div 
        ref={scrollContainerRef}
        className="chips-container px-10"
      >
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion, index) => (
            <SuggestionChip
              key={`${suggestion.category}-${index}`}
              suggestion={suggestion}
              onClick={onSuggestionClick}
              isLoading={isLoading}
              index={index}
              isBengali={isBengali}
            />
          ))}
        </AnimatePresence>
      </div>
      
      {/* Gradient fade right */}
      {showRightArrow && (
        <div className="absolute right-8 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none" />
      )}
      
      {/* Right scroll arrow */}
      <AnimatePresence>
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full glass-panel flex items-center justify-center text-foreground hover:bg-primary/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuggestionChips;
