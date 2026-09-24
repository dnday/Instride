-- Create users table (extends auth.users)
CREATE TABLE public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'mahasiswa' CHECK (role IN ('mahasiswa', 'konselor', 'admin'))
    -- Note: password is intentionally omitted as it is handled by Supabase Auth (auth.users)
);

-- Create moods table
CREATE TABLE public.moods (
    mood_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    mood_value INT NOT NULL CHECK (mood_value >= 1 AND mood_value <= 5),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journals table
CREATE TABLE public.journals (
    journal_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sentiment_analysis table
CREATE TABLE public.sentiment_analysis (
    sentiment_id SERIAL PRIMARY KEY,
    journal_id INT NOT NULL REFERENCES public.journals(journal_id) ON DELETE CASCADE,
    sentiment VARCHAR(50) NOT NULL CHECK (sentiment IN ('Positif', 'Negatif', 'Netral')),
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wellbeing_aggregation table
CREATE TABLE public.wellbeing_aggregation (
    aggregation_id SERIAL PRIMARY KEY,
    period VARCHAR(50) NOT NULL,
    average_mood DECIMAL(3, 2),
    positive_percentage DECIMAL(5, 2),
    neutral_percentage DECIMAL(5, 2),
    negative_percentage DECIMAL(5, 2)
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellbeing_aggregation ENABLE ROW LEVEL SECURITY;

-- 1. Users table policies
-- Mahasiswa can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (auth.uid() = user_id);
-- Konselor/Admin can read all profiles
CREATE POLICY "Konselor can read all profiles" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.user_id = auth.uid() AND u.role IN ('konselor', 'admin')
        )
    );

-- 2. Moods table policies
-- Mahasiswa can read and insert their own moods
CREATE POLICY "Users can read own moods" ON public.moods
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own moods" ON public.moods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Journals table policies
-- Mahasiswa can read and insert their own journals
CREATE POLICY "Users can read own journals" ON public.journals
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journals" ON public.journals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Sentiment Analysis table policies
-- Mahasiswa can read sentiment analysis linked to their journals
CREATE POLICY "Users can read own sentiment analysis" ON public.sentiment_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.journals j 
            WHERE j.journal_id = sentiment_analysis.journal_id 
            AND j.user_id = auth.uid()
        )
    );

-- 5. Wellbeing Aggregation table policies
-- Only Konselor and Admin can read aggregated data
CREATE POLICY "Konselor can read aggregated wellbeing data" ON public.wellbeing_aggregation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.user_id = auth.uid() AND u.role IN ('konselor', 'admin')
        )
    );

