-- InterviewAce Database Schema Migration
-- Enables UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    career_stage TEXT NOT NULL DEFAULT 'Working professional',
    target_role TEXT NOT NULL DEFAULT 'Software Engineer',
    experience_level TEXT NOT NULL DEFAULT 'Intermediate',
    preferred_language TEXT NOT NULL DEFAULT 'English',
    target_company TEXT,
    preparation_goals TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ==========================================
-- 2. USER PREFERENCES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'system',
    default_interview_type TEXT NOT NULL DEFAULT 'Technical',
    default_difficulty TEXT NOT NULL DEFAULT 'Medium',
    voice_enabled BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences"
    ON public.user_preferences FOR ALL
    USING (auth.uid() = user_id);

-- ==========================================
-- 3. INTERVIEW SESSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    interview_type TEXT NOT NULL,
    experience_level TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    target_company TEXT,
    job_description TEXT,
    skills_focus TEXT[],
    language TEXT NOT NULL DEFAULT 'English',
    candidate_background TEXT,
    status TEXT NOT NULL DEFAULT 'Draft',
    question_count INT NOT NULL DEFAULT 5,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    overall_score NUMERIC CHECK (overall_score >= 0 AND overall_score <= 100),
    evaluation_version TEXT DEFAULT 'v1',
    summary_feedback JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interview sessions"
    ON public.interview_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own interview sessions"
    ON public.interview_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview sessions"
    ON public.interview_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interview sessions"
    ON public.interview_sessions FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON public.interview_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.interview_sessions (status);

-- ==========================================
-- 4. INTERVIEW QUESTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    position INT NOT NULL,
    question_text TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    topic_tags TEXT[] NOT NULL DEFAULT '{}',
    expected_concepts TEXT[] NOT NULL DEFAULT '{}',
    question_type TEXT NOT NULL,
    hints TEXT[],
    example_solution TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access questions belonging to their sessions"
    ON public.interview_questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.interview_sessions s
            WHERE s.id = interview_questions.session_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert questions to their sessions"
    ON public.interview_questions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.interview_sessions s
            WHERE s.id = interview_questions.session_id
            AND s.user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_questions_session_pos ON public.interview_questions (session_id, position ASC);

-- ==========================================
-- 5. INTERVIEW ANSWERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.interview_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    transcript TEXT,
    duration_seconds INT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    score NUMERIC CHECK (score >= 0 AND score <= 100),
    feedback_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_session_question UNIQUE (session_id, question_id)
);

ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access answers belonging to their sessions"
    ON public.interview_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.interview_sessions s
            WHERE s.id = interview_answers.session_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert answers to their sessions"
    ON public.interview_answers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.interview_sessions s
            WHERE s.id = interview_answers.session_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update answers to their sessions"
    ON public.interview_answers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.interview_sessions s
            WHERE s.id = interview_answers.session_id
            AND s.user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_answers_session_question ON public.interview_answers (session_id, question_id);

-- ==========================================
-- 6. QUESTION BANK TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    topic TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,
    hints TEXT[] NOT NULL DEFAULT '{}',
    expected_concepts TEXT[] NOT NULL DEFAULT '{}',
    example_solution TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

-- Question bank is publicly readable by authenticated users
CREATE POLICY "Public question bank is viewable by authenticated users"
    ON public.question_bank FOR SELECT
    TO authenticated
    USING (true);

-- Also allow anon read if desired for landing page preview
CREATE POLICY "Public question bank is viewable by anonymous visitors"
    ON public.question_bank FOR SELECT
    TO anon
    USING (true);

CREATE INDEX IF NOT EXISTS idx_question_bank_filters ON public.question_bank (role, category, difficulty, topic);

-- ==========================================
-- 7. SAVED QUESTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.saved_questions (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, question_id)
);

ALTER TABLE public.saved_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved questions"
    ON public.saved_questions FOR ALL
    USING (auth.uid() = user_id);

