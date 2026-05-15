-- ============================================================
-- JELLYRATE — Migration 003: Comments + Denormalized Counts
-- ============================================================

-- COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  jellyrate_id uuid REFERENCES public.jellyrates(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL CHECK (char_length(text) >= 1 AND char_length(text) <= 500),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Comments visibles') THEN
    EXECUTE 'CREATE POLICY "Comments visibles" ON public.comments FOR SELECT USING (true)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Usuarios comentan') THEN
    EXECUTE 'CREATE POLICY "Usuarios comentan" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Usuarios borran sus comentarios') THEN
    EXECUTE 'CREATE POLICY "Usuarios borran sus comentarios" ON public.comments FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- DENORMALIZED COUNTS on jellyrates
ALTER TABLE public.jellyrates ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0 NOT NULL;
ALTER TABLE public.jellyrates ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0 NOT NULL;
ALTER TABLE public.jellyrates ADD COLUMN IF NOT EXISTS rejellies_count integer DEFAULT 0 NOT NULL;

-- ── TRIGGER: likes_count ─────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jellyrates SET likes_count = likes_count + 1 WHERE id = NEW.jellyrate_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jellyrates SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.jellyrate_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_likes_count ON public.likes;
CREATE TRIGGER trg_likes_count
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION fn_likes_count();

-- ── TRIGGER: comments_count ──────────────────────────────────
CREATE OR REPLACE FUNCTION fn_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jellyrates SET comments_count = comments_count + 1 WHERE id = NEW.jellyrate_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jellyrates SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.jellyrate_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_count ON public.comments;
CREATE TRIGGER trg_comments_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION fn_comments_count();

-- ── TRIGGER: rejellies_count ─────────────────────────────────
CREATE OR REPLACE FUNCTION fn_rejellies_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jellyrates SET rejellies_count = rejellies_count + 1 WHERE id = NEW.jellyrate_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jellyrates SET rejellies_count = GREATEST(0, rejellies_count - 1) WHERE id = OLD.jellyrate_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_rejellies_count ON public.rejellies;
CREATE TRIGGER trg_rejellies_count
AFTER INSERT OR DELETE ON public.rejellies
FOR EACH ROW EXECUTE FUNCTION fn_rejellies_count();

-- ── NOTIFICATIONS TABLE ──────────────────────────────────────
-- Used by Activity feed to surface per-user events
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('like','comment','rejelly','follow','follow_request','follow_accepted')),
  jellyrate_id uuid REFERENCES public.jellyrates(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Usuarios ven sus notificaciones') THEN
    EXECUTE 'CREATE POLICY "Usuarios ven sus notificaciones" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Sistema crea notificaciones') THEN
    EXECUTE 'CREATE POLICY "Sistema crea notificaciones" ON public.notifications FOR INSERT WITH CHECK (true)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Usuarios marcan como leido') THEN
    EXECUTE 'CREATE POLICY "Usuarios marcan como leido" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id)';
  END IF;
END $$;

-- ── TRIGGER: auto-create notifications ──────────────────────

-- Notification on like
CREATE OR REPLACE FUNCTION fn_notify_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.jellyrates WHERE id = NEW.jellyrate_id;
  IF v_owner IS NOT NULL AND v_owner != NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, jellyrate_id)
    VALUES (v_owner, NEW.user_id, 'like', NEW.jellyrate_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_like ON public.likes;
CREATE TRIGGER trg_notify_like
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION fn_notify_like();

-- Notification on comment
CREATE OR REPLACE FUNCTION fn_notify_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.jellyrates WHERE id = NEW.jellyrate_id;
  IF v_owner IS NOT NULL AND v_owner != NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, jellyrate_id, comment_id)
    VALUES (v_owner, NEW.user_id, 'comment', NEW.jellyrate_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_comment ON public.comments;
CREATE TRIGGER trg_notify_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION fn_notify_comment();

-- Notification on rejelly
CREATE OR REPLACE FUNCTION fn_notify_rejelly()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.jellyrates WHERE id = NEW.jellyrate_id;
  IF v_owner IS NOT NULL AND v_owner != NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, jellyrate_id)
    VALUES (v_owner, NEW.user_id, 'rejelly', NEW.jellyrate_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_rejelly ON public.rejellies;
CREATE TRIGGER trg_notify_rejelly
AFTER INSERT ON public.rejellies
FOR EACH ROW EXECUTE FUNCTION fn_notify_rejelly();

-- Notification on follow
CREATE OR REPLACE FUNCTION fn_notify_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_follow ON public.follows;
CREATE TRIGGER trg_notify_follow
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION fn_notify_follow();
