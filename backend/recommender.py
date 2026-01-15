from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def recommend_movies(title, df, user):
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df["combined"])

    idx = df[df["title"] == title].index[0]
    sim = cosine_similarity(tfidf_matrix[idx], tfidf_matrix).flatten()

    df["score"] = sim

    # Boost wishlist
    df.loc[df["title"].isin(user.wishlist), "score"] *= 1.3

    # Boost favorite genres
    for g in user.favorite_genres():
        df.loc[df["genres"].str.contains(g), "score"] *= 1.2

    return df.sort_values("score", ascending=False).head(10).to_dict("records")
