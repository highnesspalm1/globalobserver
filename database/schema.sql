-- ============================================
-- Global Observer Database Schema
-- PostGIS-enabled PostgreSQL (Supabase)
-- ============================================

-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;

-- ============================================
-- EVENTS TABLE
-- Stores discrete conflict events (points)
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Event Details
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    source_url TEXT,
    
    -- Classification
    category TEXT NOT NULL CHECK (category IN (
        'shelling', 'air_raid', 'movement', 'combat', 
        'drone', 'naval', 'political', 'humanitarian', 'infrastructure'
    )),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Location (PostGIS Geography for accurate distance calculations)
    location GEOGRAPHY(POINT, 4326),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location_name TEXT,
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    analyst_id UUID REFERENCES auth.users(id),
    verification_notes TEXT,
    
    -- Media & Tags
    media_urls TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- Source Tracking
    source_type TEXT CHECK (source_type IN ('telegram', 'twitter', 'rss', 'manual', 'osint')),
    raw_report_id UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS events_location_idx ON public.events USING GIST (location);
CREATE INDEX IF NOT EXISTS events_event_date_idx ON public.events (event_date DESC);
CREATE INDEX IF NOT EXISTS events_category_idx ON public.events (category);
CREATE INDEX IF NOT EXISTS events_verified_idx ON public.events (verified);
CREATE INDEX IF NOT EXISTS events_severity_idx ON public.events (severity);

-- Auto-update location from lat/lng
CREATE OR REPLACE FUNCTION update_event_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::GEOGRAPHY;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_event_location();

-- ============================================
-- TERRITORY HISTORY TABLE
-- Stores territorial control polygons with time validity
-- ============================================
CREATE TABLE IF NOT EXISTS public.territory_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Actor controlling territory
    actor TEXT NOT NULL CHECK (actor IN ('UA', 'RU', 'contested', 'liberated', 'occupied')),
    
    -- Geometry (Polygon)
    geom GEOGRAPHY(POLYGON, 4326) NOT NULL,
    
    -- Temporal validity (SCD Type 2)
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE, -- NULL means currently valid
    
    -- Metadata
    change_reason TEXT,
    source_references TEXT[] DEFAULT '{}',
    area_sq_km DOUBLE PRECISION,
    
    -- Region info
    region_name TEXT,
    sector TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS territory_geom_idx ON public.territory_history USING GIST (geom);
CREATE INDEX IF NOT EXISTS territory_valid_from_idx ON public.territory_history (valid_from);
CREATE INDEX IF NOT EXISTS territory_valid_to_idx ON public.territory_history (valid_to);
CREATE INDEX IF NOT EXISTS territory_actor_idx ON public.territory_history (actor);

-- Auto-calculate area
CREATE OR REPLACE FUNCTION update_territory_area()
RETURNS TRIGGER AS $$
BEGIN
    NEW.area_sq_km = ST_Area(NEW.geom::GEOMETRY) / 1000000;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_territory_area
    BEFORE INSERT OR UPDATE OF geom ON public.territory_history
    FOR EACH ROW
    EXECUTE FUNCTION update_territory_area();

-- ============================================
-- FRONTLINES TABLE
-- Stores frontline geometries (linestrings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.frontlines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Geometry
    geom GEOGRAPHY(LINESTRING, 4326) NOT NULL,
    
    -- Temporal validity
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE,
    
    -- Classification
    sector TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stable', 'advancing', 'retreating')),
    intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
    
    -- Length in km
    length_km DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS frontlines_geom_idx ON public.frontlines USING GIST (geom);
CREATE INDEX IF NOT EXISTS frontlines_valid_from_idx ON public.frontlines (valid_from);

-- Auto-calculate length
CREATE OR REPLACE FUNCTION update_frontline_length()
RETURNS TRIGGER AS $$
BEGIN
    NEW.length_km = ST_Length(NEW.geom::GEOMETRY) / 1000;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_frontline_length
    BEFORE INSERT OR UPDATE OF geom ON public.frontlines
    FOR EACH ROW
    EXECUTE FUNCTION update_frontline_length();

-- ============================================
-- RAW REPORTS TABLE
-- Stores unprocessed data from ingestion pipeline
-- ============================================
CREATE TABLE IF NOT EXISTS public.raw_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Source info
    source TEXT NOT NULL, -- 'telegram', 'twitter', 'rss'
    source_channel TEXT,
    source_url TEXT,
    source_message_id TEXT,
    
    -- Content
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    
    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    processing_result TEXT CHECK (processing_result IN ('event_created', 'duplicate', 'irrelevant', 'needs_review', 'error')),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Extracted data (from deterministic rules)
    extracted_category TEXT,
    extracted_location TEXT,
    extracted_coordinates GEOGRAPHY(POINT, 4326),
    confidence_score DOUBLE PRECISION,
    
    -- Raw JSON data
    raw_data JSONB
);