-- ==========================================
-- 8. AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, career_stage, target_role, experience_level, preferred_language)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'career_stage', 'Working professional'),
        COALESCE(new.raw_user_meta_data->>'target_role', 'Software Engineer'),
        COALESCE(new.raw_user_meta_data->>'experience_level', 'Intermediate'),
        COALESCE(new.raw_user_meta_data->>'preferred_language', 'English')
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_preferences (user_id, theme, default_interview_type, default_difficulty, voice_enabled)
    VALUES (new.id, 'system', 'Technical', 'Medium', false)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 9. CURATED SEED DATA FOR QUESTION BANK
-- ==========================================
INSERT INTO public.question_bank (role, category, difficulty, topic, question_text, question_type, hints, expected_concepts, example_solution)
VALUES
(
    'Frontend Developer',
    'Technical',
    'Medium',
    'React & Virtual DOM',
    'Explain how React''s reconciliation algorithm and Virtual DOM work. How does React determine when to re-render, and what role do keys play in list reconciliation?',
    'technical_explanation',
    ARRAY['Mention the Diffing algorithm and heuristic O(n) assumptions', 'Discuss element type changes vs attribute updates', 'Explain why index keys can cause rendering bugs with stateful elements'],
    ARRAY['Virtual DOM tree comparison', 'Heuristic O(n) diffing', 'Key stability', 'Fiber architecture work loop', 'Batched state updates'],
    'React maintains an in-memory Virtual DOM tree representation of the UI. When state or props update, React builds a new VDOM tree and diffs it with the previous one. Keys allow React to uniquely track identity across renders so that list elements are reused rather than destroyed and recreated.'
),
(
    'Frontend Developer',
    'Technical',
    'Hard',
    'Performance & Web Vitals',
    'What are Core Web Vitals (LCP, INP, CLS)? Walk me through how you would diagnose and optimize a web application suffering from poor Largest Contentful Paint (LCP) and High Cumulative Layout Shift (CLS).',
    'technical_explanation',
    ARRAY['Define LCP (<2.5s), INP (<200ms), and CLS (<0.1)', 'Talk about image optimization, fetchpriority="high", preloading', 'Explain explicit width/height attributes or CSS aspect-ratio to prevent layout shifts'],
    ARRAY['LCP sub-parts (TTFB, Resource Load Delay, Render Delay)', 'Image preload and CDN delivery', 'CLS causes (unsized images, injected ads, web fonts FOIT/FOUT)', 'CSS aspect-ratio and font-display: swap'],
    'To optimize LCP, ensure the hero asset has fetchpriority="high", preload critical fonts, eliminate render-blocking CSS, and use edge caching. For CLS, reserve space with aspect-ratio or explicit dimensions for all media and avoid dynamically inserting content above existing elements.'
),
(
    'Backend Developer',
    'Technical',
    'Medium',
    'Database Indexing & Performance',
    'Explain how B-Tree indexes work in PostgreSQL or MySQL. When can an index degrade performance, and how do composite indexes obey the leftmost prefix rule?',
    'technical_explanation',
    ARRAY['Explain balanced tree traversal O(log N)', 'Consider write overhead (INSERT/UPDATE/DELETE cost)', 'Explain how a composite index on (A, B) cannot optimize WHERE B = 5 without A'],
    ARRAY['Balanced tree search', 'Write amplification and lock contention', 'Leftmost prefix rule', 'Index selectivity and cardinality', 'Index scan vs sequential scan'],
    'B-Tree indexes maintain sorted balanced nodes providing logarithmic lookup. While reads are accelerated, every INSERT/UPDATE requires index leaf updates and page splits. Composite indexes (A, B) can only be queried sequentially starting from A.'
),
(
    'Full-Stack Developer',
    'System Design',
    'Hard',
    'Distributed Systems & Caching',
    'Design a scalable URL Shortener service (like bit.ly) handling 500 million new URLs per month and 5 billion redirects. Outline the API, data model, hashing/encoding strategy, and caching layers.',
    'system_design',
    ARRAY['Calculate QPS (writes ~200 QPS, reads ~2000 QPS)', 'Discuss Base62 encoding vs MD5 hash truncation', 'Propose Redis for hot URL caching (80/20 Pareto rule)'],
    ARRAY['Base62 encoding', 'Unique ID generator (Snowflake / DB sequence)', 'Redis LRU cache', 'HTTP 301 vs 302 redirects', 'Database sharding by hash partition'],
    'Use a distributed counter (e.g. Snowflake or Range worker) to generate unique 64-bit integer IDs, then encode to Base62 (7 characters yielding 3.5 trillion URLs). Store the mapping in a distributed NoSQL/PostgreSQL table and cache the top 20% hot URLs in Redis with LRU eviction.'
),
(
    'All Roles',
    'Behavioral',
    'Medium',
    'Conflict Resolution & Teamwork',
    'Tell me about a time you had a strong technical disagreement with a team member or technical lead. How did you handle the situation, and what was the outcome? Use the STAR format.',
    'behavioral',
    ARRAY['Set the Situation and Task clearly', 'Detail your specific Action (evidence-based discussion, benchmark test, focus on user impact)', 'Share the Result and what you learned'],
    ARRAY['STAR format adherence', 'Objective data-driven decision making', 'Empathy and active listening', 'Commitment to team alignment ("Disagree and Commit")'],
    'In my previous project, a senior engineer preferred building a custom ORM while I advocated for an established open-source query builder. I set up a quick 1-day benchmark comparing development speed, migration safety, and testability. We evaluated the tradeoffs together, agreed on the standard tool, and delivered the milestone two weeks ahead of schedule.'
),
(
    'Data Analyst',
    'Technical',
    'Medium',
    'SQL & Window Functions',
    'Explain the difference between ROW_NUMBER(), RANK(), and DENSE_RANK() in SQL. Provide a practical scenario where you would use DENSE_RANK over RANK.',
    'technical_explanation',
    ARRAY['Explain handling of ties', 'Show how RANK leaves gaps (1, 2, 2, 4) whereas DENSE_RANK does not (1, 2, 2, 3)', 'Give an example of finding top N salary tiers'],
    ARRAY['Window partition and ordering', 'Handling duplicate values/ties', 'Gapless ranking with DENSE_RANK', 'Top-N querying with CTE'],
    'ROW_NUMBER() assigns a unique sequential integer regardless of ties. RANK() assigns the same rank to ties and skips subsequent numbers. DENSE_RANK() assigns identical ranks to ties without skipping numbers. Use DENSE_RANK when you need to retrieve the top 3 distinct score tiers.'
),
(
    'Product Manager',
    'Behavioral',
    'Hard',
    'Product Strategy & Tradeoffs',
    'How do you prioritize features when you have competing requests from high-profile sales stakeholders, frustrated customer support teams, and engineering requesting a technical debt refactor?',
    'behavioral',
    ARRAY['Discuss frameworks like RICE or Kano model', 'Explain alignment with quarterly North Star business metrics', 'Highlight balancing customer retention vs revenue growth vs tech stability'],
    ARRAY['RICE scoring (Reach, Impact, Confidence, Effort)', 'Business alignment with company goals', 'Technical debt allocation (e.g., 20% rule)', 'Stakeholder transparency and communication'],
    'I begin by evaluating each request against our current North Star business metrics (retention vs expansion). I use the RICE framework to quantify impact and effort with engineering. We reserve a steady 20% capacity buffer for tech debt and bug fixes, while scheduling roadmap features openly with transparent scoring shared with sales and support.'
),
(
    'Python Developer',
    'Technical',
    'Medium',
    'Concurrency & Memory',
    'Explain how Python''s Global Interpreter Lock (GIL) affects multi-threaded programs. How do you decide between threading, multiprocessing, and asyncio for a high-performance Python application?',
    'technical_explanation',
    ARRAY['Explain CPython GIL mutual exclusion', 'Distinguish CPU-bound tasks from I/O-bound tasks', 'Explain why asyncio is superior for concurrent I/O network sockets'],
    ARRAY['CPython GIL mechanism', 'CPU-bound vs I/O-bound workloads', 'multiprocessing bypasses GIL via separate memory space', 'asyncio event loop for cooperatively scheduled I/O'],
    'The GIL ensures only one native thread executes Python bytecode at a time. For CPU-bound tasks (e.g. data processing), use multiprocessing to leverage multiple CPU cores. For I/O-bound network or database calls, use asyncio or threading since the GIL is released during socket waits.'
);
