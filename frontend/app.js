const API_URL = "http://127.0.0.1:5000";

let blindMode = false;

function toggleBlindMode() {
  blindMode = !blindMode;
  document.body.classList.toggle("blind");
}

async function getRecommendations() {
  const genre = document.getElementById("genreInput").value;

  const response = await fetch(`${API_URL}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preferred_genre: genre })
  });

  const movies = await response.json();
  renderMovies(movies);
}

function renderMovies(movies) {
  const container = document.getElementById("movies");
  container.innerHTML = "";

  movies.forEach(movie => {
    const card = document.createElement("div");
    card.className = "movie-card";

    card.innerHTML = `
      <h3>${movie.title}</h3>
      <p>⭐ IMDB: ${movie.imdb_rating || "N/A"}</p>
      <p>🎭 ${movie.genres}</p>

      <div class="status">
        ${movie.watched ? "<span class='black'>Watched</span>" : ""}
        ${movie.favorite ? "<span class='red'>Favorite</span>" : ""}
        ${!movie.watched ? "<span class='white'>Discovery</span>" : ""}
      </div>

      <button onclick="addToWishlist('${movie.id}')">Add to Wishlist</button>
      <a href="${movie.trailer || '#'}" target="_blank">▶ Trailer</a>
    `;

    container.appendChild(card);

    if (blindMode) {
      speak(`${movie.title}. IMDb rating ${movie.imdb_rating}`);
    }
  });
}

function addToWishlist(movieId) {
  fetch(`${API_URL}/wishlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ movie_id: movieId })
  });
}

function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(msg);
}
