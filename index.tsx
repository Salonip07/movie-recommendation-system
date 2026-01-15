
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality } from '@google/genai';
import { 
  Play, 
  Star, 
  Clock, 
  Eye, 
  X, 
  Activity, 
  MessageSquare, 
  Sparkles, 
  Send, 
  Bot, 
  Sun, 
  Moon, 
  RotateCcw, 
  Youtube, 
  Globe, 
  Clapperboard, 
  UserCheck, 
  Heart, 
  Zap, 
  Layers, 
  TrendingUp, 
  Mic, 
  MicOff,
  Users,
  ArrowRight,
  Monitor,
  HeartOff,
  Search,
  Volume2,
  Cpu,
  Fingerprint,
  Bookmark,
  Trash2,
  Timer,
  AlertTriangle
} from 'lucide-react';

// --- Types & Constants ---

interface CastMember {
  character: string;
  actor: string;
}

interface Movie {
  id: string;
  title: string;
  genres: string[];
  imdbRating: number;
  summary: string;
  watchedPercentage: number; // % of people watching same movie
  keywords: string[];
  director: string;
  cast: CastMember[];
  trailerUrl: string;
  externalUrl: string;
}

interface RankedMovie extends Movie {
  score: number;
  probability: number;
  status: 'red' | 'black' | 'white';
  watchCount: number;
}

interface EngineWeights {
  genreWeight: number;
  wishlistMultiplier: number;
  imdbWeight: number;
  ratingWeight: number;
}

interface ActiveSession {
  movieId: string;
  title: string;
  endTime: number;
  duration: number;
}

