from flask import Flask, request, jsonify
from recommender import recommend_movies
from user_profile import UserProfile
from gemini_ai import ask_gemini

app = Flask(__name__)
user = UserProfile()

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.json
    results = recommend_movies(
        user_profile=user,
        preferred_genre=data.get("preferred_genre"),
        time_of_day=data.get("time_of_day")
    )
    return jsonify(results)

@app.route("/watch", methods=["POST"])
def watch_movie():
    movie_id = request.json["movie_id"]
    watch_time = request.json["watch_time"]
    user.watch_movie(movie_id, watch_time)
    return jsonify({"status": "Movie added to watch history"})

@app.route("/rate", methods=["POST"])
def rate_movie():
    user.rate_movie(
        request.json["movie_id"],
        request.json["rating"]
    )
    return jsonify({"status": "Rating updated & recommendations refreshed"})

@app.route("/wishlist", methods=["POST"])
def wishlist():
    user.add_to_wishlist(request.json["movie_id"])
    return jsonify({"status": "Added to wishlist"})

@app.route("/bucket", methods=["GET"])
def bucket():
    return jsonify(user.get_bucket())

@app.route("/chat", methods=["POST"])
def chat():
    response = ask_gemini(request.json["message"])
    return jsonify({"reply": response})

if __name__ == "__main__":
    app.run(debug=True)
