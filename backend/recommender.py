import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

movies = pd.read_csv("data/movies_metadata.csv")

def recommend_movies(user_profile, preferred_genre=None, time_of_day=None):
    movies["score"] = movies["imdb_rating"]

    # Genre watch-time boost
    for genre, hours in user_profile.genre_hours.items():
        movies.loc[movies["genres"].str.contains(genre, na=False),
                   "score"] += hours * 0.5

    # Wishlist boost
    movies.loc[movies["id"].isin(user_profile.wishlist), "score"] += 3

    # Heavy rotation boost
    for mid, count in user_profile.watch_count.items():
        if count >= 3:
            movies.loc[movies["id"] == mid, "score"] += 2

    # Preferred genre discovery
    if preferred_genre:
        movies.loc[movies["genres"].str.contains(preferred_genre, na=False),
                   "score"] += 1

    return movies.sort_values("score", ascending=False).head(20).to_dict("records")