interface UserProfile {
  totalHours: number;
  hoursPerGenre: Record<string, number>;
  wishlist: string[];
  watchedHistory: string[];
  watchCounts: Record<string, number>;
  temporalPreferences: Record<string, 'Day' | 'Night'>;
  personalRatings: Record<string, number>;
  engineWeights: EngineWeights;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const DEFAULT_MOVIES: Movie[] = [
  { id: '1', title: 'Interstellar', genres: ['Sci-Fi', 'Drama'], imdbRating: 8.7, summary: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', watchedPercentage: 92, keywords: ['space', 'time-travel'], director: 'Christopher Nolan', cast: [{ character: 'Cooper', actor: 'Matthew McConaughey' }, { character: 'Amelia', actor: 'Anne Hathaway' }], trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E', externalUrl: 'https://www.imdb.com/title/tt0816692/' },
  { id: '2', title: 'The Dark Knight', genres: ['Action', 'Crime'], imdbRating: 9.0, summary: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', watchedPercentage: 98, keywords: ['hero', 'joker'], director: 'Christopher Nolan', cast: [{ character: 'Bruce Wayne', actor: 'Christian Bale' }, { character: 'Joker', actor: 'Heath Ledger' }], trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY', externalUrl: 'https://www.imdb.com/title/tt0468569/' },
  { id: '3', title: 'Inception', genres: ['Sci-Fi', 'Action'], imdbRating: 8.8, summary: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', watchedPercentage: 95, keywords: ['dreams', 'heist'], director: 'Christopher Nolan', cast: [{ character: 'Cobb', actor: 'Leonardo DiCaprio' }, { character: 'Arthur', actor: 'Joseph Gordon-Levitt' }], trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0', externalUrl: 'https://www.imdb.com/title/tt1375666/' },
  { id: '4', title: 'Parasite', genres: ['Drama', 'Thriller'], imdbRating: 8.5, summary: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', watchedPercentage: 88, keywords: ['class', 'social'], director: 'Bong Joon-ho', cast: [{ character: 'Ki-taek', actor: 'Song Kang-ho' }, { character: 'Dong-ik', actor: 'Lee Sun-kyun' }], trailerUrl: 'https://www.youtube.com/watch?v=5xH0HfJHsaY', externalUrl: 'https://www.imdb.com/title/tt6751668/' },
  { id: '5', title: 'Dune: Part Two', genres: ['Sci-Fi', 'Adventure'], imdbRating: 8.6, summary: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.', watchedPercentage: 76, keywords: ['desert', 'prophecy'], director: 'Denis Villeneuve', cast: [{ character: 'Paul Atreides', actor: 'Timothée Chalamet' }, { character: 'Chani', actor: 'Zendaya' }], trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w', externalUrl: 'https://www.imdb.com/title/tt15239678/' },
  { id: '6', title: 'The Godfather', genres: ['Crime', 'Drama'], imdbRating: 9.2, summary: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.', watchedPercentage: 99, keywords: ['crime', 'family'], director: 'Francis Ford Coppola', cast: [{ character: 'Vito Corleone', actor: 'Marlon Brando' }, { character: 'Michael', actor: 'Al Pacino' }], trailerUrl: 'https://www.youtube.com/watch?v=UaVTIH8adLc', externalUrl: 'https://www.imdb.com/title/tt0068646/' },
];

const GENRES = ['All', 'Sci-Fi', 'Drama', 'Action', 'Crime', 'Thriller', 'Adventure'];

const DB = {
  saveProfile: (profile: UserProfile) => localStorage.setItem('lite_user_profile', JSON.stringify(profile)),
  loadProfile: (): UserProfile => {
    const data = localStorage.getItem('lite_user_profile');
    if (data) {
        const parsed = JSON.parse(data);
        return { ...parsed, totalHours: parsed.totalHours || 0 };
    };
    return {
      totalHours: 0,
      hoursPerGenre: { 'Sci-Fi': 5, 'Drama': 2 },
      wishlist: [],
      watchedHistory: [],
      watchCounts: {},
      temporalPreferences: {},
      personalRatings: {},
      engineWeights: { genreWeight: 4.5, wishlistMultiplier: 1.5, imdbWeight: 6.0, ratingWeight: 12.0 },
    };
  }
};

const speakText = async (text: string) => {
  if (!text) return;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Notification: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = window.atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    }
  } catch (err) {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(DB.loadProfile());
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [activeMovieId, setActiveMovieId] = useState<string | null>(null);
  const [activeGenre, setActiveGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [manualTime, setManualTime] = useState<string>("");
  const [feedbackMovieId, setFeedbackMovieId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [showSessionAlert, setShowSessionAlert] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => DB.saveProfile(profile), [profile]);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  // Session Tick
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      if (activeSession && Date.now() >= activeSession.endTime) {
        setShowSessionAlert(true);
        speakText(`Neural Session Interruption. Time allocated for ${activeSession.title} has expired.`);
        setActiveSession(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const rankedMovies = useMemo(() => {
    const topGenre = Object.entries(profile.hoursPerGenre).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Sci-Fi';
    
    return DEFAULT_MOVIES.map(m => {
      let score = m.imdbRating * profile.engineWeights.imdbWeight;
      m.genres.forEach(g => {
        const h = profile.hoursPerGenre[g] || 0;
        if (h > 0) score += (h * profile.engineWeights.genreWeight);
      });
      if (profile.wishlist.includes(m.id)) score *= profile.engineWeights.wishlistMultiplier;
      const watchCount = profile.watchCounts[m.id] || 0;
      if (watchCount >= 3) score += 100;
      if (profile.personalRatings[m.id]) score += profile.personalRatings[m.id] * profile.engineWeights.ratingWeight;
      
      let status: 'red' | 'black' | 'white' = 'white';
      if (profile.watchedHistory.includes(m.id)) status = 'black';
      else if (m.genres.includes(topGenre)) status = 'red';
      
      const probability = Math.min(99, Math.max(10, Math.floor((score / 600) * 100)));
      return { ...m, score, probability, status, watchCount };
    }).sort((a,b) => b.score - a.score);
  }, [profile]);

  const bucketList = useMemo(() => {
    return rankedMovies.filter(m => profile.temporalPreferences[m.id]);
  }, [rankedMovies, profile.temporalPreferences]);

  const heavyRotation = rankedMovies.filter(m => m.watchCount >= 3);
  
  const filtered = useMemo(() => {
    let list = activeGenre === 'All' ? rankedMovies : rankedMovies.filter(m => m.genres.includes(activeGenre));
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(m => 
        m.title.toLowerCase().includes(query) || 
        m.genres.some(g => g.toLowerCase().includes(query)) ||
        m.keywords.some(k => k.toLowerCase().includes(query))
      );
    }
    return list;
  }, [activeGenre, searchQuery, rankedMovies]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleWishlist = (id: string) => {
    setProfile(p => ({
      ...p,
      wishlist: p.wishlist.includes(id) ? p.wishlist.filter(i => i !== id) : [...p.wishlist, id]
    }));
    const added = !profile.wishlist.includes(id);
    showToast(added ? "Added to wishlist" : "Removed from wishlist");
    speakText(added ? "Added to wishlist." : "Removed.");
  };

  const logSession = (id: string, hours: number) => {
    const movie = DEFAULT_MOVIES.find(m => m.id === id);
    if (!movie) return;
    setProfile(p => {
      const nextHours = { ...p.hoursPerGenre };
      movie.genres.forEach(g => nextHours[g] = (nextHours[g] || 0) + hours);
      return {
        ...p,
        totalHours: (p.totalHours || 0) + hours,
        watchedHistory: [...new Set([...p.watchedHistory, id])],
        watchCounts: { ...p.watchCounts, [id]: (p.watchCounts[id] || 0) + 1 },
        hoursPerGenre: nextHours
      };
    });

    // Setup active session alert
    setActiveSession({
      movieId: id,
      title: movie.title,
      duration: hours,
      endTime: Date.now() + (hours * 3600000) // Convert hours to ms
    });

    setFeedbackMovieId(id);
  };

  const setTemporalPreference = (id: string, time: 'Day' | 'Night') => {
    const movie = DEFAULT_MOVIES.find(m => m.id === id);
    if (!movie) return;
    setProfile(p => ({
      ...p,
      temporalPreferences: { ...p.temporalPreferences, [id]: time }
    }));
    showToast(`${movie.title} added to bucket list`);
    speakText(`${movie.title} added to your bucket list for ${time} viewing.`);
    setFeedbackMovieId(null);
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speakText("Voice engine unavailable.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.onstart = () => {
      setIsSearching(true);
      showToast("Searching by voice...");
    };
    recognition.onend = () => setIsSearching(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      if (transcript.includes("clear") || transcript.includes("reset")) {
        setSearchQuery("");
        setActiveGenre("All");
        speakText("Search filters cleared.");
      } else {
        setSearchQuery(transcript);
        speakText(`Filtering for ${transcript}.`);
      }
    };
    recognition.start();
  };

  const startVoiceLink = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speakText("Voice engine unavailable.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      if (feedbackMovieId) {
        if (transcript.includes("day")) setTemporalPreference(feedbackMovieId, "Day");
        else if (transcript.includes("night")) setTemporalPreference(feedbackMovieId, "Night");
      }
    };
    recognition.start();
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const txt = inputText.trim();
    setMessages(p => [...p, { role: 'user', text: txt }]);
    setInputText('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Matrix Query. State: ${JSON.stringify(profile.hoursPerGenre)}. Question: ${txt}`,
      });
      setMessages(p => [...p, { role: 'model', text: response.text || "Signal failure." }]);
    } catch (e) {
      setMessages(p => [...p, { role: 'model', text: "Neural uplink lost." }]);
    }
  };

  const selectedMovie = rankedMovies.find(m => m.id === activeMovieId);
  const feedbackMovie = rankedMovies.find(m => m.id === feedbackMovieId);

  const timeLeft = activeSession ? Math.max(0, activeSession.endTime - currentTime) : 0;
  const hoursLeft = Math.floor(timeLeft / 3600000);
  const minsLeft = Math.floor((timeLeft % 3600000) / 60000);
  const secsLeft = Math.floor((timeLeft % 60000) / 1000);

  if (isLoading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-10">
      <div className="w-24 h-24 border-[6px] border-red-600/10 border-t-red-600 rounded-full animate-spin" />
      <p className="text-red-600 font-black tracking-[1.2em] uppercase italic text-sm">Synchronizing Cores</p>
    </div>
  );

  return (
    <div className={`min-h-screen ${isBlindMode ? 'bg-black text-white p-12' : 'bg-[#030303] text-zinc-100'}`}>
      
      {/* GLOBAL TOAST */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[5000] bg-white text-black px-12 py-5 rounded-[2.5rem] font-black uppercase italic shadow-4xl animate-in slide-in-from-top-12 duration-500 flex items-center gap-4">
          <Zap size={20} fill="currentColor" /> {toastMessage}
        </div>
      )}

      {/* SESSION EXPIRATION ALERT */}
      {showSessionAlert && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-8 bg-red-600/90 backdrop-blur-3xl animate-in fade-in duration-300">
           <div className="max-w-4xl w-full p-24 rounded-[6rem] bg-black border-[12px] border-white/5 shadow-4xl text-center space-y-16">
              <AlertTriangle size={120} className="mx-auto text-red-600 animate-pulse" />
              <div className="space-y-6">
                <h2 className="text-8xl font-black italic uppercase tracking-tighter text-white">Logic Overflow</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-2xl italic">Scheduled Watching Period Exhausted</p>
              </div>
              <p className="text-4xl text-zinc-400 font-medium italic border-l-8 border-red-600 pl-10 mx-auto max-w-2xl leading-tight">
                "The neural anchor for this session has reached its threshold. Syncing matrix state back to idle."
              </p>
              <button 
                onClick={() => setShowSessionAlert(false)} 
                className="w-full py-16 bg-white text-black font-black uppercase italic text-5xl rounded-[5rem] hover:bg-red-600 hover:text-white transition-all shadow-4xl active:scale-95"
              >
                ACKNOWLEDGE
              </button>
           </div>
        </div>
      )}

