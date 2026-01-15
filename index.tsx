
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality } from '@google/genai';
import { 
  Play, 
  Star, 
  X, 
  Activity, 
  Sparkles, 
  Youtube, 
  Clapperboard, 
  UserCheck, 
  Heart, 
  Zap, 
  Monitor, 
  HeartOff, 
  Search, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  Info, 
  Dna, 
  Terminal, 
  RefreshCw,
  Sun,
  Moon,
  Database,
  SearchCode,
  ExternalLink,
  User,
  PieChart,
  History,
  Clock,
  CheckCircle2,
  BookmarkCheck,
  Eye,
  Mic,
  VolumeX,
  ListPlus,
  Sunrise,
  Sunset,
  Maximize,
  SkipForward,
  Settings,
  Pause,
  Calendar
} from 'lucide-react';

// --- Types ---

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
  watchedPercentage: number;
  keywords: string[];
  director: string;
  cast: CastMember[];
  trailerUrl: string;
  externalUrl: string;
  socialProof: number; 
  color: string; 
  posterUrl: string;
}

interface WatchEntry {
  movieId: string;
  timestamp: number;
  duration: number; // in hours
}

interface RankedMovie extends Movie {
  score: number;
  matchPercentage: number;
  probabilityOfLike: number;
  audienceOverlap: number;
  status: 'favorite' | 'watched' | 'discovery';
  bucketType?: 'day' | 'night';
  reasoning: {
    genreMatch: number;
    keywordMatch: number;
    semanticMatch: number;
    description: string;
  };
}

interface UserProfile {
  name: string;
  totalHours: number;
  genreEngagement: Record<string, number>;
  daytimeBucket: string[];
  nighttimeBucket: string[];
  watchedHistory: WatchEntry[];
  theme: 'nightfall' | 'daylight';
  accessibilityMode: boolean;
}

// --- Data ---

