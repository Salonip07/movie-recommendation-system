from flask import Flask, request, jsonify
from recommender import recommend_movies
from user_profile import UserProfile
from data_loader import load_movies

app = Flask(__name__)
movies_df = load_movies()
user = UserProfile()

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.json
    movie_title = data["movie"]
    results = recommend_movies(movie_title, movies_df, user)
    return jsonify(results)

@app.route("/watch", methods=["POST"])
def watch_movie():
    data = request.json
    user.add_watch(data["movie"], data["hours"], data["time_pref"])
    return jsonify({"status": "updated"})

@app.route("/profile")
def profile():
    return jsonify(user.export())

if __name__ == "__main__":
    app.run(debug=True)
