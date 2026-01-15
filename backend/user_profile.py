class UserProfile:
    def __init__(self):
        self.watch_history = {}
        self.watch_count = {}
        self.genre_hours = {}
        self.wishlist = set()
        self.ratings = {}
        self.bucket = {}

    def watch_movie(self, movie_id, watch_time):
        self.watch_history[movie_id] = watch_time
        self.watch_count[movie_id] = self.watch_count.get(movie_id, 0) + 1
        if self.watch_count[movie_id] >= 3:
            self.bucket[movie_id] = self.watch_count[movie_id]

    def rate_movie(self, movie_id, rating):
        self.ratings[movie_id] = rating

    def add_to_wishlist(self, movie_id):
        self.wishlist.add(movie_id)

    def get_bucket(self):
        return self.bucket