      {/* REINFORCEMENT TERMINAL */}
      {feedbackMovieId && feedbackMovie && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-8 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="max-w-4xl w-full p-20 rounded-[6rem] bg-zinc-900 border-[12px] border-white/5 shadow-4xl text-center space-y-16">
            <h2 className="text-7xl font-black italic uppercase tracking-tighter text-white">Temporal Anchor</h2>
            <p className="text-zinc-500 font-bold uppercase italic text-2xl">Calibrate bucket list for {feedbackMovie.title}</p>
            
            <div className="grid grid-cols-2 gap-10">
              <button onClick={() => setTemporalPreference(feedbackMovieId, 'Day')} className="group flex flex-col items-center gap-10 p-16 bg-white/5 border-4 border-transparent hover:border-white rounded-[5rem] transition-all">
                <Sun size={100} className="group-hover:text-yellow-400 group-hover:rotate-45 transition-all duration-700" />
                <p className="font-black text-4xl uppercase italic">Daylight</p>
              </button>
              <button onClick={() => setTemporalPreference(feedbackMovieId, 'Night')} className="group flex flex-col items-center gap-10 p-16 bg-white/5 border-4 border-transparent hover:border-red-600 rounded-[5rem] transition-all">
                <Moon size={100} className="group-hover:text-red-500 group-hover:-rotate-45 transition-all duration-700" />
                <p className="font-black text-4xl uppercase italic">Nightfall</p>
              </button>
            </div>

            <button onClick={startVoiceLink} className={`w-full py-10 rounded-full flex items-center justify-center gap-6 font-black uppercase italic text-2xl transition-all shadow-4xl ${isListening ? 'bg-red-600' : 'bg-white text-black'}`}>
              {isListening ? <MicOff size={40} /> : <Mic size={40} />}
              {isListening ? 'Listening...' : 'Neural Voice Command'}
            </button>
            
            <button onClick={() => setFeedbackMovieId(null)} className="text-zinc-700 hover:text-white font-black uppercase tracking-widest italic text-sm transition-all group">Bypass Calibration <ArrowRight size={24} className="inline group-hover:translate-x-2 transition-transform" /></button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-[200] backdrop-blur-3xl bg-black/80 border-b border-white/5 py-10 px-16 flex justify-between items-center mx-auto max-w-[2200px]">
        <div className="flex items-center gap-10 cursor-pointer" onClick={() => { setActiveGenre('All'); setIsBlindMode(false); setSearchQuery(''); }}>
          <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-black shadow-4xl group-hover:rotate-12 transition-transform duration-500">
            <TrendingUp size={44} />
          </div>
          <div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">Lite</h1>
            <p className="text-[12px] font-bold text-zinc-600 tracking-[0.8em] uppercase mt-2 italic">Neural OS v3.2</p>
          </div>
        </div>

        {/* TIME STATUS */}
        <div className="hidden lg:flex items-center gap-14 bg-white/5 px-10 py-5 rounded-[3rem] border border-white/10 shadow-4xl">
           <div className="flex items-center gap-4">
              <Activity className="text-red-600 animate-pulse" size={32} />
              <div>
                 <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">Total Sync Time</p>
                 <p className="text-3xl font-black text-white italic">{profile.totalHours.toFixed(1)} <span className="text-sm">HRS</span></p>
              </div>
           </div>
           {activeSession && (
             <div className="flex items-center gap-4 border-l border-white/10 pl-10 animate-in slide-in-from-right-10 duration-500">
                <Timer className="text-white" size={32} />
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest italic animate-pulse">Session Live</p>
                  <p className="text-3xl font-black text-red-600 italic">
                    {hoursLeft > 0 ? `${hoursLeft}H ` : ''}{minsLeft}M {secsLeft}S
                  </p>
                </div>
             </div>
           )}
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative flex items-center gap-4 mr-10">
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute -left-12 p-2 text-zinc-600 hover:text-red-600 transition-colors animate-in fade-in">
                <Trash2 size={24} />
              </button>
            )}
            <button 
              onClick={startVoiceSearch} 
              className={`p-6 rounded-[2.5rem] border-2 transition-all shadow-4xl relative ${isSearching ? 'bg-red-600 border-red-600 text-white' : 'border-white/10 text-zinc-500 hover:text-white bg-zinc-900'}`}
              title="Voice Search"
            >
              {isSearching && <div className="absolute inset-0 bg-red-600 rounded-[2.5rem] animate-ping opacity-25" />}
              <Mic size={32} />
            </button>
            <button onClick={() => setIsBlindMode(!isBlindMode)} className="flex items-center gap-5 px-12 py-6 rounded-[2.5rem] font-black text-[13px] border-2 border-white/10 hover:border-white bg-zinc-900 transition-all shadow-4xl group">
              <Eye size={28} className="group-hover:scale-110 transition-transform" /> <span>{isBlindMode ? 'UI' : 'ACCESSIBILITY'}</span>
            </button>
          </div>
          
          <button onClick={() => setChatOpen(!chatOpen)} className={`p-6 rounded-[2.5rem] border-2 transition-all shadow-4xl ${chatOpen ? 'bg-white text-black border-white' : 'border-white/10 text-zinc-500 hover:text-white'}`}>
            <MessageSquare size={36} />
          </button>
        </div>
      </header>

      <main className="max-w-[2000px] mx-auto px-16 py-24 space-y-48 pb-64">
        {!isBlindMode ? (
          <>
            {/* SEARCH BANNER */}
            {searchQuery && (
              <div className="bg-white/5 border border-white/10 p-12 rounded-[5rem] flex items-center justify-between animate-in slide-in-from-top-10 duration-700">
                <div className="flex items-center gap-10">
                  <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center text-white"><Search size={40} /></div>
                  <div>
                    <p className="text-zinc-600 font-black uppercase text-xs tracking-widest italic">Filtering Matrix By:</p>
                    <h3 className="text-5xl font-black italic uppercase tracking-tighter">"{searchQuery}"</h3>
                  </div>
                </div>
                <button onClick={() => setSearchQuery('')} className="px-12 py-6 bg-white text-black rounded-[2.5rem] font-black uppercase italic text-sm hover:bg-red-600 hover:text-white transition-all">Clear Filter</button>
              </div>
            )}

            {/* GENRE NAV */}
            <section className="flex flex-wrap justify-center gap-8 bg-zinc-900/40 p-6 rounded-[5rem] border border-white/5 backdrop-blur-3xl w-fit mx-auto shadow-4xl">
              {GENRES.map(g => (
                <button 
                  key={g} 
                  onClick={() => { setActiveGenre(g); setSearchQuery(''); }} 
                  className={`px-16 py-6 rounded-full text-[14px] font-black uppercase tracking-[0.2em] transition-all ${activeGenre === g ? 'bg-white text-black shadow-4xl scale-110' : 'text-zinc-600 hover:text-white'}`}
                >
                  {g}
                </button>
              ))}
            </section>

            {/* BUCKET LIST DISPLAY */}
            {bucketList.length > 0 && (
              <section className="space-y-20 animate-in slide-in-from-bottom-10 duration-1000">
                <div className="flex items-center gap-12">
                   <div className="w-24 h-24 rounded-[3.5rem] bg-white flex items-center justify-center text-black shadow-4xl"><Bookmark size={48} /></div>
                   <div>
                      <h2 className="text-8xl font-black italic uppercase tracking-tighter">Bucket List</h2>
                      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xl mt-3 italic">Calibrated temporal anchors for planned sessions</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-14">
                  {bucketList.map(m => {
                    const personalRating = profile.personalRatings[m.id];
                    const displayRating = personalRating || m.imdbRating;
                    const isPersonal = !!personalRating;

                    return (
                      <div key={m.id} onClick={() => setActiveMovieId(m.id)} className="group cursor-pointer p-16 rounded-[6rem] bg-white/5 border-[8px] border-white/10 hover:border-white transition-all flex flex-col justify-end h-[34rem] relative overflow-hidden shadow-4xl">
                        <div className="absolute top-10 right-10 z-10 flex flex-col items-end gap-3">
                           <div className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-black uppercase italic text-xs shadow-4xl">
                              {profile.temporalPreferences[m.id] === 'Day' ? <Sun size={20} /> : <Moon size={20} />}
                              {profile.temporalPreferences[m.id]} Bucket
                           </div>
                           <div className={`flex items-center gap-2 px-5 py-2 rounded-2xl text-[10px] font-black uppercase italic ${isPersonal ? 'bg-red-600 text-white shadow-red-900/40' : 'bg-zinc-900 text-zinc-400 border border-white/10'}`}>
                              <Star size={14} fill="currentColor" /> {displayRating} {isPersonal && 'SYNC'}
                           </div>
                        </div>
                        <div className="z-10 space-y-4">
                          <h3 className="text-7xl font-black italic uppercase leading-[0.75] tracking-tighter group-hover:translate-x-8 transition-transform duration-1000">{m.title}</h3>
                          <div className="flex gap-4">
                             {m.genres.map(g => <span key={g} className="text-[11px] font-black text-zinc-600 uppercase italic tracking-widest">{g}</span>)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* STREAM GRID */}
            <section className="space-y-24">
              <div className="flex items-center gap-12">
                 <div className="w-20 h-20 rounded-[2rem] bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-600"><Layers size={40} /></div>
                 <h2 className="text-7xl font-black italic uppercase tracking-tighter">Neural Stream</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-14">
                {filtered.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => setActiveMovieId(m.id)} 
                    className={`relative h-[50rem] rounded-[7rem] border-[12px] overflow-hidden transition-all duration-700 group cursor-pointer shadow-4xl ${m.status === 'red' ? 'border-red-600/60' : m.status === 'black' ? 'opacity-40 border-zinc-900 grayscale scale-95' : 'border-zinc-900 hover:border-white/40'} bg-zinc-900`}
                  >
                    <div className="absolute top-14 left-14 z-30 flex flex-col gap-5">
                      <div className="bg-black/95 backdrop-blur-3xl px-10 py-5 rounded-[2.5rem] text-[14px] font-black uppercase border border-white/10 text-white shadow-4xl flex items-center gap-4">
                         <Sparkles size={22} className="text-red-600" /> {m.probability}% SYNC
                      </div>
                    </div>
                    <div className="p-20 h-full flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent group-hover:from-red-950/70 transition-all duration-1000">
                      <h3 className="text-8xl font-black italic uppercase leading-[0.7] tracking-tighter mb-20 group-hover:translate-x-12 transition-transform duration-1000">{m.title}</h3>
                      <div className="grid grid-cols-2 gap-8">
                         <button onClick={(e) => { e.stopPropagation(); setActiveMovieId(m.id); }} className="py-10 bg-white text-black font-black uppercase text-[15px] rounded-[3.5rem] hover:bg-red-600 hover:text-white transition-all italic shadow-4xl active:scale-95">WATCH</button>
                         <button onClick={(e) => { e.stopPropagation(); toggleWishlist(m.id); }} className={`py-10 rounded-[3.5rem] border-[5px] font-black text-[15px] uppercase transition-all shadow-4xl italic ${profile.wishlist.includes(m.id) ? 'bg-red-600 border-red-600 text-white shadow-red-900/60' : 'border-white/5 text-zinc-700 hover:border-white hover:text-white'}`}>
                            {profile.wishlist.includes(m.id) ? 'RETAIN' : 'SAVE'}
                         </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-48 bg-white/5 rounded-[6rem] border-4 border-dashed border-white/10">
                   <p className="text-6xl font-black uppercase italic text-zinc-800">No Neural Matches Detected</p>
                   <p className="text-zinc-600 font-bold uppercase tracking-widest mt-6">Try broadening your search query or switching genres.</p>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="space-y-40 max-w-7xl mx-auto">
             <h2 className="text-[15rem] font-black uppercase italic tracking-tighter border-b-[30px] border-white pb-20 leading-none">Matrix Feed</h2>
             {rankedMovies.map((m, i) => (
                <div key={m.id} className="p-28 border-[15px] border-white rounded-[10rem] space-y-28 bg-white/5 group hover:bg-white/15 transition-all cursor-pointer" onClick={() => setActiveMovieId(m.id)}>
                   <div className="flex justify-between items-center text-9xl font-black uppercase tracking-tighter">
                      <span>SYNC {i + 1}</span>
                      <span className="text-green-500">{m.probability}%</span>
                   </div>
                   <h3 className="text-[18rem] font-black uppercase italic leading-[0.65] tracking-tighter text-white drop-shadow-2xl">{m.title}</h3>
                   <div className="grid grid-cols-1 gap-12 pt-10">
                    <button onClick={(e) => { e.stopPropagation(); speakText(m.summary); }} className="w-full py-28 bg-white text-black text-[10rem] font-black uppercase rounded-[8rem] shadow-4xl active:scale-95 transition-all flex items-center justify-center gap-12"><Volume2 size={120} /> AUDIT</button>
                    <button className="py-28 border-[15px] border-white text-white text-[10rem] font-black uppercase rounded-[8rem] hover:bg-white hover:text-black transition-all active:scale-95">WATCH DATA</button>
                   </div>
                </div>
             ))}
          </section>
        )}
      </main>

      {/* ANALYSIS TERMINAL */}
      {selectedMovie && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-12 bg-black/98 backdrop-blur-3xl animate-in zoom-in-95 duration-700">
          <div className="absolute inset-0" onClick={() => { setActiveMovieId(null); setManualTime(""); }} />
          <div className="relative bg-[#050505] w-full max-w-[1500px] rounded-[8rem] border border-white/10 shadow-4xl overflow-hidden grid grid-cols-1 md:grid-cols-2 z-10">
            <button onClick={() => { setActiveMovieId(null); setManualTime(""); }} className="absolute top-20 right-20 text-zinc-700 hover:text-white z-[1002] hover:rotate-90 transition-transform duration-500"><X size={80} /></button>
            
            <div className="relative h-[60rem] md:h-auto bg-zinc-900/30 flex flex-col items-center justify-center p-24 text-center space-y-16 group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/40 via-transparent to-black opacity-80" />
              <Clapperboard size={180} className="text-white/20 group-hover:text-red-600/50 transition-colors z-10" />
              <div className="z-10 space-y-10">
                 <h2 className="text-8xl font-black italic text-white uppercase tracking-tighter">{selectedMovie.title}</h2>
                 <div className="grid grid-cols-1 gap-8 w-full max-w-lg">
                    {selectedMovie.cast.map((c, i) => (
                      <div key={i} className="bg-black/80 border border-white/10 p-10 rounded-[4rem] flex justify-between items-center hover:border-red-600/50 transition-all">
                        <div className="text-left">
                          <p className="text-[12px] font-black text-zinc-600 uppercase mb-2 italic">{c.character}</p>
                          <p className="text-3xl font-black text-white italic">{c.actor}</p>
                        </div>
                        <UserCheck className="text-zinc-800" size={44} />
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            <div className="p-24 space-y-20 max-h-[95vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-12">
                <div className="flex flex-wrap items-center gap-10">
                  <div className="px-12 py-5 bg-red-600 text-[18px] font-black rounded-[2.5rem] uppercase italic shadow-4xl">MATCH: {selectedMovie.probability}%</div>
                  <div className="flex items-center gap-4 text-yellow-500 bg-white/5 px-10 py-5 rounded-[2.5rem] border border-white/10">
                     <Star size={48} fill="currentColor" />
                     <span className="text-5xl font-black italic">{selectedMovie.imdbRating}</span>
                  </div>
                  <div className="text-zinc-600 font-black uppercase text-[13px] tracking-[0.6em] italic flex items-center gap-4">
                     <Users size={28} /> {selectedMovie.watchedPercentage}% PEER SYNC
                  </div>
                </div>
                <h2 className="text-[11rem] font-black italic uppercase tracking-tighter leading-[0.7] text-white drop-shadow-4xl">{selectedMovie.title}</h2>
                <p className="text-5xl text-zinc-500 font-medium italic border-l-[18px] border-red-600 pl-20 leading-tight">"{selectedMovie.summary}"</p>
              </div>

              <div className="space-y-10 border-t border-white/5 pt-20">
                <div className="flex items-center gap-8 text-white">
                  <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center"><Clock size={44} /></div>
                  <h4 className="text-5xl font-black uppercase italic tracking-tighter">Manual Log</h4>
                </div>
                <div className="flex gap-8">
                  <input 
                    type="number" 
                    step="0.0001"
                    min="0"
                    placeholder="ENTER HOURS..." 
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="flex-1 bg-black border-[6px] border-white/5 rounded-[4rem] px-14 py-10 text-white font-black uppercase italic outline-none focus:border-red-600 transition-all text-4xl shadow-4xl"
                  />
                  <button 
                    onClick={() => {
                      const val = parseFloat(manualTime);
                      if (!isNaN(val) && val > 0) {
                        logSession(selectedMovie.id, val);
                        setManualTime("");
                        setActiveMovieId(null);
                        showToast(`Logged ${val} hours. Session alert set.`);
                      }
                    }}
                    className="px-20 bg-white text-black font-black uppercase italic rounded-[4rem] hover:bg-red-600 hover:text-white transition-all shadow-4xl active:scale-95 text-2xl"
                  >
                    SYNC LOG
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-10 pt-20 border-t border-white/5 pb-10">
                <button onClick={() => { logSession(selectedMovie.id, 2); setActiveMovieId(null); }} className="w-full py-20 bg-white text-black font-black uppercase italic text-7xl rounded-[7rem] hover:bg-red-600 hover:text-white transition-all shadow-4xl active:scale-95 flex items-center justify-center gap-16 group">
                  <Play size={100} fill="currentColor" className="group-hover:scale-110 transition-transform duration-700" /> ENGAGE
                </button>
                <div className="grid grid-cols-2 gap-8">
                  <a href={selectedMovie.trailerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-6 py-12 bg-zinc-900/60 hover:bg-red-600 hover:text-white rounded-[4rem] font-black uppercase italic text-2xl border-[4px] border-white/5 transition-all shadow-4xl active:scale-95 group">
                    <Youtube size={64} /> TRAILER
                  </a>
                  <a href={selectedMovie.externalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-6 py-12 bg-zinc-900/60 hover:bg-white hover:text-black rounded-[4rem] font-black uppercase italic text-2xl border-[4px] border-white/5 transition-all shadow-4xl active:scale-95 group">
                    <Globe size={64} /> DATA
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHAT TERMINAL */}
      {chatOpen && (
        <div className="fixed bottom-36 right-16 z-[3000] w-[44rem] max-h-[65rem] bg-[#080808] border-[12px] border-white/5 rounded-[6rem] shadow-[0_100px_300px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
          <div className="p-16 border-b border-white/5 flex justify-between items-center bg-zinc-900/90 backdrop-blur-3xl">
             <div className="flex items-center gap-10">
                <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-black animate-spin-slow"><Sparkles size={48} /></div>
                <h3 className="text-5xl font-black italic uppercase tracking-tighter">Assistant</h3>
             </div>
             <button onClick={() => setChatOpen(false)} className="text-zinc-700 hover:text-white transition-colors p-4 hover:bg-white/5 rounded-full"><X size={60} /></button>
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-16 space-y-14 custom-scrollbar bg-[#030303]/90 scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-6`}>
                <div className={`max-w-[92%] p-12 rounded-[4.5rem] font-bold text-2xl leading-tight italic ${m.role === 'user' ? 'bg-white text-black text-right rounded-br-none shadow-4xl' : 'bg-zinc-900 text-zinc-200 border border-white/10 rounded-bl-none shadow-4xl'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-14 bg-zinc-900/95 backdrop-blur-3xl border-t border-white/10 flex gap-8">
            <input 
              type="text" 
              placeholder="QUERY MATRIX..." 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
              className="flex-1 bg-black border-[6px] border-white/5 rounded-[4rem] px-14 py-10 text-white font-black uppercase italic outline-none focus:border-red-600 transition-all text-3xl shadow-4xl" 
            />
            <button onClick={sendMessage} className="w-32 h-32 bg-white text-black rounded-[4rem] flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-4xl active:scale-90 flex-shrink-0">
              <Send size={56} />
            </button>
          </div>
        </div>
      )}

      {/* MATRIX STATUS FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 p-12 border-t border-white/5 bg-[#030303]/98 backdrop-blur-3xl text-[14px] font-black uppercase tracking-[0.8em] flex justify-between items-center px-32 z-[100] italic shadow-[0_-60px_120px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-20">
           <div className="flex items-center gap-6">
             <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse shadow-[0_0_30px_rgba(34,197,94,0.8)]" /> 
             <span>MATRIX: NOMINAL</span>
           </div>
           <div className="text-zinc-800 border-l border-white/10 pl-20 hidden xl:flex items-center gap-12">
             <Cpu size={24} /> SYNC: 99.4% • LATENCY: 9ms
           </div>
        </div>
        <div className="text-zinc-800 flex items-center gap-10">
           <Monitor size={24} /> LITE_MATRIX v3.2_BUILD
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .shadow-4xl { box-shadow: 0 100px 200px -40px rgba(0,0,0,1); }
        .custom-scrollbar::-webkit-scrollbar { width: 12px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 40px; border: 4px solid #000; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 25s linear infinite; }
        body { background: #030303; color: #fff; font-family: 'Inter', system-ui, sans-serif; overflow-x: hidden; scroll-behavior: smooth; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}} />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
