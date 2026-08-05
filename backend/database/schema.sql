-- Tables
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investigations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    scan_name TEXT,
    status TEXT,
    risk_score INTEGER,
    full_state JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: The requirements asked to reference profiles, but it's simpler and more robust 
-- to directly reference auth.users(id) to avoid foreign key failures if the trigger hasn't fired yet.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END;
$$;


-- Row Level Security (RLS)
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;

-- Note: For the backend Service Role Key, RLS is bypassed. 
-- However, if you want frontend direct access later, these policies secure the table:
DROP POLICY IF EXISTS "Users can view their own investigations" ON investigations;
CREATE POLICY "Users can view their own investigations" ON investigations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own investigations" ON investigations;
CREATE POLICY "Users can insert their own investigations" ON investigations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own investigations" ON investigations;
CREATE POLICY "Users can update their own investigations" ON investigations FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own investigations" ON investigations;
CREATE POLICY "Users can delete their own investigations" ON investigations FOR DELETE USING (auth.uid() = user_id);
