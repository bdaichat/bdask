import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, Moon, Sun, Home, MessageCircle, Newspaper, 
  Trophy, Globe2, DollarSign, Clock, Calculator, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";

// Import premium components
import { 
  Sidebar, 
  ChatWindow, 
  ChatInput,
  SuggestionChips, 
  WelcomeScreen 
} from "@/components/chat";
import { Logo } from "@/components/Logo";
import { fetchWeather, isWeatherQuery } from "@/services/weatherService";

// Import feature tabs
import { 
  SportsTab, 
  NewsTab, 
  TranslateTab, 
  ExchangeTab, 
  PrayerTab,
  RamadanTiming,
  ZakatCalculator,
  RamadanGreeting
} from "@/components/features";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

if (!process.env.REACT_APP_BACKEND_URL) {
  console.warn('[BdAsk] REACT_APP_BACKEND_URL is not set. API calls will fail.');
}

/**
 * Premium Ocean Atmosphere Background
 */
const OceanAtmosphere = () => (
  <div className="ocean-atmosphere">
    <div className="ocean-blob ocean-blob-1" />
    <div className="ocean-blob ocean-blob-2" />
    <div className="ocean-blob ocean-blob-3" />
  </div>
);

/**
 * Navigation Tab Items - Including Ramadan Features
 */
const NAV_TABS = [
  { id: 'home', icon: Home, label: 'হোম' },
  { id: 'chat', icon: MessageCircle, label: 'চ্যাট' },
  { id: 'ramadan', icon: Moon, label: 'রমজান', special: true },
  { id: 'news', icon: Newspaper, label: 'খবর' },
  { id: 'sports', icon: Trophy, label: 'খেলা' },
  { id: 'zakat', icon: Calculator, label: 'যাকাত' },
  { id: 'translate', icon: Globe2, label: 'অনুবাদ' },
  { id: 'exchange', icon: DollarSign, label: 'মুদ্রা' },
  { id: 'prayer', icon: Clock, label: 'নামাজ' },
];

/**
 * Floating Bottom Navigation Bar (Apple Style)
 */
