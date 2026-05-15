export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  gender: "male" | "female" | "other" | null;
  feed_gender_filter: "all" | "male" | "female" | null;
  is_private: boolean;
  is_private_activity: boolean;
  created_at: string;
}

export interface JellyRate {
  id: string;
  user_id: string;
  photo_url: string;
  score: number;
  title: string;
  description: string | null;
  category: string | null;
  place_name: string | null;
  audience: "all" | "male" | "female";
  privacy: "public" | "followers";
  created_at: string;
  // joined
  profile?: Profile;
  likes_count?: number;
  rejellies_count?: number;
  user_liked?: boolean;
  user_saved?: boolean;
  friend_avg?: number | null;
  global_avg?: number | null;
}

export interface ReJelly {
  id: string;
  user_id: string;
  jellyrate_id: string;
  score: number;
  comment: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Like {
  user_id: string;
  jellyrate_id: string;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  status: "pending" | "accepted";
  created_at: string;
}

export interface NotificationSettings {
  user_id: string;
  likes_jellyrate: boolean;
  likes_comment: boolean;
  comments_jellyrate: boolean;
  mentions: boolean;
  favorites_jellyrate: boolean;
  rejellies_jellyrate: boolean;
  reposts_jellyrate: boolean;
  new_follower: boolean;
  follow_request: boolean;
  friend_joined: boolean;
  follow_accepted: boolean;
}