CREATE INDEX IF NOT EXISTS raw_reports_processed_idx ON public.raw_reports (processed);
CREATE INDEX IF NOT EXISTS raw_reports_source_idx ON public.raw_reports (source);
CREATE INDEX IF NOT EXISTS raw_reports_created_at_idx ON public.raw_reports (created_at DESC);

-- ============================================
-- LOCATIONS GAZETTEER
-- Known locations for geocoding
-- ============================================
CREATE TABLE IF NOT EXISTS public.locations_gazetteer (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Names
    name_en TEXT NOT NULL,
    name_uk TEXT,
    name_ru TEXT,
    name_de TEXT,
    
    -- Alternative names for matching
    aliases TEXT[] DEFAULT '{}',
    
    -- Location
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    
    -- Classification
    type TEXT CHECK (type IN ('city', 'town', 'village', 'region', 'district', 'landmark', 'military_base')),
    population INTEGER,
    region TEXT,
    oblast TEXT,
    
    -- Search optimization
    search_vector TSVECTOR
);

CREATE INDEX IF NOT EXISTS gazetteer_location_idx ON public.locations_gazetteer USING GIST (location);
CREATE INDEX IF NOT EXISTS gazetteer_search_idx ON public.locations_gazetteer USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS gazetteer_aliases_idx ON public.locations_gazetteer USING GIN (aliases);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION update_gazetteer_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = 
        setweight(to_tsvector('simple', COALESCE(NEW.name_en, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.name_uk, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.name_ru, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.name_de, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.aliases, ' '), '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gazetteer_search
    BEFORE INSERT OR UPDATE ON public.locations_gazetteer
    FOR EACH ROW
    EXECUTE FUNCTION update_gazetteer_search_vector();

-- ============================================
-- VIEWS FOR GeoJSON EXPORT
-- ============================================

-- Events as GeoJSON
CREATE OR REPLACE VIEW public.events_geojson AS
SELECT 
    jsonb_build_object(
        'type', 'Feature',
        'id', id,
        'geometry', ST_AsGeoJSON(location::GEOMETRY)::JSONB,
        'properties', jsonb_build_object(
            'id', id,
            'title', title,
            'description', description,
            'category', category,
            'severity', severity,
            'eventDate', event_date,
            'verified', verified,
            'sourceUrl', source_url,
            'tags', tags,
            'timestamp', EXTRACT(EPOCH FROM event_date) * 1000
        )
    ) AS feature
FROM public.events
WHERE verified = TRUE;

-- Territories as GeoJSON
CREATE OR REPLACE VIEW public.territories_geojson AS
SELECT 
    jsonb_build_object(
        'type', 'Feature',
        'id', id,
        'geometry', ST_AsGeoJSON(geom::GEOMETRY)::JSONB,
        'properties', jsonb_build_object(
            'id', id,
            'actor', actor,
            'validFrom', EXTRACT(EPOCH FROM valid_from) * 1000,
            'validTo', CASE WHEN valid_to IS NULL THEN 9999999999999 ELSE EXTRACT(EPOCH FROM valid_to) * 1000 END,
            'changeReason', change_reason,
            'areaSqKm', area_sq_km
        )
    ) AS feature
FROM public.territory_history;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frontlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_reports ENABLE ROW LEVEL SECURITY;

-- Public read access for verified events
CREATE POLICY "Public can view verified events"
    ON public.events FOR SELECT
    USING (verified = TRUE);

-- Authenticated users can view all events
CREATE POLICY "Authenticated users can view all events"
    ON public.events FOR SELECT
    TO authenticated
    USING (TRUE);

-- Authenticated users can insert/update events
CREATE POLICY "Authenticated users can insert events"
    ON public.events FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can update events"
    ON public.events FOR UPDATE
    TO authenticated
    USING (TRUE);

-- Public read for territories
CREATE POLICY "Public can view territories"
    ON public.territory_history FOR SELECT
    USING (TRUE);

-- Public read for frontlines
CREATE POLICY "Public can view frontlines"
    ON public.frontlines FOR SELECT
    USING (TRUE);

-- Only authenticated for raw_reports
CREATE POLICY "Authenticated users can manage raw reports"
    ON public.raw_reports FOR ALL
    TO authenticated
    USING (TRUE);

-- ============================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================================

-- Get events within radius (km) of a point
CREATE OR REPLACE FUNCTION get_events_in_radius(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_km DOUBLE PRECISION,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS SETOF public.events AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.events e
    WHERE ST_DWithin(
        e.location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY,
        p_radius_km * 1000
    )
    AND (p_start_date IS NULL OR e.event_date >= p_start_date)
    AND (p_end_date IS NULL OR e.event_date <= p_end_date)
    AND e.verified = TRUE
    ORDER BY e.event_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Get territory at a specific date
CREATE OR REPLACE FUNCTION get_territories_at_date(p_date TIMESTAMP WITH TIME ZONE)
RETURNS SETOF public.territory_history AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.territory_history t
    WHERE t.valid_from <= p_date
    AND (t.valid_to IS NULL OR t.valid_to > p_date);
END;
$$ LANGUAGE plpgsql;

-- Match location from text
CREATE OR REPLACE FUNCTION match_location(p_text TEXT)
RETURNS TABLE (
    location_id UUID,
    location_name TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    match_type TEXT
) AS $$
BEGIN
    -- First try exact match
    RETURN QUERY
    SELECT 
        g.id,
        g.name_en,
        g.latitude,
        g.longitude,
        'exact'::TEXT
    FROM public.locations_gazetteer g
    WHERE g.name_en ILIKE p_text
       OR g.name_uk ILIKE p_text
       OR g.name_ru ILIKE p_text
       OR g.name_de ILIKE p_text
       OR p_text ILIKE ANY(g.aliases)
    LIMIT 1;
    
    -- If no exact match, try fuzzy search
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            g.id,
            g.name_en,
            g.latitude,
            g.longitude,
            'fuzzy'::TEXT
        FROM public.locations_gazetteer g
        WHERE g.search_vector @@ plainto_tsquery('simple', p_text)
        ORDER BY ts_rank(g.search_vector, plainto_tsquery('simple', p_text)) DESC
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (Ukrainian Cities)
-- ============================================

INSERT INTO public.locations_gazetteer (name_en, name_uk, name_de, latitude, longitude, type, population, oblast, aliases) VALUES
('Kyiv', 'Київ', 'Kiew', 50.4501, 30.5234, 'city', 2884000, 'Kyiv', ARRAY['Kiev', 'Kijów', 'Киев']),
('Kharkiv', 'Харків', 'Charkiw', 49.9935, 36.2304, 'city', 1421000, 'Kharkiv', ARRAY['Kharkov', 'Харьков', 'Charkow']),
('Odesa', 'Одеса', 'Odessa', 46.4825, 30.7233, 'city', 1015000, 'Odesa', ARRAY['Odessa', 'Одесса']),
('Dnipro', 'Дніпро', 'Dnipro', 48.4647, 35.0462, 'city', 980000, 'Dnipropetrovsk', ARRAY['Dnipropetrovsk', 'Днепропетровск', 'Днепр']),
('Donetsk', 'Донецьк', 'Donezk', 48.0159, 37.8028, 'city', 905000, 'Donetsk', ARRAY['Донецк']),
('Zaporizhzhia', 'Запоріжжя', 'Saporischschja', 47.8388, 35.1396, 'city', 722000, 'Zaporizhzhia', ARRAY['Zaporozhye', 'Запорожье', 'Saporoschje']),
('Lviv', 'Львів', 'Lwiw', 49.8397, 24.0297, 'city', 717000, 'Lviv', ARRAY['Lwow', 'Lwów', 'Львов', 'Lemberg']),
('Mariupol', 'Маріуполь', 'Mariupol', 47.0958, 37.5494, 'city', 431000, 'Donetsk', ARRAY['Мариуполь']),
('Bakhmut', 'Бахмут', 'Bachmut', 48.5953, 38.0009, 'city', 73000, 'Donetsk', ARRAY['Artemivsk', 'Артемовск', 'Артемівськ']),
('Kherson', 'Херсон', 'Cherson', 46.6354, 32.6169, 'city', 283000, 'Kherson', ARRAY['Херсон']),
('Mykolaiv', 'Миколаїв', 'Mykolajiw', 46.9750, 31.9946, 'city', 476000, 'Mykolaiv', ARRAY['Nikolaev', 'Николаев', 'Nikolajew']),
('Luhansk', 'Луганськ', 'Luhansk', 48.5740, 39.3078, 'city', 399000, 'Luhansk', ARRAY['Lugansk', 'Луганск']),
('Sevastopol', 'Севастополь', 'Sewastopol', 44.6054, 33.5220, 'city', 449000, 'Crimea', ARRAY['Севастополь']),
('Simferopol', 'Сімферополь', 'Simferopol', 44.9521, 34.1024, 'city', 336000, 'Crimea', ARRAY['Симферополь']),
('Sumy', 'Суми', 'Sumy', 50.9077, 34.7981, 'city', 259000, 'Sumy', ARRAY['Сумы']),
('Chernihiv', 'Чернігів', 'Tschernihiw', 51.4982, 31.2893, 'city', 285000, 'Chernihiv', ARRAY['Chernigov', 'Чернигов'])
ON CONFLICT DO NOTHING;