const MOVIES_DB: Movie[] = [
  { 
    id: '1', 
    title: 'Interstellar', 
    genres: ['Sci-Fi', 'Drama', 'Adventure'], 
    imdbRating: 8.7, 
    summary: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.', 
    watchedPercentage: 92, 
    keywords: ['space', 'time-travel', 'black-hole', 'future', 'gravity', 'father-daughter'], 
    director: 'Christopher Nolan', 
    cast: [
      { character: 'Cooper', actor: 'Matthew McConaughey' },
      { character: 'Brand', actor: 'Anne Hathaway' },
      { character: 'Murph', actor: 'Jessica Chastain' },
      { character: 'Professor Brand', actor: 'Michael Caine' }
    ], 
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E', 
    externalUrl: 'https://www.imdb.com/title/tt0816692/', 
    socialProof: 89, 
    color: 'bg-blue-900', 
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    id: '2', 
    title: 'The Dark Knight', 
    genres: ['Action', 'Crime', 'Drama'], 
    imdbRating: 9.0, 
    summary: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', 
    watchedPercentage: 98, 
    keywords: ['superhero', 'joker', 'justice', 'vigilante', 'chaos', 'morality'], 
    director: 'Christopher Nolan', 
    cast: [
      { character: 'Bruce Wayne', actor: 'Christian Bale' },
      { character: 'Joker', actor: 'Heath Ledger' },
      { character: 'Harvey Dent', actor: 'Aaron Eckhart' },
      { character: 'Alfred', actor: 'Michael Caine' }
    ], 
    trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY', 
    externalUrl: 'https://www.imdb.com/title/tt0468569/', 
    socialProof: 95, 
    color: 'bg-slate-900', 
    posterUrl: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    id: '3', 
    title: 'Inception', 
    genres: ['Sci-Fi', 'Action', 'Adventure'], 
    imdbRating: 8.8, 
    summary: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 
    watchedPercentage: 95, 
    keywords: ['dreams', 'heist', 'mind', 'surreal', 'subconscious', 'architecture'], 
    director: 'Christopher Nolan', 
    cast: [
      { character: 'Cobb', actor: 'Leonardo DiCaprio' },
      { character: 'Arthur', actor: 'Joseph Gordon-Levitt' },
      { character: 'Ariadne', actor: 'Elliot Page' },
      { character: 'Eames', actor: 'Tom Hardy' }
    ], 
    trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0', 
    externalUrl: 'https://www.imdb.com/title/tt1375666/', 
    socialProof: 91, 
    color: 'bg-zinc-800', 
    posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    id: '4', 
    title: 'Parasite', 
    genres: ['Drama', 'Thriller'], 
    imdbRating: 8.5, 
    summary: 'Greed and class discrimination threaten a symbiotic relationship between a wealthy family and a destitute clan. The Kim family scheme to become employed by the wealthy Park family.', 
    watchedPercentage: 88, 
    keywords: ['class', 'social', 'family', 'mystery', 'survival', 'inequality'], 
    director: 'Bong Joon-ho', 
    cast: [
      { character: 'Ki-taek', actor: 'Song Kang-ho' },
      { character: 'Ki-woo', actor: 'Choi Woo-shik' },
      { character: 'Ki-jung', actor: 'Park So-dam' },
      { character: 'Dong-ik', actor: 'Lee Sun-kyun' }
    ], 
    trailerUrl: 'https://www.youtube.com/watch?v=5xH0HfJHsaY', 
    externalUrl: 'https://www.imdb.com/title/tt6751668/', 
    socialProof: 84, 
    color: 'bg-emerald-900', 
    posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    id: '5', 
    title: 'Dune: Part Two', 
    genres: ['Sci-Fi', 'Adventure', 'Action'], 
    imdbRating: 8.6, 
    summary: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future.', 
    watchedPercentage: 76, 
    keywords: ['desert', 'prophecy', 'war', 'empire', 'messiah', 'worms'], 
    director: 'Denis Villeneuve', 
    cast: [
      { character: 'Paul Atreides', actor: 'Timothée Chalamet' },
      { character: 'Chani', actor: 'Zendaya' },
      { character: 'Lady Jessica', actor: 'Rebecca Ferguson' },
      { character: 'Feyd-Rautha', actor: 'Austin Butler' }
    ], 
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w', 
    externalUrl: 'https://www.imdb.com/title/tt15239678/', 
    socialProof: 92, 
    color: 'bg-orange-900', 
    posterUrl: 'https://images.unsplash.com/photo-1506466010722-395aa2bef877?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    id: '6', 
    title: 'The Godfather', 
    genres: ['Crime', 'Drama'], 
    imdbRating: 9.2, 
    summary: 'The aging patriarch of an organized crime dynasty in postwar New York City transfers control of his clandestine empire to his reluctant youngest son.', 
    watchedPercentage: 99, 
    keywords: ['crime', 'family', 'mafia', 'legacy', 'loyalty', 'betrayal'], 
    director: 'Francis Ford Coppola', 
    cast: [
      { character: 'Vito Corleone', actor: 'Marlon Brando' },
      { character: 'Michael Corleone', actor: 'Al Pacino' },
      { character: 'Sonny Corleone', actor: 'James Caan' },
      { character: 'Tom Hagen', actor: 'Robert Duvall' }
    ], 
    trailerUrl: 'https://www.youtube.com/watch?v=UaVTIH8adLc', 
    externalUrl: 'https://www.imdb.com/title/tt0068646/', 
    socialProof: 98, 
    color: 'bg-amber-950', 
    posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    id: '7', 
    title: 'Arrival', 
    genres: ['Sci-Fi', 'Mystery', 'Drama'], 
    imdbRating: 7.9, 
    summary: 'A linguist is recruited by the military to assist in communicating with extraterrestrial beings after twelve mysterious spacecraft appear around the world.', 
    watchedPercentage: 82, 
    keywords: ['aliens', 'language', 'time', 'first-contact', 'linguistics', 'communication'], 
    director: 'Denis Villeneuve', 
    cast: [
      { character: 'Louise Banks', actor: 'Amy Adams' },
      { character: 'Ian Donnelly', actor: 'Jeremy Renner' },
      { character: 'Colonel Weber', actor: 'Forest Whitaker' },
      { character: 'Agent Halpern', actor: 'Michael Stuhlbarg' }
    ], 
    trailerUrl: 'https://www.youtube.com/watch?v=ZLO4X6UI8OY', 
    externalUrl: 'https://www.imdb.com/title/tt2543164/', 
    socialProof: 78, 
    color: 'bg-indigo-900', 
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    id: '8', 
    title: 'Blade Runner 2049', 
    genres: ['Sci-Fi', 'Drama', 'Mystery'], 
    imdbRating: 8.0, 
    summary: 'K, a young blade runner, unearths a long-buried secret that has the potential to plunge what\'s left of society into chaos. K\'s discovery leads him on a quest to find Rick Deckard.', 
    watchedPercentage: 85, 
    keywords: ['replicant', 'future', 'cyberpunk', 'identity', 'loneliness', 'artificial-intelligence'], 
    director: 'Denis Villeneuve', 
    cast: [
      { character: 'K', actor: 'Ryan Gosling' },
      { character: 'Rick Deckard', actor: 'Harrison Ford' },
      { character: 'Joi', actor: 'Ana de Armas' },
      { character: 'Niander Wallace', actor: 'Jared Leto' }
    ], 
    trailerUrl: 'https://www.youtube.com/watch?v=gCcx85zbxz4', 
    externalUrl: 'https://www.imdb.com/title/tt1856101/', 
    socialProof: 81, 
    color: 'bg-purple-950', 
    posterUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    id: '9', 
    title: 'Tenet', 
    genres: ['Action', 'Sci-Fi', 'Thriller'], 
    imdbRating: 7.3, 
    summary: 'Armed with only one word, Tenet, and fighting for the survival of the entire world, a Protagonist journeys through a twilight world of international espionage on a mission that will unfold in something beyond real time.', 
    watchedPercentage: 70, 
    keywords: ['entropy', 'time', 'physics', 'spy', 'espionage', 'inversion'], 
    director: 'Christopher Nolan', 
    cast: [
      { character: 'Protagonist', actor: 'John David Washington' },
      { character: 'Neil', actor: 'Robert Pattinson' },
      { character: 'Kat', actor: 'Elizabeth Debicki' },
      { character: 'Sator', actor: 'Kenneth Branagh' }
    ], 
    trailerUrl: 'https://www.youtube.com/watch?v=LdOM0x0ASFE', 
    externalUrl: 'https://www.imdb.com/title/tt6723592/', 
    socialProof: 65, 
    color: 'bg-cyan-950', 
    posterUrl: 'https://images.unsplash.com/photo-1493514789931-586cb221d7a7?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    id: '10', 
    title: 'The Prestige', 
    genres: ['Drama', 'Mystery', 'Sci-Fi'], 
    imdbRating: 8.5, 
    summary: 'After a tragic accident, two stage magicians in 1890s London engage in a battle to create the ultimate illusion while sacrificing everything they have to outwit each other.', 
    watchedPercentage: 90, 
    keywords: ['magic', 'rivalry', 'illusion', 'obsession', 'dedication', 'cloning'], 
    director: 'Christopher Nolan', 
    cast: [
      { character: 'Robert Angier', actor: 'Hugh Jackman' },
      { character: 'Alfred Borden', actor: 'Christian Bale' },
      { character: 'Olivia Wenscombe', actor: 'Scarlett Johansson' },
      { character: 'Nikola Tesla', actor: 'David Bowie' }
    ], 
    trailerUrl: 'https://www.youtube.com/watch?v=o4gHCmTQDVI', 
    externalUrl: 'https://www.imdb.com/title/tt0482571/', 
    socialProof: 88, 
    color: 'bg-stone-900', 
    posterUrl: 'https://images.unsplash.com/photo-1492041932911-20358498801d?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    id: '11', 
    title: 'Everything Everywhere All At Once', 
    genres: ['Action', 'Adventure', 'Comedy', 'Sci-Fi'], 
    imdbRating: 7.8, 
    summary: 'A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.', 
    watchedPercentage: 81, 
    keywords: ['multiverse', 'existentialism', 'family', 'absurdism', 'taxes', 'nihilism'], 
    director: 'Daniel Kwan, Daniel Scheinert', 
    cast: [
      { character: 'Evelyn Wang', actor: 'Michelle Yeoh' },
      { character: 'Waymond Wang', actor: 'Ke Huy Quan' },
      { character: 'Joy Wang', actor: 'Stephanie Hsu' },
      { character: 'Deirdre Beaubeirdre', actor: 'Jamie Lee Curtis' }
    ], 
    trailerUrl: 'https://www.youtube.com/watch?v=wxN1T1uxQ2g', 
    externalUrl: 'https://www.imdb.com/title/tt6710474/', 
    socialProof: 86, 
    color: 'bg-rose-900', 
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800' 
  }
];

