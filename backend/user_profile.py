class UserProfile:
    def __init__(self):
        self.watch_history = {}
        self.wishlist = set()
        self.day_bucket = []
        self.night_bucket = []

    def add_watch(self, movie, hours, pref):
        self.watch_history[movie] = self.watch_history.get(movie, 0) + hours
        if pref == "Day":
            self.day_bucket.append(movie)
        else:
            self.night_bucket.append(movie)

    def favorite_genres(self):
        return ["Sci-Fi", "Action"]

    def export(self):
        return {
            "watch_history": self.watch_history,
            "wishlist": list(self.wishlist),
            "day_bucket": self.day_bucket,
            "night_bucket": self.night_bucket
        }
