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
  // denormalized counts (from migration 003)
  likes_count: number;
  comments_count: number;
  rejellies_count: number;
  // canonical item linking
  canonical_id?: string | null;
  // community stats (computed from all linked posts)
  avg_score?: number;
  total_ratings?: number;
  // joined
  profile?: Profile;
  user_liked?: boolean;
  user_saved?: boolean;
  // friend ratings (people I follow who rated this item)
  friendRatings?: Array<{ username: string; avatar_url: string | null; score: number }>;
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

export interface Comment {
  id: string;
  user_id: string;
  jellyrate_id: string;
  text: string;
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

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: "like" | "comment" | "rejelly" | "follow" | "follow_request" | "follow_accepted";
  jellyrate_id?: string | null;
  comment_id?: string | null;
  read: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string | null;
  jellyrate_id: string | null;
  created_at: string;
  // joined
  sender?: Profile;
  jellyrate?: Pick<JellyRate, "id" | "photo_url" | "title" | "score">;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  // joined: the other participant
  other?: Profile;
  // last message preview
  last_message?: Pick<Message, "text" | "jellyrate_id" | "sender_id" | "created_at">;
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