const BottomNavBar = ({ activeTab, onTabChange }) => {
  // Mobile tabs - prioritize Ramadan during Ramadan season
  const MOBILE_TABS = [
    { id: 'home', icon: Home, label: 'হোম' },
    { id: 'chat', icon: MessageCircle, label: 'চ্যাট' },
    { id: 'ramadan', icon: Moon, label: 'রমজান' },
    { id: 'news', icon: Newspaper, label: 'খবর' },
    { id: 'zakat', icon: Calculator, label: 'যাকাত' },
  ];
  
  return (
    <nav className="floating-nav lg:hidden" data-testid="floating-nav">
      <div className="flex justify-around items-center py-2 px-2">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isSpecial = tab.id === 'ramadan';
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.9 }}
              className={`floating-nav-item ${isActive ? 'active' : ''} ${isSpecial && !isActive ? 'text-purple-500' : ''}`}
              data-testid={`nav-${tab.id}`}
            >
              <Icon className={`w-5 h-5 transition-all duration-300 ${
                isActive ? 'text-primary' : isSpecial ? 'text-purple-500' : 'text-muted-foreground'
              }`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] mt-0.5 bangla-body transition-all duration-300 ${
                isActive ? 'text-primary font-semibold' : isSpecial ? 'text-purple-500' : 'text-muted-foreground'
              }`}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

/**
 * Enhanced Sidebar Navigation for Desktop
 */
const DesktopSidebar = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewSession, 
  onDeleteSession,
  activeTab,
  onTabChange,
  isOpen,
  onClose 
}) => {
  return (
    <>
      {/* Backdrop overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar Panel */}
      <motion.aside
        initial={false}
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 glass-card rounded-none lg:rounded-2xl lg:m-4 lg:h-[calc(100vh-2rem)]
                    flex flex-col shadow-glass-strong ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/30">
          <Logo size="md" showText={true} animate={false} />
        </div>
        
        {/* Feature Navigation */}
        <div className="p-3 border-b border-border/30">
          <p className="text-xs text-muted-foreground mb-2 px-2 bangla-body">ফিচার</p>
          <div className="space-y-1">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-primary/15 text-primary border border-primary/30' 
                      : 'hover:bg-card/60 text-foreground'
                  }`}
                  data-testid={`sidebar-nav-${tab.id}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm bangla-body">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Chat Sessions (Only show when chat is active) */}
        {activeTab === 'chat' && (
          <Sidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={onSelectSession}
            onNewSession={onNewSession}
            onDeleteSession={onDeleteSession}
            isOpen={true}
            onClose={() => {}}
          />
        )}
        
        {/* Footer */}
        <div className="mt-auto p-4 border-t border-border/30">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="bangla-body">বাংলাদেশের জন্য তৈরি</span>
            <span className="text-red-500">❤️</span>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

/**
 * Main Chat Page Component - Premium Version with Full Features
 */
export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  
  // Get last message for smart suggestions
  const lastMessage = messages.length > 0 
    ? messages[messages.length - 1].content 
    : "";
  
  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
  }, [isDarkMode]);
  
  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);
  
  // Fetch messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);
  
  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API}/chat/sessions`);
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };
  
  const fetchMessages = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/chat/messages/${sessionId}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };
  
  const createNewSession = async () => {
    try {
      const response = await axios.post(`${API}/chat/session`, { 
        title: "নতুন কথোপকথন" 
      });
      setSessions([response.data, ...sessions]);
      setCurrentSessionId(response.data.id);
      setMessages([]);
      setIsSidebarOpen(false);
      setActiveTab('chat');
      toast.success("নতুন কথোপকথন শুরু হয়েছে!", {
        icon: "✨",
        duration: 2000
      });
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("সেশন তৈরি করতে সমস্যা হয়েছে");
    }
  };
  
  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(`${API}/chat/session/${sessionId}`);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      toast.success("সেশন মুছে ফেলা হয়েছে", {
        icon: "🗑️",
        duration: 2000
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("সেশন মুছতে সমস্যা হয়েছে");
    }
  };
  
  const sendMessage = async (content) => {
    if (!content.trim()) return;
    
    // Switch to chat tab if not already there
    if (activeTab !== 'chat') {
      setActiveTab('chat');
    }
    
    // Create session if not exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        const response = await axios.post(`${API}/chat/session`, {
          title: content.slice(0, 30) + (content.length > 30 ? "..." : "")
        });
        sessionId = response.data.id;
        setSessions([response.data, ...sessions]);
        setCurrentSessionId(sessionId);
      } catch (error) {
        console.error("Error creating session:", error);
        toast.error("সেশন তৈরি করতে সমস্যা হয়েছে");
        return;
      }
    }
    
    // Add user message to UI immediately
    const userMessage = {
      id: Date.now().toString(),
      session_id: sessionId,
      role: "user",
      content: content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Check if it's a weather query and fetch weather data
      let weatherData = null;
      if (isWeatherQuery(content)) {
        try {
          weatherData = await fetchWeather(content);
        } catch (e) {
          console.log("Weather fetch failed:", e);
        }
      }
      
      const response = await axios.post(`${API}/chat/send`, {
        session_id: sessionId,
        message: content
      });
      
      // Add AI response with weather data if available
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        session_id: sessionId,
        role: "assistant",
        content: response.data.response,
        timestamp: response.data.timestamp,
        weather: weatherData
      };
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("বার্তা পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuggestionClick = (text) => {
    sendMessage(text);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };
  
  // Get current tab title
  const getCurrentTabTitle = () => {
    if (activeTab === 'chat' && currentSessionId) {
      return sessions.find(s => s.id === currentSessionId)?.title || 'কথোপকথন';
    }
    return NAV_TABS.find(t => t.id === activeTab)?.label || 'বিডিআস্ক AI';
  };
  
  return (
    <div className="h-screen flex overflow-hidden relative bg-background">
      {/* Premium Ocean Atmosphere Background */}
      <OceanAtmosphere />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DesktopSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={(id) => {
            setCurrentSessionId(id);
            setActiveTab('chat');
          }}
          onNewSession={createNewSession}
          onDeleteSession={deleteSession}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={(id) => {
            setCurrentSessionId(id);
            setActiveTab('chat');
            setIsSidebarOpen(false);
          }}
          onNewSession={createNewSession}
          onDeleteSession={deleteSession}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 pb-16 lg:pb-0">
        {/* Premium Header */}
        <header className="flex items-center justify-between px-4 py-3 glass-card rounded-none lg:rounded-b-2xl border-b border-border/30 lg:mx-4 lg:mt-4 relative z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden rounded-xl hover:bg-card/80 touch-target"
              aria-label="Open menu"
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              {/* Mobile logo */}
              <div className="lg:hidden">
                <Logo size="sm" showText={false} animate={false} />
              </div>
              
              <div>
                <h1 className="font-semibold text-foreground bangla-heading text-sm lg:text-base">
                  {getCurrentTabTitle()}
                </h1>
                <p className="text-xs text-muted-foreground hidden lg:block">
                  Premium • Gemini 3 Flash দ্বারা চালিত
                </p>
              </div>
            </div>
          </div>
          
          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center hover:bg-card/80 transition-colors touch-target"
            data-testid="theme-toggle-btn"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500" />
            )}
          </motion.button>
        </header>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Home Tab */}
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
              </motion.div>
            )}
            
            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col"
              >
                {messages.length === 0 && !currentSessionId ? (
                  <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
                ) : (
                  <ChatWindow messages={messages} isLoading={isLoading} />
                )}
                
                {/* Smart suggestions (when in conversation) */}
                {currentSessionId && messages.length > 0 && !isLoading && (
                  <div className="px-4 lg:px-6 pb-2">
                    <SuggestionChips 
                      onSuggestionClick={handleSuggestionClick}
                      lastMessage={lastMessage}
                      isLoading={isLoading}
                    />
                  </div>
                )}
                
                {/* Chat Input */}
                <ChatInput
                  onSendMessage={sendMessage}
                  isLoading={isLoading}
                  placeholder="আপনার বার্তা লিখুন বা কথা বলুন..."
                />
              </motion.div>
            )}
            
            {/* News Tab */}
            {activeTab === 'news' && (
              <motion.div
                key="news"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <NewsTab />
              </motion.div>
            )}
            
            {/* Sports Tab */}
            {activeTab === 'sports' && (
              <motion.div
                key="sports"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <SportsTab />
              </motion.div>
            )}
            
            {/* Translate Tab */}
            {activeTab === 'translate' && (
              <motion.div
                key="translate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <TranslateTab />
              </motion.div>
            )}
            
            {/* Exchange Tab */}
            {activeTab === 'exchange' && (
              <motion.div
                key="exchange"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <ExchangeTab />
              </motion.div>
            )}
            
            {/* Prayer Tab */}
            {activeTab === 'prayer' && (
              <motion.div
                key="prayer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <PrayerTab />
              </motion.div>
            )}
            
            {/* Ramadan Tab */}
            {activeTab === 'ramadan' && (
              <motion.div
                key="ramadan"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <RamadanTiming />
              </motion.div>
            )}
            
            {/* Zakat Tab */}
            {activeTab === 'zakat' && (
              <motion.div
                key="zakat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <ZakatCalculator />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Bottom Navigation Bar (Mobile Only) */}
      <BottomNavBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