const DB = {
  saveProfile: (p: UserProfile) => localStorage.setItem('content_rec_v4_profile', JSON.stringify(p)),
  loadProfile: (): UserProfile => {
    const data = localStorage.getItem('content_rec_v4_profile');
    if (!data) return { 
      name: 'Guest Explorer', 
      totalHours: 0, 
      genreEngagement: {}, 
      daytimeBucket: [], 
      nighttimeBucket: [], 
      watchedHistory: [], 
      theme: 'nightfall',
      accessibilityMode: false
    };

    const parsed = JSON.parse(data);
    if (parsed.watchedHistory && parsed.watchedHistory.length > 0 && typeof parsed.watchedHistory[0] === 'string') {
      parsed.watchedHistory = parsed.watchedHistory.map((id: string) => ({
        movieId: id,
        timestamp: Date.now(),
        duration: 2.5
      }));
    }
    return parsed;
  }
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(DB.loadProfile());
  const [activeMovieId, setActiveMovieId] = useState<string | null>(null);
  const [selectedSeedId, setSelectedSeedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showPostStream, setShowPostStream] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<string | null>(null);
  const [streamProgress, setStreamProgress] = useState(0);

  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => DB.saveProfile(profile), [profile]);

  useEffect(() => {
    let interval: any;
    if (isStreaming) {
      setStreamProgress(0);
      interval = setInterval(() => {
        setStreamProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => completeStream(isStreaming), 1000);
            return 100;
          }
          return prev + 1;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  const completeStream = (id: string) => {
    setIsStreaming(null);
    handleWatch(id);
  };

  const toggleTheme = () => {
    setProfile(p => ({ ...p, theme: p.theme === 'nightfall' ? 'daylight' : 'nightfall' }));
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 1.0;
    window.speechSynthesis.speak(msg);
  };

  const showFeedback = (msg: string) => {
    setToast(msg);
    if (profile.accessibilityMode) speak(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const rankedMovies = useMemo(() => {
    const seed = MOVIES_DB.find(m => m.id === selectedSeedId);
    const favoriteGenres = Object.entries(profile.genreEngagement)
      .filter(([_, hours]) => hours > 5)
      .map(([genre]) => genre);

    return MOVIES_DB.map(m => {
      let score = 0;
      let reasoning = { genreMatch: 0, keywordMatch: 0, semanticMatch: 0, description: 'Neural discovery.' };

      if (seed && seed.id !== m.id) {
        const sharedGenres = m.genres.filter(g => seed.genres.includes(g)).length;
        const genreScore = (sharedGenres / Math.sqrt(m.genres.length * seed.genres.length)) * 100;
        score += genreScore;
        reasoning.genreMatch = genreScore;
      } else if (!seed) {
        score = (m.imdbRating / 10) * 60 + (m.socialProof / 100) * 30;
      }

      m.genres.forEach(g => {
        const hours = profile.genreEngagement[g] || 0;
        if (hours > 2) score += (hours * 1.5);
      });

      const inDay = profile.daytimeBucket.includes(m.id);
      const inNight = profile.nighttimeBucket.includes(m.id);
      if (inDay || inNight) score += 40;

      if (profile.theme === 'daylight' && inDay) score += 15;
      if (profile.theme === 'nightfall' && inNight) score += 15;

      const isWatched = profile.watchedHistory.some(entry => entry.movieId === m.id);
      const isFavoriteGenre = m.genres.some(g => favoriteGenres.includes(g));
      
      let status: 'favorite' | 'watched' | 'discovery' = 'discovery';
      if (isWatched) status = 'watched';
      else if (isFavoriteGenre) status = 'favorite';

      return { 
        ...m, 
        score, 
        matchPercentage: Math.floor(Math.min(score, 100)), 
        probabilityOfLike: Math.floor(Math.min(score, 98)),
        audienceOverlap: Math.floor(Math.max(30, m.watchedPercentage - 10)),
        status,
        bucketType: inDay ? 'day' : inNight ? 'night' : undefined,
        reasoning
      } as RankedMovie;
    }).sort((a, b) => b.score - a.score);
  }, [selectedSeedId, profile.watchedHistory, profile.daytimeBucket, profile.nighttimeBucket, profile.genreEngagement, profile.theme]);

  const filteredMovies = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return rankedMovies.filter(m => m.title.toLowerCase().includes(q) || m.genres.some(g => g.toLowerCase().includes(q)));
  }, [searchQuery, rankedMovies]);

  const handleSelectSeed = (id: string) => {
    setIsSyncing(true);
    setSelectedSeedId(id);
    setTimeout(() => setIsSyncing(false), 500);
    streamRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  const toggleBucket = (id: string, type: 'day' | 'night') => {
    const m = MOVIES_DB.find(x => x.id === id);
    setProfile(p => {
      let nextDay = [...p.daytimeBucket];
      let nextNight = [...p.nighttimeBucket];
      if (type === 'day') {
        if (nextDay.includes(id)) nextDay = nextDay.filter(x => x !== id);
        else { nextDay.push(id); nextNight = nextNight.filter(x => x !== id); }
      } else {
        if (nextNight.includes(id)) nextNight = nextNight.filter(x => x !== id);
        else { nextNight.push(id); nextDay = nextDay.filter(x => x !== id); }
      }
      return { ...p, daytimeBucket: nextDay, nighttimeBucket: nextNight };
    });
    showFeedback(`Bucket updated for ${m?.title}.`);
  };

  const startStream = (id: string) => {
    setIsStreaming(id);
    setActiveMovieId(null);
  };

  const handleWatch = (id: string) => {
    const movie = MOVIES_DB.find(m => m.id === id);
    if (!movie) return;
    const duration = 2.5; 
    const newEntry: WatchEntry = {
        movieId: id,
        timestamp: Date.now(),
        duration
    };

    setProfile(p => {
      const nextGenreEngagement = { ...p.genreEngagement };
      movie.genres.forEach(g => { nextGenreEngagement[g] = (nextGenreEngagement[g] || 0) + duration; });
      return { 
        ...p, 
        watchedHistory: [newEntry, ...p.watchedHistory], 
        totalHours: p.totalHours + duration,
        genreEngagement: nextGenreEngagement
      };
    });
    setShowPostStream(id);
  };

  const historyStats = useMemo(() => {
    const movieTimeMap: Record<string, number> = {};
    profile.watchedHistory.forEach(entry => {
        movieTimeMap[entry.movieId] = (movieTimeMap[entry.movieId] || 0) + entry.duration;
    });
    return movieTimeMap;
  }, [profile.watchedHistory]);

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
        <p className="text-zinc-500 font-black uppercase tracking-widest animate-pulse italic">Vectorizing buckets...</p>
      </div>
    );
  }

  const isNight = profile.theme === 'nightfall';
  const aMode = profile.accessibilityMode;

  return (
    <div className={`min-h-screen transition-colors duration-700 font-sans ${isNight ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'} ${aMode ? 'high-contrast' : ''}`}>
      
      {isStreaming && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-500">
          <div className="absolute inset-0 opacity-40">
            <img src={MOVIES_DB.find(m => m.id === isStreaming)?.posterUrl} className="w-full h-full object-cover blur-3xl scale-110" alt="background" />
          </div>
          <div className="relative w-full max-w-4xl aspect-video bg-zinc-900 rounded-[2rem] shadow-[0_0_100px_rgba(220,38,38,0.2)] overflow-hidden border-8 border-white/5 flex items-center justify-center group">
            <img src={MOVIES_DB.find(m => m.id === isStreaming)?.posterUrl} className="w-full h-full object-cover" alt="stream" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <Pause size={80} className="text-white" />
            </div>
            
            <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-4">
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden cursor-pointer">
                <div className="h-full bg-red-600 transition-all duration-100 ease-linear" style={{ width: `${streamProgress}%` }} />
              </div>
              <div className="flex justify-between items-center text-white">
                <div className="flex items-center gap-6">
                  <Play size={24} fill="currentColor" />
                  <SkipForward size={24} />
                  <Volume2 size={24} />
                  <span className="text-xs font-black italic uppercase tracking-widest">{Math.floor(streamProgress)}% SYNCED</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-2xl font-black italic uppercase tracking-tighter">{MOVIES_DB.find(m => m.id === isStreaming)?.title}</span>
                  <Settings size={20} />
                  <Maximize size={20} />
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => setIsStreaming(null)} className="mt-12 text-zinc-500 font-black uppercase italic tracking-[0.4em] hover:text-white transition-colors">Abort Stream Session</button>
        </div>
      )}

      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] px-8 py-4 bg-red-600 text-white rounded-full font-black uppercase italic shadow-2xl border-4 border-black flex items-center gap-4">
          <BookmarkCheck size={20} />
          {toast}
        </div>
      )}

      <nav className={`fixed top-0 w-full z-50 border-b p-6 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-4 ${isNight ? 'bg-black/80 border-white/5' : 'bg-white/80 border-zinc-200'}`}>
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { setSelectedSeedId(null); setSearchQuery(''); }}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12 ${isNight ? 'bg-white text-black' : 'bg-black text-white'}`}>
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Cinema_Sim</h1>
            <p className={`text-[8px] font-black uppercase tracking-[0.4em] ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>Preference Bucket Engine v4.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`flex items-center gap-3 px-6 py-2 rounded-full border flex-1 md:flex-initial ${isNight ? 'bg-zinc-900/50 border-white/10' : 'bg-zinc-100 border-zinc-300 focus-within:border-black'}`}>
            <Search size={18} className="text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search Title or Genre..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none font-bold text-sm w-full md:w-48 italic"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setProfile(p => ({...p, accessibilityMode: !p.accessibilityMode}))} 
              className={`p-4 rounded-xl border transition-all ${aMode ? 'bg-red-600 border-black text-white' : isNight ? 'bg-zinc-900 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-300 text-zinc-500'}`}
            >
              {aMode ? <Mic size={20} /> : <Eye size={20} />}
            </button>
            <button onClick={() => setShowProfile(true)} className={`relative p-4 rounded-xl border transition-all ${isNight ? 'bg-zinc-900 border-white/10 hover:bg-white hover:text-black' : 'bg-white border-zinc-200 hover:bg-black hover:text-white'}`}>
              <User size={20} />
              {(profile.daytimeBucket.length + profile.nighttimeBucket.length) > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full animate-ping" />}
            </button>
            <button onClick={toggleTheme} className={`p-4 rounded-xl border transition-all ${isNight ? 'bg-zinc-900 border-white/10 hover:bg-white hover:text-black' : 'bg-white border-zinc-200 hover:bg-black hover:text-white'}`}>
              {isNight ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-40 px-8 md:px-16 pb-20">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-4">
            <Sparkles className="text-red-600" />
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Visual Feature Extraction Module</h3>
          </div>
        </div>

        {!aMode ? (
          <div ref={streamRef} className="flex overflow-x-auto gap-10 pb-16 snap-x scroll-smooth no-scrollbar">
            {filteredMovies.map((m) => (
              <div 
                key={m.id}
                onClick={() => setActiveMovieId(m.id)}
                className={`group flex-shrink-0 w-[400px] h-[600px] rounded-[4rem] border-8 transition-all duration-700 cursor-pointer relative overflow-hidden snap-center ${
                  m.status === 'favorite' ? 'border-red-600 shadow-2xl' : 
                  m.status === 'watched' ? 'border-black opacity-60' : 
                  isNight ? 'border-zinc-900 shadow-xl' : 'border-zinc-200 shadow-lg'
                } hover:scale-[1.05] hover:rotate-1`}
              >
                <img src={m.posterUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={m.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
                
                <div className="absolute top-10 left-10 flex flex-col gap-3">
                  <div className={`px-5 py-2 rounded-full text-[12px] font-black uppercase border-2 bg-black/50 backdrop-blur-md text-white border-white/20`}>
                    {m.probabilityOfLike}% Neural Match
                  </div>
                  {m.status === 'favorite' && <div className="bg-red-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase italic shadow-lg">Fan Favorite</div>}
                </div>

                <div className="absolute bottom-0 w-full p-12 flex flex-col gap-6">
                  <div className="flex flex-wrap gap-3">
                    {m.genres.map(g => <span key={g} className="text-[12px] font-black text-red-500 uppercase italic tracking-[0.2em]">{g}</span>)}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-5xl font-black italic uppercase leading-[0.9] tracking-tighter text-white drop-shadow-2xl">{m.title}</h4>
                    <p className="text-zinc-400 text-sm italic font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500 line-clamp-2">{m.summary}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={(e) => { e.stopPropagation(); handleSelectSeed(m.id); }} className="flex-1 py-5 rounded-full bg-white text-black font-black uppercase text-[12px] italic transition-all hover:bg-red-600 hover:text-white border-4 border-black">
                      Set Reference
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); startStream(m.id); }} className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center transition-all hover:scale-110 shadow-xl">
                      <Play size={24} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredMovies.map((m) => (
              <div 
                key={m.id}
                onClick={() => {
                  speak(`${m.title}. Match: ${m.probabilityOfLike} percent.`);
                  setActiveMovieId(m.id);
                }}
                className={`flex flex-col md:flex-row items-center p-8 rounded-[3rem] border-8 transition-all cursor-pointer bg-white text-black border-black hover:bg-red-600 hover:text-white gap-8`}
              >
                <img src={m.posterUrl} className="w-48 h-64 object-cover rounded-[2rem] border-4 border-black shadow-xl" alt={m.title} />
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-7xl font-black italic uppercase tracking-tighter mb-2 leading-none">{m.title}</h4>
                  <p className="text-3xl font-black italic uppercase tracking-widest opacity-60">Prob: {m.probabilityOfLike}%</p>
                  <p className="text-xl font-bold italic mt-4">{m.summary}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={(e) => { e.stopPropagation(); toggleBucket(m.id, 'day'); }} className={`p-8 rounded-full border-4 border-black ${profile.daytimeBucket.includes(m.id) ? 'bg-yellow-500' : 'bg-white'}`}>
                    <Sun size={40} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleBucket(m.id, 'night'); }} className={`p-8 rounded-full border-4 border-black ${profile.nighttimeBucket.includes(m.id) ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
                    <Moon size={40} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); startStream(m.id); }} className="p-8 rounded-full border-4 border-black bg-black text-white">
                    <Play size={40} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" onClick={() => setShowProfile(false)} />
          <div className={`relative w-full max-w-6xl rounded-[4rem] border-8 overflow-y-auto max-h-[90vh] transition-colors duration-500 ${isNight ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-2xl'}`}>
            <button onClick={() => setShowProfile(false)} className="absolute top-8 right-8 z-50 text-zinc-500 hover:text-red-600 transition-colors"><X size={32} /></button>
            <div className="p-10 sm:p-16 space-y-16">
              
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 rounded-[2rem] bg-red-600 flex items-center justify-center text-white shadow-2xl"><User size={48} /></div>
                  <div>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">{profile.name}</h2>
                    <p className="text-red-600 font-black uppercase text-xs tracking-widest italic mt-2">Neural Node: Sync v4.0.0</p>
                  </div>
                </div>
                <div className="flex items-center gap-10">
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-1">Lifetime Sync</p>
                        <p className="text-4xl font-black italic">{profile.totalHours.toFixed(1)}H</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-1">Streams Logged</p>
                        <p className="text-4xl font-black italic">{profile.watchedHistory.length}</p>
                    </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-6 border-b-4 border-red-600 pb-4">
                  <History className="text-red-600" size={32} />
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">Chronological_Playback_Logs</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-4 max-h-[600px] overflow-y-auto pr-4 no-scrollbar">
                    {profile.watchedHistory.length > 0 ? profile.watchedHistory.map((entry, idx) => {
                      const m = MOVIES_DB.find(x => x.id === entry.movieId);
                      if (!m) return null;
                      return (
                        <div key={`${entry.movieId}-${idx}`} className={`flex items-center gap-6 p-6 rounded-[2.5rem] border-4 transition-all hover:border-red-600 ${isNight ? 'bg-black/40 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                          <img src={m.posterUrl} className="w-20 h-28 object-cover rounded-2xl border-2 border-black shadow-lg" />
                          <div className="flex-1">
                            <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-1">{m.title}</h4>
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase text-zinc-500 italic">
                                <Calendar size={12} className="text-red-600" />
                                {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Duration</p>
                             <p className="text-xl font-black italic text-red-600">{entry.duration.toFixed(1)}H</p>
                          </div>
                        </div>
                      );
                    }) : (
                        <div className="p-20 text-center border-4 border-dashed border-zinc-800 rounded-[3rem]">
                            <p className="text-zinc-500 font-black uppercase italic tracking-widest">No stream logs detected in local matrix.</p>
                        </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Total_Time_Per_Object</h4>
                    <div className="space-y-3">
                        {Object.entries(historyStats).sort((a,b) => b[1]-a[1]).map(([mId, hours]) => {
                            const m = MOVIES_DB.find(x => x.id === mId);
                            if (!m) return null;
                            return (
                                <div key={mId} className={`p-5 rounded-[2rem] border-2 ${isNight ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-100 border-zinc-200'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black uppercase italic text-zinc-400">{m.title}</span>
                                        <span className="text-sm font-black italic text-red-600">{hours.toFixed(1)}H</span>
                                    </div>
                                    <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-600" style={{ width: `${Math.min(100, (hours / profile.totalHours) * 100)}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b-2 border-yellow-500/20 pb-2"><Sunrise className="text-yellow-500" /> <h3 className="text-2xl font-black uppercase italic">Daytime_Bucket</h3></div>
                  <div className="grid grid-cols-3 gap-4">
                    {profile.daytimeBucket.map(id => {
                      const m = MOVIES_DB.find(x => x.id === id);
                      return m ? (
                        <div key={id} className="relative group rounded-2xl overflow-hidden border-2 border-black aspect-[2/3] shadow-md">
                          <img src={m.posterUrl} className="w-full h-full object-cover" />
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b-2 border-indigo-500/20 pb-2"><Sunset className="text-indigo-500" /> <h3 className="text-2xl font-black uppercase italic">Nighttime_Bucket</h3></div>
                  <div className="grid grid-cols-3 gap-4">
                    {profile.nighttimeBucket.map(id => {
                      const m = MOVIES_DB.find(x => x.id === id);
                      return m ? (
                        <div key={id} className="relative group rounded-2xl overflow-hidden border-2 border-black aspect-[2/3] shadow-md">
                          <img src={m.posterUrl} className="w-full h-full object-cover" />
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {activeMovieId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-12 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setActiveMovieId(null)} />
          {(() => {
            const m = rankedMovies.find(rm => rm.id === activeMovieId);
            if (!m) return null;
            return (
              <div className={`relative w-full max-w-6xl rounded-[4rem] sm:rounded-[6rem] border-8 overflow-hidden grid grid-cols-1 lg:grid-cols-2 z-10 transition-colors duration-500 ${isNight ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-2xl'}`}>
                <button onClick={() => setActiveMovieId(null)} className="absolute top-10 right-10 z-50 text-zinc-500 hover:text-red-600"><X size={48} /></button>
                <div className={`relative flex flex-col items-center justify-center p-0 overflow-hidden`}>
                  <img src={m.posterUrl} className="w-full h-full object-cover absolute inset-0" alt={m.title} />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                  <div className="relative z-10 p-12 text-left w-full h-full flex flex-col justify-end bg-gradient-to-t from-black to-transparent">
                    <h2 className="text-6xl sm:text-7xl font-black italic uppercase leading-none tracking-tighter text-white mb-6 drop-shadow-lg">{m.title}</h2>
                    <div className="flex flex-wrap gap-4 mb-8">
                       <span className="bg-red-600 text-white px-4 py-2 rounded-xl font-black italic uppercase text-xs">Prob: {m.probabilityOfLike}% Match</span>
                       <span className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-black italic uppercase text-xs">IMDb: {m.imdbRating}</span>
                       <span className="bg-zinc-800 text-white px-4 py-2 rounded-xl font-black italic uppercase text-xs">Dir: {m.director}</span>
                    </div>
                  </div>
                </div>
                <div className="p-12 sm:p-20 flex flex-col justify-center space-y-12 overflow-y-auto max-h-[90vh] md:max-h-full">
                  <div className="space-y-6">
                    <p className={`text-2xl sm:text-3xl font-medium italic border-l-8 border-red-600 pl-8 leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>"{m.summary}"</p>
                    <div className="flex flex-col gap-4">
                      <h4 className="text-xs font-black uppercase text-zinc-500 tracking-[0.3em]">Key_Cast</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {m.cast.map((c, i) => (
                          <div key={i} className={`p-4 rounded-2xl border ${isNight ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-100 border-zinc-200'}`}>
                            <p className="text-[8px] font-black uppercase text-red-600 italic mb-1">{c.character}</p>
                            <p className="text-sm font-black italic">{c.actor}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button onClick={() => startStream(m.id)} className={`py-8 rounded-[3rem] font-black uppercase italic text-3xl transition-all border-8 flex items-center justify-center gap-6 shadow-xl ${isNight ? 'bg-white border-black text-black hover:bg-red-600 hover:text-white' : 'bg-black border-white text-white hover:bg-red-600'}`}>
                      <Play size={40} fill="currentColor" /> STREAM
                    </button>
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => toggleBucket(m.id, 'day')} className={`flex items-center justify-center gap-2 py-4 rounded-2xl border font-black uppercase italic text-[10px] transition-all ${profile.daytimeBucket.includes(m.id) ? 'bg-yellow-500 border-black text-black' : isNight ? 'bg-zinc-800 border-white/5' : 'bg-zinc-100 border-zinc-200'}`}>
                          <Sun size={14} /> Day Bucket
                        </button>
                        <button onClick={() => toggleBucket(m.id, 'night')} className={`flex items-center justify-center gap-2 py-4 rounded-2xl border font-black uppercase italic text-[10px] transition-all ${profile.nighttimeBucket.includes(m.id) ? 'bg-indigo-600 border-black text-white' : isNight ? 'bg-zinc-800 border-white/5' : 'bg-zinc-100 border-zinc-200'}`}>
                          <Moon size={14} /> Night Bucket
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <a href={m.trailerUrl} target="_blank" rel="noopener noreferrer" className={`flex-1 flex items-center justify-center gap-4 py-6 rounded-[2rem] border font-black uppercase italic text-xs transition-all shadow-lg ${isNight ? 'bg-zinc-800 border-white/5 hover:border-red-600' : 'bg-zinc-100 border-zinc-200 hover:border-black'}`}>
                          <Youtube className="text-red-600" /> Trailer
                        </a>
                        <a href={m.externalUrl} target="_blank" rel="noopener noreferrer" className={`flex-1 flex items-center justify-center gap-4 py-6 rounded-[2rem] border font-black uppercase italic text-xs transition-all shadow-lg ${isNight ? 'bg-zinc-800 border-white/5 hover:border-red-600' : 'bg-zinc-100 border-zinc-200 hover:border-black'}`}>
                          <ExternalLink size={14} /> IMDb
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {showPostStream && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
          <div className={`relative w-full max-w-2xl rounded-[4rem] border-8 overflow-hidden transition-colors duration-500 ${isNight ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-2xl'}`}>
            <div className="p-12 sm:p-16 text-center space-y-10">
              <div className="flex justify-center"><div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 animate-pulse"><CheckCircle2 size={48} /></div></div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter">Session_Logged</h2>
                <p className="text-zinc-500 text-sm font-bold italic">Assign this movie to a preferred watch bucket.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => { toggleBucket(showPostStream, 'day'); setShowPostStream(null); }} className={`group p-8 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500`}>
                  <img src={MOVIES_DB.find(x => x.id === showPostStream)?.posterUrl} className="w-20 h-20 object-cover rounded-full border-4 border-yellow-500 group-hover:scale-110 transition-transform" />
                  <span className="font-black uppercase italic text-xs text-yellow-600">Daytime_Bucket</span>
                </button>
                <button onClick={() => { toggleBucket(showPostStream, 'night'); setShowPostStream(null); }} className={`group p-8 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500`}>
                  <img src={MOVIES_DB.find(x => x.id === showPostStream)?.posterUrl} className="w-20 h-20 object-cover rounded-full border-4 border-indigo-500 group-hover:scale-110 transition-transform" />
                  <span className="font-black uppercase italic text-xs text-indigo-600">Nighttime_Bucket</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className={`p-8 border-t flex flex-col md:flex-row justify-between items-center px-16 gap-6 ${isNight ? 'bg-black border-white/5' : 'bg-zinc-100 border-zinc-200'}`}>
        <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.5em] italic text-zinc-500">
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
             <span className={isNight ? 'text-white' : 'text-zinc-900'}>Visual_Feature_Extraction_Eng: Synced</span>
          </div>
          <span>Ref: Preference_Buckets_v4</span>
        </div>
        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.5em] italic text-zinc-500"><Monitor size={14} /> Cinema_Sim_v4</div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        ::selection { background: #dc2626; color: white; }
        .high-contrast { background-color: white !important; color: black !important; }
        .high-contrast button { outline: 4px solid black; }
      `}} />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
