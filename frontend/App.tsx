import React, { useState } from "react";
import MovieCard from "./components/MovieCard";
import "./styles.css";

export default function App() {
  const [movies, setMovies] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  const fetchRecommendations = async () => {
    const res = await fetch("http://localhost:5000/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie: query })
    });
    setMovies(await res.json());
  };

  return (
    <div className="app dark">
      <h1>LITE – Movie Recommendation System</h1>

      <input
        placeholder="Reference movie"
        onChange={e => setQuery(e.target.value)}
      />
      <button onClick={fetchRecommendations}>Watch</button>

      <div className="grid">
        {movies.map(m => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </div>
  );
}
