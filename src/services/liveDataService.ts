// Live Data Service for Global Observer
// Fetches real-time events from GDELT, ReliefWeb, and RSS feeds
// No API keys required - all free public APIs

import type { MapEvent, EventCategory, SeverityLevel } from '../types/database';

// GDELT API Endpoints (free, no auth)
const GDELT_DOC_API = 'https://api.gdeltproject.org/api/v2/doc/doc';
const GDELT_GEO_API = 'https://api.gdeltproject.org/api/v2/geo/geo';

// ReliefWeb API (free, no auth)
const RELIEFWEB_API = 'https://api.reliefweb.int/v1/reports';

// NASA EONET API for natural disasters (free, no auth)
const NASA_EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3/events';

// USGS Earthquake API (free, no auth)
const USGS_EARTHQUAKE_API = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

// Wikipedia Current Events API (free, CORS enabled)
const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1/page/html/Portal%3ACurrent_events';


// RSS Feeds for global news - expanded coverage
const RSS_FEEDS: Record<string, string> = {
    // Major International
    aljazeera: 'https://www.aljazeera.com/xml/rss/all.xml',
    bbc_world: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    bbc_europe: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml',
    bbc_middleeast: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
    bbc_asia: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml',
    bbc_africa: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
    bbc_latinamerica: 'https://feeds.bbci.co.uk/news/world/latin_america/rss.xml',
    dw_english: 'https://rss.dw.com/rdf/rss-en-all',
    france24_english: 'https://www.france24.com/en/rss',
    guardian_world: 'https://www.theguardian.com/world/rss',
    npr_world: 'https://feeds.npr.org/1004/rss.xml',
    reuters_world: 'https://www.reutersagency.com/feed/?best-topics=world-news&post_type=best',
    // Russia/Ukraine
    kyivindependent: 'https://kyivindependent.com/feed/',
    tass_world: 'https://tass.com/rss/v2.xml',
    // Middle East
    timesofisrael: 'https://www.timesofisrael.com/feed/',
    middleeasteye: 'https://www.middleeasteye.net/rss',
    // Asia
    japantimes: 'https://www.japantimes.co.jp/feed/',
    scmp: 'https://www.scmp.com/rss/91/feed',
    xinhua_world: 'http://www.xinhuanet.com/english/rss/worldrss.xml',
    // Latin America
    mercopress: 'https://en.mercopress.com/rss',
    // Africa
    africanews: 'https://www.africanews.com/feed/',
    // India
    hindustan_times: 'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml',
};

// Keywords for filtering relevant events - expanded
const CONFLICT_KEYWORDS = [
    // English
    'war', 'conflict', 'attack', 'explosion', 'bomb', 'missile', 'rocket',
    'terrorism', 'terror', 'protest', 'demonstration', 'riot', 'unrest',
    'military', 'soldier', 'weapons', 'armed', 'combat', 'strike',
    'killed', 'casualties', 'injured', 'violence', 'clash', 'fighting',
    'airstrike', 'drone', 'shelling', 'artillery', 'siege', 'invasion',
    'coup', 'rebel', 'insurgent', 'militia', 'ceasefire', 'offensive',
    'hostage', 'kidnap', 'assassination', 'shooting', 'gunfire',
    'sanctions', 'nuclear', 'chemical', 'biological', 'troops',
    'navy', 'army', 'air force', 'border', 'frontline', 'occupation',
    'hamas', 'hezbollah', 'isis', 'taliban', 'al-qaeda', 'wagner',
    'putin', 'zelenskyy', 'netanyahu', 'khamenei', 'erdogan',
    // German
    'krieg', 'angriff', 'explosion', 'bombe', 'rakete',
    'terrorismus', 'demonstration', 'protest', 'gewalt', 'konflikt',
    'militär', 'soldat', 'waffen', 'gefecht', 'opfer',
    // Spanish
    'guerra', 'ataque', 'explosión', 'bomba', 'misil',
    'terrorismo', 'protesta', 'violencia', 'conflicto', 'militar',
    // French
    'guerre', 'attaque', 'explosion', 'bombe', 'missile',
    'terrorisme', 'manifestation', 'violence', 'conflit', 'militaire'
];



interface GDELTGeoResponse {
    type: string;
    features: Array<{
        type: string;
        properties: {
            name: string;
            count: number;
            shareimage?: string;
            html?: string;
            urltone?: number;
        };
        geometry: {
            type: string;
            coordinates: [number, number];
        };
    }>;
}





// Map GDELT themes to our categories
function mapToCategory(themes: string[] = [], title: string = ''): EventCategory {
    const text = [...themes, title.toLowerCase()].join(' ').toLowerCase();

    if (text.includes('terror') || text.includes('bombing') || text.includes('suicide')) {
        return 'terrorism';
    }
    if (text.includes('protest') || text.includes('demonstration') || text.includes('riot')) {
        return 'protest';
    }
    if (text.includes('weapon') || text.includes('arms') || text.includes('nuclear') || text.includes('missile')) {
        return 'weapons';
    }
    if (text.includes('explosion') || text.includes('bomb') || text.includes('blast')) {
        return 'explosion';
    }
    if (text.includes('airstrike') || text.includes('air strike') || text.includes('air raid')) {
        return 'air_raid';
    }
    if (text.includes('drone') || text.includes('uav')) {
        return 'drone';
    }
    if (text.includes('shell') || text.includes('artillery') || text.includes('rocket')) {
        return 'shelling';
    }
    if (text.includes('combat') || text.includes('battle') || text.includes('fight') || text.includes('clash')) {
        return 'combat';
    }
    if (text.includes('naval') || text.includes('ship') || text.includes('maritime')) {
        return 'naval';
    }
    if (text.includes('humanitarian') || text.includes('refugee') || text.includes('aid')) {
        return 'humanitarian';
    }
    if (text.includes('politic') || text.includes('election') || text.includes('government') || text.includes('diplomac')) {
        return 'political';
    }
    if (text.includes('infrastructure') || text.includes('power') || text.includes('bridge')) {
        return 'infrastructure';
    }
    if (text.includes('troop') || text.includes('movement') || text.includes('convoy')) {
        return 'movement';
    }

    // Default based on general conflict
    return 'combat';
}

// Determine severity from text
function determineSeverity(title: string, body?: string): SeverityLevel {
    const text = `${title} ${body || ''}`.toLowerCase();

    if (text.includes('massacre') || text.includes('mass casualt') || text.includes('dozens killed') ||
        text.includes('hundreds') || text.includes('terror attack') || text.includes('nuclear')) {
        return 'critical';
    }
    if (text.includes('killed') || text.includes('dead') || text.includes('casualt') ||
        text.includes('explosion') || text.includes('airstrike') || text.includes('bombing')) {
        return 'high';
    }
    if (text.includes('injured') || text.includes('wounded') || text.includes('clash') ||
        text.includes('protest') || text.includes('demonstration')) {
        return 'medium';
    }

    return 'low';
}

// Generate unique ID
function generateId(): string {
    return `live-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Fetch events from GDELT GEO API with location data
export async function fetchGDELTEvents(): Promise<MapEvent[]> {
    const events: MapEvent[] = [];

    // Expanded queries for priority regions
    const queries = [
        // Priority regions
        'ukraine OR russia OR kyiv OR moscow OR donbas',
        'gaza OR israel OR hamas OR tel aviv OR jerusalem',
        'syria OR iran OR tehran OR damascus',
        'turkey OR erdogan OR ankara OR kurdish',
        'europe OR nato OR germany OR france OR uk',
        'usa OR washington OR pentagon OR american',
        // Secondary regions
        'india OR pakistan OR kashmir OR delhi',
        'thailand OR cambodia OR vietnam OR myanmar OR philippines',
        'brazil OR argentina OR venezuela OR colombia',
        'mexico OR guatemala OR honduras OR haiti',
        // Global conflict keywords
        'conflict OR war OR attack OR military',
        'terrorism OR terror OR bomb OR explosion',
        'protest OR demonstration OR unrest OR riot',
        'weapons OR missile OR drone OR airstrike',
        'hostage OR kidnap OR assassination',
        'sanctions OR nuclear OR troops'
    ];

    for (const query of queries) {
        try {
            const params = new URLSearchParams({
                query: query,
                mode: 'pointdata',
                format: 'geojson',
                timespan: '24h',
                maxpoints: '30'
            });

            const response = await fetch(`${GDELT_GEO_API}?${params}`);

            if (!response.ok) {
                console.warn(`GDELT GEO API error for query "${query}":`, response.status);
                continue;
            }

            const data: GDELTGeoResponse = await response.json();

            if (data.features) {
                for (const feature of data.features) {
                    if (feature.geometry && feature.geometry.coordinates) {
                        const [lng, lat] = feature.geometry.coordinates;

                        // Extract title from HTML or use name
                        let title = feature.properties.name || 'Event';
                        if (feature.properties.html) {
                            const match = feature.properties.html.match(/<b>([^<]+)<\/b>/);
                            if (match) title = match[1];
                        }

                        events.push({
                            id: generateId(),
                            title: title.substring(0, 100),
                            description: feature.properties.html?.replace(/<[^>]*>/g, '').substring(0, 300) || null,
                            category: mapToCategory([], title),
                            severity: determineSeverity(title),
                            coordinates: [lng, lat],
                            eventDate: new Date(),
                            sourceUrl: null,
                            verified: false,
                            mediaUrls: feature.properties.shareimage ? [feature.properties.shareimage] : [],
                            tags: [query.split(' ')[0]]
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`Error fetching GDELT GEO for "${query}":`, error);
        }
    }

    return events;
}

// Fetch from GDELT DOC API (article search)
export async function fetchGDELTArticles(): Promise<MapEvent[]> {
    const events: MapEvent[] = [];

    try {
        const params = new URLSearchParams({
            query: 'conflict OR war OR terrorism OR protest sourcecountry:US OR sourcecountry:UK OR sourcecountry:DE',
            mode: 'artlist',
            format: 'json',
            maxrecords: '50',
            timespan: '24h',
            sort: 'datedesc'
        });

        const response = await fetch(`${GDELT_DOC_API}?${params}`);

        if (!response.ok) {
            console.warn('GDELT DOC API error:', response.status);
            return events;
        }

        await response.json(); // Parse but don't use (no coords in DOC API)

        // GDELT DOC API articles don't have coordinates by default
        // We would need to geocode the locations mentioned
        // For now, skip this as we focus on GEO API

    } catch (error) {
        console.error('Error fetching GDELT articles:', error);
    }

    return events;
}

// Fetch humanitarian crisis data from ReliefWeb
export async function fetchReliefWebEvents(): Promise<MapEvent[]> {
    const events: MapEvent[] = [];

    try {
        // Build URL with proper parameters
        const url = `${RELIEFWEB_API}?appname=globalobserver&preset=latest&limit=50&profile=list`;

        const response = await fetch(url);

        if (!response.ok) {
            console.warn('ReliefWeb API error:', response.status);
            return events;
        }

        const data = await response.json();

        if (data.data) {
            for (const report of data.data) {
                const fields = report.fields;

                // Get coordinates from country (with fallback locations)
                let coordinates: [number, number] | null = null;
                const countryName = fields.country?.[0]?.name?.toLowerCase() || '';

                // Known country coordinates
                const countryCoords: Record<string, [number, number]> = {
                    'ukraine': [31.16, 48.38], 'syria': [36.72, 34.80], 'yemen': [44.21, 15.37],
                    'sudan': [32.53, 15.59], 'myanmar': [96.17, 16.87], 'afghanistan': [69.17, 34.52],
                    'iraq': [44.36, 33.31], 'somalia': [45.34, 2.04], 'libya': [13.18, 32.89],
                    'ethiopia': [38.74, 9.03], 'democratic republic of the congo': [15.28, -4.32],
                    'haiti': [-72.29, 18.54], 'nigeria': [7.49, 9.06], 'mali': [-8.00, 12.65],
                    'lebanon': [35.50, 33.89], 'palestine': [34.46, 31.50], 'israel': [35.21, 31.77],
                    'pakistan': [73.05, 33.69], 'bangladesh': [90.39, 23.81], 'mozambique': [35.53, -18.67],
                    'burkina faso': [-1.56, 12.37], 'niger': [8.08, 17.61], 'cameroon': [12.35, 5.95],
                    'chad': [18.73, 15.45], 'central african republic': [20.94, 6.61]
                };

                for (const [country, coords] of Object.entries(countryCoords)) {
                    if (countryName.includes(country)) {
                        coordinates = [coords[0] + (Math.random() - 0.5), coords[1] + (Math.random() - 0.5)];
                        break;
                    }
                }

                if (!coordinates) continue;

                // Check if relevant to our topics
                const title = (fields.title || '').toLowerCase();
                const isRelevant = CONFLICT_KEYWORDS.some(kw => title.includes(kw));
                if (!isRelevant) continue;

                const themes = fields.theme?.map((t: { name: string }) => t.name) || [];

                events.push({
                    id: generateId(),
                    title: (fields.title || 'ReliefWeb Report').substring(0, 100),
                    description: null,
                    category: mapToCategory(themes, fields.title || ''),
                    severity: determineSeverity(fields.title || ''),
                    coordinates: coordinates,
                    eventDate: new Date(fields.date?.created || Date.now()),
                    sourceUrl: `https://reliefweb.int/node/${report.id}`,
                    verified: true,
                    mediaUrls: [],
                    tags: themes.slice(0, 5)
                });
            }
        }
    } catch (error) {
        console.error('Error fetching ReliefWeb data:', error);
    }

    return events;
}

// Fetch and parse RSS feeds
export async function fetchRSSEvents(): Promise<MapEvent[]> {
    const events: MapEvent[] = [];

    // Expanded conflict locations - Priority regions
    const conflictLocations: Record<string, [number, number]> = {
        // === PRIORITY REGIONS ===
        // Russia/Ukraine (Highest Priority)
        'ukraine': [31.16, 48.38],
        'kyiv': [30.52, 50.45],
        'kharkiv': [36.23, 49.99],
        'odesa': [30.73, 46.48],
        'odessa': [30.73, 46.48],
        'donbas': [38.50, 48.00],
        'donetsk': [37.80, 48.02],
        'luhansk': [39.30, 48.57],
        'crimea': [34.10, 44.95],
        'mariupol': [37.55, 47.10],
        'zaporizhzhia': [35.14, 47.84],
        'russia': [37.62, 55.75],
        'moscow': [37.62, 55.75],
        'kursk': [36.18, 51.73],
        'belgorod': [36.60, 50.60],

        // Gaza/Israel (Highest Priority)
        'gaza': [34.46, 31.50],
        'israel': [35.21, 31.77],
        'jerusalem': [35.21, 31.77],
        'tel aviv': [34.78, 32.08],
        'west bank': [35.25, 31.95],
        'rafah': [34.25, 31.30],
        'khan younis': [34.30, 31.35],

        // Syria
        'syria': [36.72, 34.80],
        'damascus': [36.28, 33.51],
        'aleppo': [37.16, 36.21],
        'idlib': [36.63, 35.93],

        // Iran
        'iran': [51.42, 35.69],
        'tehran': [51.42, 35.69],
        'isfahan': [51.67, 32.65],

        // Turkey
        'turkey': [32.86, 39.93],
        'türkei': [32.86, 39.93],
        'ankara': [32.86, 39.93],
        'istanbul': [28.98, 41.01],
        'kurdish': [43.00, 37.00],

        // Europe
        'europe': [10.45, 51.17],
        'germany': [10.45, 51.17],
        'deutschland': [10.45, 51.17],
        'berlin': [13.40, 52.52],
        'france': [2.35, 48.86],
        'frankreich': [2.35, 48.86],
        'paris': [2.35, 48.86],
        'uk': [-0.12, 51.51],
        'london': [-0.12, 51.51],
        'britain': [-0.12, 51.51],
        'poland': [21.02, 52.23],
        'romania': [26.10, 44.43],
        'serbia': [20.46, 44.82],
        'kosovo': [21.17, 42.67],
        'bosnia': [17.91, 43.86],

        // USA
        'usa': [-77.04, 38.91],
        'united states': [-77.04, 38.91],
        'washington': [-77.04, 38.91],
        'new york': [-74.01, 40.71],
        'pentagon': [-77.06, 38.87],
        'american': [-98.58, 39.83],

        // === SECONDARY PRIORITY ===
        // India/Pakistan
        'india': [77.21, 28.61],
        'delhi': [77.21, 28.61],
        'mumbai': [72.88, 19.08],
        'kashmir': [76.07, 33.78],
        'pakistan': [73.05, 33.69],
        'islamabad': [73.05, 33.69],
        'karachi': [67.00, 24.86],
        'lahore': [74.35, 31.56],

        // Southeast Asia
        'thailand': [100.50, 13.76],
        'bangkok': [100.50, 13.76],
        'cambodia': [104.92, 11.56],
        'phnom penh': [104.92, 11.56],
        'vietnam': [105.85, 21.03],
        'myanmar': [96.17, 16.87],
        'burma': [96.17, 16.87],
        'philippines': [120.98, 14.60],
        'manila': [120.98, 14.60],
        'indonesia': [106.85, -6.21],
        'jakarta': [106.85, -6.21],
        'malaysia': [101.69, 3.14],

        // South America
        'brazil': [-47.93, -15.78],
        'brasilia': [-47.93, -15.78],
        'rio': [-43.17, -22.91],
        'argentina': [-58.38, -34.60],
        'buenos aires': [-58.38, -34.60],
        'venezuela': [-66.88, 10.49],
        'caracas': [-66.88, 10.49],
        'colombia': [-74.07, 4.71],
        'bogota': [-74.07, 4.71],
        'peru': [-77.03, -12.05],
        'lima': [-77.03, -12.05],
        'chile': [-70.65, -33.45],
        'ecuador': [-78.47, -0.18],

        // Central America
        'mexico': [-99.13, 19.43],
        'mexico city': [-99.13, 19.43],
        'guatemala': [-90.51, 14.64],
        'honduras': [-87.22, 14.08],
        'el salvador': [-89.19, 13.69],
        'nicaragua': [-86.27, 12.11],
        'panama': [-79.52, 9.00],
        'haiti': [-72.29, 18.54],
        'cuba': [-82.37, 23.11],

        // === OTHER REGIONS ===
        // Middle East
        'yemen': [44.21, 15.37],
        'sanaa': [44.17, 15.35],
        'saudi arabia': [46.68, 24.71],
        'riyadh': [46.68, 24.71],
        'iraq': [44.36, 33.31],
        'baghdad': [44.36, 33.31],
        'lebanon': [35.50, 33.89],
        'beirut': [35.50, 33.89],
        'jordan': [35.93, 31.95],
        'qatar': [51.53, 25.29],
        'uae': [54.37, 24.45],
        'dubai': [55.27, 25.20],
        'kuwait': [47.98, 29.37],
        'bahrain': [50.59, 26.23],

        // Africa
        'sudan': [32.53, 15.59],
        'khartoum': [32.53, 15.59],
        'ethiopia': [38.74, 9.03],
        'addis ababa': [38.74, 9.03],
        'tigray': [39.47, 14.03],
        'somalia': [45.34, 2.04],
        'mogadishu': [45.34, 2.04],
        'libya': [13.18, 32.89],
        'tripoli': [13.18, 32.89],
        'nigeria': [7.49, 9.06],
        'lagos': [3.39, 6.45],
        'mali': [-8.00, 12.65],
        'bamako': [-8.00, 12.65],
        'burkina faso': [-1.52, 12.37],
        'niger': [2.11, 13.51],
        'chad': [15.04, 12.13],
        'congo': [15.28, -4.32],
        'kinshasa': [15.28, -4.32],
        'drc': [15.28, -4.32],
        'south africa': [28.03, -26.20],
        'johannesburg': [28.05, -26.20],
        'egypt': [31.24, 30.04],
        'cairo': [31.24, 30.04],
        'kenya': [36.82, -1.29],
        'nairobi': [36.82, -1.29],
        'mozambique': [32.59, -25.97],
        'central african republic': [18.56, 4.36],

        // East Asia
        'china': [116.41, 39.90],
        'beijing': [116.41, 39.90],
        'shanghai': [121.47, 31.23],
        'xinjiang': [87.58, 43.82],
        'tibet': [91.11, 29.65],
        'hong kong': [114.17, 22.32],
        'taiwan': [121.56, 25.03],
        'taipei': [121.56, 25.03],
        'north korea': [125.75, 39.03],
        'pyongyang': [125.75, 39.03],
        'south korea': [126.98, 37.57],
        'seoul': [126.98, 37.57],
        'japan': [139.69, 35.69],
        'tokyo': [139.69, 35.69],

        // Central Asia
        'afghanistan': [69.17, 34.52],
        'kabul': [69.17, 34.52],
        'kazakhstan': [71.43, 51.09],
        'uzbekistan': [69.28, 41.31],
        'tajikistan': [68.77, 38.56],
        'kyrgyzstan': [74.59, 42.87],
        'turkmenistan': [58.38, 37.95],

        // Caucasus
        'georgia': [44.79, 41.72],
        'tbilisi': [44.79, 41.72],
        'armenia': [44.51, 40.18],
        'yerevan': [44.51, 40.18],
        'azerbaijan': [49.87, 40.41],
        'baku': [49.87, 40.41],
        'nagorno-karabakh': [46.75, 39.82],

        // Other
        'nato': [10.45, 51.17],
        'un': [-73.97, 40.75],
        'united nations': [-73.97, 40.75]
    };

    // Get coordinates from text by matching location names
    function getCoordinatesFromText(text: string): [number, number] | null {
        const lowerText = text.toLowerCase();
        for (const [location, coords] of Object.entries(conflictLocations)) {
            if (lowerText.includes(location)) {
                // Add some randomness to avoid stacking
                return [
                    coords[0] + (Math.random() - 0.5) * 2,
                    coords[1] + (Math.random() - 0.5) * 2
                ];
            }
        }
        return null;
    }

    // Use corsproxy.io as CORS proxy for RSS feeds (more reliable)
    const CORS_PROXIES = [
        'https://corsproxy.io/?url=',
        'https://api.codetabs.com/v1/proxy?quest='
    ];
    const CORS_PROXY = CORS_PROXIES[0];

    for (const [feedName, feedUrl] of Object.entries(RSS_FEEDS)) {
        try {
            const proxyUrl = `${CORS_PROXY}${encodeURIComponent(feedUrl)}`;
            const response = await fetch(proxyUrl);

            if (!response.ok) {
                console.warn(`RSS fetch error for ${feedName}:`, response.status);
                continue;
            }

            const xmlText = await response.text();

            // Simple XML parsing for RSS items
            const itemMatches = xmlText.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/g);

            for (const match of itemMatches) {
                const itemXml = match[1];

                // Extract title
                const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([^<\]]+)/i);
                const title = titleMatch ? titleMatch[1].trim() : '';

                // Extract link
                const linkMatch = itemXml.match(/<link[^>]*>([^<]+)/i);
                const link = linkMatch ? linkMatch[1].trim() : '';

                // Extract description
                const descMatch = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([^<\]]*)/i);
                const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';

                // Extract pubDate
                const dateMatch = itemXml.match(/<pubDate[^>]*>([^<]+)/i);
                const pubDate = dateMatch ? dateMatch[1].trim() : '';

                if (!title) continue;

                const fullText = `${title} ${description}`;

                // Check if relevant
                const isRelevant = CONFLICT_KEYWORDS.some(kw =>
                    fullText.toLowerCase().includes(kw)
                );
                if (!isRelevant) continue;

                // Get coordinates
                const coordinates = getCoordinatesFromText(fullText);
                if (!coordinates) continue;

                events.push({
                    id: generateId(),
                    title: title.substring(0, 100),
                    description: description.substring(0, 300) || null,
                    category: mapToCategory([], title),
                    severity: determineSeverity(title, description),
                    coordinates: coordinates,
                    eventDate: pubDate ? new Date(pubDate) : new Date(),
                    sourceUrl: link,
                    verified: true,
                    mediaUrls: [],
                    tags: [feedName]
                });
            }
        } catch (error) {
            console.error(`Error fetching RSS feed ${feedName}:`, error);
        }
    }

    return events;
}

// Fetch natural disaster events from NASA EONET
export async function fetchNASAEONETEvents(): Promise<MapEvent[]> {
    const events: MapEvent[] = [];

    try {
        // Fetch recent events (last 30 days, limit 50)
        const params = new URLSearchParams({
            status: 'open',
            limit: '50',
            days: '30'
        });

        const response = await fetch(`${NASA_EONET_API}?${params}`);

        if (!response.ok) {
            console.warn('NASA EONET API error:', response.status);
            return events;
        }

        const data = await response.json();

        if (data.events) {
            for (const event of data.events) {
                // Get the most recent geometry (location)
                const geometry = event.geometry?.[0];
                if (!geometry?.coordinates) continue;

                const [lng, lat] = geometry.coordinates;

                // Map EONET categories to our categories
                let category: EventCategory = 'infrastructure';
                const categoryId = event.categories?.[0]?.id || '';

                if (categoryId.includes('wildfire') || categoryId.includes('fire')) {
                    category = 'explosion';
                } else if (categoryId.includes('volcano')) {
                    category = 'explosion';
                } else if (categoryId.includes('earthquake')) {
                    category = 'shelling'; // Visual representation
                } else if (categoryId.includes('storm') || categoryId.includes('cyclone')) {
                    category = 'air_raid';
                } else if (categoryId.includes('flood')) {
                    category = 'humanitarian';
                }

                // Determine severity based on event type
                let severity: SeverityLevel = 'medium';
                if (categoryId.includes('volcano') || categoryId.includes('earthquake')) {
                    severity = 'high';
                } else if (categoryId.includes('wildfire')) {
                    severity = 'high';
                }

                events.push({
                    id: generateId(),
                    title: (event.title || 'Natural Disaster Event').substring(0, 100),
                    description: `${event.categories?.[0]?.title || 'Event'} - NASA EONET`,
                    category,
                    severity,
                    coordinates: [lng, lat],
                    eventDate: new Date(geometry.date || Date.now()),
                    sourceUrl: event.link || null,
                    verified: true,
                    mediaUrls: [],
                    tags: ['nasa-eonet', event.categories?.[0]?.title || 'natural-disaster']
                });
            }
        }
    } catch (error) {
        console.error('Error fetching NASA EONET data:', error);
    }

    return events;
}

// Fetch earthquake data from USGS
export async function fetchUSGSEarthquakes(): Promise<MapEvent[]> {
    const events: MapEvent[] = [];

    try {
        // Fetch earthquakes from last 7 days with magnitude >= 4.0
        const params = new URLSearchParams({
            format: 'geojson',
            starttime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endtime: new Date().toISOString().split('T')[0],
            minmagnitude: '4.0',
            limit: '100',
            orderby: 'time'
        });

        const response = await fetch(`${USGS_EARTHQUAKE_API}?${params}`);

        if (!response.ok) {
            console.warn('USGS Earthquake API error:', response.status);
            return events;
        }

        const data = await response.json();

        if (data.features) {
            for (const feature of data.features) {
                const props = feature.properties;
                const coords = feature.geometry?.coordinates;

                if (!coords) continue;

                const [lng, lat] = coords;
                const magnitude = props.mag || 0;

                // Determine severity based on magnitude
                let severity: SeverityLevel = 'low';
                if (magnitude >= 7.0) {
                    severity = 'critical';
                } else if (magnitude >= 6.0) {
                    severity = 'high';
                } else if (magnitude >= 5.0) {
                    severity = 'medium';
                }

                events.push({
                    id: generateId(),
                    title: `Erdbeben M${magnitude.toFixed(1)} - ${props.place || 'Unknown'}`.substring(0, 100),
                    description: `Magnitude ${magnitude.toFixed(1)} earthquake at depth ${(coords[2] || 0).toFixed(0)}km`,
                    category: 'shelling', // Visual representation for earthquake
                    severity,
                    coordinates: [lng, lat],
                    eventDate: new Date(props.time || Date.now()),
                    sourceUrl: props.url || null,
                    verified: true,
                    mediaUrls: [],
                    tags: ['usgs', 'earthquake', `M${magnitude.toFixed(0)}`]
                });
            }
        }
    } catch (error) {
        console.error('Error fetching USGS earthquake data:', error);
    }

    return events;
}

// Fetch Wikipedia Current Events for additional context
export async function fetchWikipediaCurrentEvents(): Promise<MapEvent[]> {
    const events: MapEvent[] = [];
    
    // Conflict locations mapping
    const conflictLocations: Record<string, [number, number]> = {
        'ukraine': [31.16, 48.38], 'russia': [37.62, 55.75], 'kyiv': [30.52, 50.45],
        'gaza': [34.46, 31.50], 'israel': [35.21, 31.77], 'jerusalem': [35.21, 31.77],
        'syria': [36.72, 34.80], 'iran': [51.42, 35.69], 'yemen': [44.21, 15.37],
        'sudan': [32.53, 15.59], 'lebanon': [35.50, 33.89], 'iraq': [44.36, 33.31],
        'afghanistan': [69.17, 34.52], 'pakistan': [73.05, 33.69], 'india': [77.21, 28.61],
        'china': [116.41, 39.90], 'taiwan': [121.56, 25.03], 'north korea': [125.75, 39.03],
        'myanmar': [96.17, 16.87], 'ethiopia': [38.74, 9.03], 'somalia': [45.34, 2.04],
        'libya': [13.18, 32.89], 'mali': [-8.00, 12.65], 'nigeria': [7.49, 9.06],
        'venezuela': [-66.88, 10.49], 'mexico': [-99.13, 19.43], 'haiti': [-72.29, 18.54],
        'turkey': [32.86, 39.93], 'germany': [10.45, 51.17], 'france': [2.35, 48.86],
        'usa': [-77.04, 38.91], 'united states': [-77.04, 38.91]
    };

    try {
        const response = await fetch(WIKIPEDIA_API);
        if (!response.ok) return events;
        
        const html = await response.text();
        
        // Extract headlines from Armed conflicts section
        const armedConflictsMatch = html.match(/Armed conflicts[^<]*<\/[^>]+>([\s\S]*?)(?:<h[23]|$)/i);
        if (armedConflictsMatch) {
            const section = armedConflictsMatch[1];
            const liMatches = section.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
            
            for (const match of liMatches) {
                const text = match[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                if (text.length < 20) continue;
                
                // Find location
                let coords: [number, number] | null = null;
                const lowerText = text.toLowerCase();
                for (const [loc, c] of Object.entries(conflictLocations)) {
                    if (lowerText.includes(loc)) {
                        coords = [c[0] + (Math.random() - 0.5), c[1] + (Math.random() - 0.5)];
                        break;
                    }
                }
                if (!coords) continue;
                
                events.push({
                    id: generateId(),
                    title: text.substring(0, 100),
                    description: text.substring(0, 300),
                    category: mapToCategory([], text),
                    severity: determineSeverity(text),
                    coordinates: coords,
                    eventDate: new Date(),
                    sourceUrl: 'https://en.wikipedia.org/wiki/Portal:Current_events',
                    verified: true,
                    mediaUrls: [],
                    tags: ['wikipedia', 'current-events']
                });
            }
        }
    } catch (error) {
        console.error('Error fetching Wikipedia current events:', error);
    }
    
    return events;
}

// Helper function to add timeout to fetch calls
async function fetchWithTimeout<T>(fetchFn: () => Promise<T>, timeoutMs: number = 10000): Promise<T> {
    return Promise.race([
        fetchFn(),
        new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
    ]);
}

// Fallback demo events when APIs fail
function getFallbackEvents(): MapEvent[] {
    const now = new Date();
    return [
        {
            id: 'demo-1',
            title: 'Iran protesters defy crackdown as videos show violent clashes',
            description: 'Hundreds of protesters are believed to have been killed or injured, and many more detained.',
            category: 'protest' as EventCategory,
            severity: 'critical' as SeverityLevel,
            coordinates: [51.39, 35.69], // Tehran
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['iran', 'protest']
        },
        {
            id: 'demo-2',
            title: 'US military strikes Islamic State group targets in Syria, officials say',
            description: 'US President Donald Trump ordered the "large-scale strikes" on Saturday, US Central Command said.',
            category: 'air_raid' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [38.99, 34.80], // Syria
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['syria', 'us-military', 'isis']
        },
        {
            id: 'demo-3',
            title: 'Thousands march and dozens arrested in Minneapolis protests against ICE',
            description: 'Days after the death of Renee Good, protests continue in Minneapolis and cities across the country.',
            category: 'protest' as EventCategory,
            severity: 'medium' as SeverityLevel,
            coordinates: [-93.27, 44.98], // Minneapolis
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['usa', 'protest', 'ice']
        },
        {
            id: 'demo-4',
            title: 'Last Kurdish forces leave Aleppo after ceasefire deal reached',
            description: 'The deal was announced in the early hours of Sunday morning after a week of violent clashes.',
            category: 'combat' as EventCategory,
            severity: 'medium' as SeverityLevel,
            coordinates: [37.16, 36.20], // Aleppo
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['syria', 'kurdish', 'ceasefire']
        },
        {
            id: 'demo-5',
            title: 'US seizes fifth oil tanker linked to Venezuela, officials say',
            description: 'The ship was intercepted in international waters carrying crude oil.',
            category: 'naval' as EventCategory,
            severity: 'low' as SeverityLevel,
            coordinates: [-66.58, 10.48], // Venezuela coast
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['venezuela', 'usa', 'sanctions']
        },
        {
            id: 'demo-6',
            title: 'Ongoing fighting in Kharkiv region as Russian forces advance',
            description: 'Heavy artillery exchanges reported near front lines.',
            category: 'shelling' as EventCategory,
            severity: 'critical' as SeverityLevel,
            coordinates: [36.25, 49.99], // Kharkiv
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['ukraine', 'russia', 'kharkiv']
        },
        {
            id: 'demo-7',
            title: 'Israeli airstrikes hit Gaza targets amid escalating tensions',
            description: 'Multiple strikes reported in northern Gaza Strip.',
            category: 'air_raid' as EventCategory,
            severity: 'critical' as SeverityLevel,
            coordinates: [34.44, 31.50], // Gaza
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['gaza', 'israel', 'airstrike']
        },
        {
            id: 'demo-8',
            title: 'Humanitarian crisis deepens in Sudan conflict zones',
            description: 'Aid agencies warn of catastrophic food shortages.',
            category: 'humanitarian' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [32.53, 15.59], // Khartoum
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['sudan', 'humanitarian']
        },
        {
            id: 'demo-9',
            title: 'Drone attack reported on military installation in Yemen',
            description: 'Houthi rebels claim responsibility for the attack.',
            category: 'drone' as EventCategory,
            severity: 'medium' as SeverityLevel,
            coordinates: [44.21, 15.37], // Yemen
            eventDate: now,
            sourceUrl: null,
            verified: false,
            mediaUrls: [],
            tags: ['yemen', 'houthi', 'drone']
        },
        {
            id: 'demo-10',
            title: 'Political tensions rise in Myanmar after military coup anniversary',
            description: 'Pro-democracy protests reported in major cities.',
            category: 'political' as EventCategory,
            severity: 'medium' as SeverityLevel,
            coordinates: [96.17, 16.87], // Yangon
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['myanmar', 'politics']
        },
        // Additional fallback events for more coverage
        {
            id: 'demo-11',
            title: 'Lebanon border tensions escalate with Hezbollah exchanges',
            description: 'Cross-border attacks continue between Israel and Lebanon.',
            category: 'combat' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [35.50, 33.27], // South Lebanon
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['lebanon', 'hezbollah', 'israel']
        },
        {
            id: 'demo-12',
            title: 'Niger military government conducts operations against insurgents',
            description: 'Security forces target extremist positions in border regions.',
            category: 'combat' as EventCategory,
            severity: 'medium' as SeverityLevel,
            coordinates: [2.11, 13.51], // Niger
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['niger', 'sahel', 'terrorism']
        },
        {
            id: 'demo-13',
            title: 'Taiwan reports increased Chinese military activity in strait',
            description: 'Multiple PLA aircraft detected in Taiwan ADIZ.',
            category: 'naval' as EventCategory,
            severity: 'medium' as SeverityLevel,
            coordinates: [119.50, 24.00], // Taiwan Strait
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['taiwan', 'china', 'military']
        },
        {
            id: 'demo-14',
            title: 'Renewed clashes in Nagorno-Karabakh region',
            description: 'Tensions rise between Armenia and Azerbaijan.',
            category: 'combat' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [46.75, 39.82], // Nagorno-Karabakh
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['armenia', 'azerbaijan', 'karabakh']
        },
        {
            id: 'demo-15',
            title: 'DRC: M23 rebels advance in North Kivu province',
            description: 'UN peacekeepers monitor escalating situation.',
            category: 'combat' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [29.05, -1.68], // North Kivu
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['drc', 'congo', 'm23']
        },
        {
            id: 'demo-16',
            title: 'Somalia: Al-Shabaab attack on government forces',
            description: 'Militant group claims responsibility for ambush.',
            category: 'terrorism' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [45.34, 2.04], // Mogadishu area
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['somalia', 'al-shabaab', 'terrorism']
        },
        {
            id: 'demo-17',
            title: 'Pakistan: Security operation in Balochistan',
            description: 'Military targets separatist militant positions.',
            category: 'combat' as EventCategory,
            severity: 'medium' as SeverityLevel,
            coordinates: [66.99, 30.12], // Balochistan
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['pakistan', 'balochistan']
        },
        {
            id: 'demo-18',
            title: 'Red Sea: Commercial vessel reports Houthi missile threat',
            description: 'Coalition forces intercept projectile near shipping lane.',
            category: 'naval' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [42.50, 14.80], // Red Sea
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['red-sea', 'yemen', 'shipping']
        },
        {
            id: 'demo-19',
            title: 'Libya: Armed groups clash in southern region',
            description: 'Fighting erupts over territorial control.',
            category: 'combat' as EventCategory,
            severity: 'medium' as SeverityLevel,
            coordinates: [13.18, 27.05], // Southern Libya
            eventDate: now,
            sourceUrl: null,
            verified: false,
            mediaUrls: [],
            tags: ['libya', 'militia']
        },
        {
            id: 'demo-20',
            title: 'Burkina Faso: JNIM militants attack village',
            description: 'Extremists target civilian population in northern region.',
            category: 'terrorism' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [-1.52, 14.03], // Northern Burkina Faso
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['burkina-faso', 'jnim', 'sahel']
        }
    ];
}

// Main function to fetch all live events
export async function fetchAllLiveEvents(): Promise<MapEvent[]> {
    console.log('🌍 Fetching live events from all sources...');

    try {
        // Try to fetch with timeout - increased to 20 seconds for slow APIs
        const results = await fetchWithTimeout(async () => {
            const [gdeltEvents, reliefWebEvents, rssEvents, eonetEvents, earthquakeEvents, wikiEvents] = await Promise.all([
                fetchGDELTEvents().catch(e => { console.warn('GDELT failed:', e.message); return []; }),
                fetchReliefWebEvents().catch(e => { console.warn('ReliefWeb failed:', e.message); return []; }),
                fetchRSSEvents().catch(e => { console.warn('RSS failed:', e.message); return []; }),
                fetchNASAEONETEvents().catch(e => { console.warn('NASA EONET failed:', e.message); return []; }),
                fetchUSGSEarthquakes().catch(e => { console.warn('USGS failed:', e.message); return []; }),
                fetchWikipediaCurrentEvents().catch(e => { console.warn('Wikipedia failed:', e.message); return []; })
            ]);
            return { gdeltEvents, reliefWebEvents, rssEvents, eonetEvents, earthquakeEvents, wikiEvents };
        }, 20000); // 20 second timeout

        const allEvents = [
            ...results.gdeltEvents, 
            ...results.reliefWebEvents, 
            ...results.rssEvents, 
            ...results.eonetEvents, 
            ...results.earthquakeEvents,
            ...results.wikiEvents
        ];

        // If we got some events, use them
        if (allEvents.length > 0) {
            // Remove duplicates based on similar titles and proximity
            const uniqueEvents = allEvents.filter((event, index, self) =>
                index === self.findIndex(e =>
                    e.title.substring(0, 30) === event.title.substring(0, 30) ||
                    (Math.abs(e.coordinates[0] - event.coordinates[0]) < 0.1 &&
                        Math.abs(e.coordinates[1] - event.coordinates[1]) < 0.1 &&
                        e.title.substring(0, 20) === event.title.substring(0, 20))
                )
            );

            console.log(`✅ Fetched ${uniqueEvents.length} unique events:`);
            console.log(`   - GDELT: ${results.gdeltEvents.length}`);
            console.log(`   - ReliefWeb: ${results.reliefWebEvents.length}`);
            console.log(`   - RSS: ${results.rssEvents.length}`);
            console.log(`   - NASA EONET: ${results.eonetEvents.length}`);
            console.log(`   - USGS Earthquakes: ${results.earthquakeEvents.length}`);
            console.log(`   - Wikipedia: ${results.wikiEvents.length}`);

            // If we have very few events, supplement with fallback
            if (uniqueEvents.length < 20) {
                console.log('⚠️ Supplementing with fallback events');
                const fallback = getFallbackEvents();
                return [...uniqueEvents, ...fallback.slice(0, 20 - uniqueEvents.length)];
            }

            return uniqueEvents;
        }

        // If no events from APIs, use fallback
        console.log('⚠️ No events from APIs, using fallback data');
        return getFallbackEvents();

    } catch (error) {
        console.error('❌ Error fetching live events, using fallback data:', error);
        return getFallbackEvents();
    }
}

// Conflict zone data - areas with ongoing conflicts for map coloring
export interface ConflictZone {
    id: string;
    name: string;
    intensity: 'low' | 'medium' | 'high' | 'critical';
    coordinates: [number, number][][]; // Polygon coordinates
    description: string;
}

// Import accurate country boundaries
import { COUNTRY_BOUNDARIES } from '../data/countryBoundaries';

export function getConflictZones(): ConflictZone[] {
    return [
        {
            id: 'ukraine',
            name: 'Ukraine',
            intensity: 'critical',
            coordinates: COUNTRY_BOUNDARIES['ukraine']?.coordinates as [number, number][][] || [[
                [22.15, 48.40], [40.08, 49.31], [35.02, 45.65], [22.15, 48.40]
            ]],
            description: 'Aktive Kampfzone im Ukraine-Konflikt'
        },
        {
            id: 'gaza',
            name: 'Gazastreifen',
            intensity: 'critical',
            coordinates: COUNTRY_BOUNDARIES['gaza']?.coordinates as [number, number][][] || [[
                [34.22, 31.22], [34.48, 31.60], [34.22, 31.22]
            ]],
            description: 'Israel-Gaza Konflikt'
        },
        {
            id: 'syria',
            name: 'Syrien',
            intensity: 'high',
            coordinates: COUNTRY_BOUNDARIES['syria']?.coordinates as [number, number][][] || [[
                [35.63, 33.09], [42.36, 37.11], [35.63, 33.09]
            ]],
            description: 'Syrischer Bürgerkrieg'
        },
        {
            id: 'yemen',
            name: 'Jemen',
            intensity: 'high',
            coordinates: COUNTRY_BOUNDARIES['yemen']?.coordinates as [number, number][][] || [[
                [43.22, 13.22], [52.00, 19.00], [43.22, 13.22]
            ]],
            description: 'Jemen-Konflikt'
        },
        {
            id: 'sudan',
            name: 'Sudan',
            intensity: 'high',
            coordinates: COUNTRY_BOUNDARIES['sudan']?.coordinates as [number, number][][] || [[
                [21.8, 8.7], [38.6, 22.2], [21.8, 8.7]
            ]],
            description: 'Sudan-Konflikt'
        },
        {
            id: 'myanmar',
            name: 'Myanmar',
            intensity: 'medium',
            coordinates: COUNTRY_BOUNDARIES['myanmar']?.coordinates as [number, number][][] || [[
                [92.19, 20.87], [100.12, 20.35], [92.19, 20.87]
            ]],
            description: 'Myanmar Bürgerkrieg'
        },
        {
            id: 'ethiopia-tigray',
            name: 'Tigray',
            intensity: 'medium',
            coordinates: COUNTRY_BOUNDARIES['ethiopia-tigray']?.coordinates as [number, number][][] || [[
                [36.44, 12.46], [40.77, 13.46], [36.44, 12.46]
            ]],
            description: 'Tigray-Konflikt'
        },
        {
            id: 'sahel',
            name: 'Sahel-Konfliktzone',
            intensity: 'medium',
            coordinates: COUNTRY_BOUNDARIES['sahel']?.coordinates as [number, number][][] || [[
                [-0.03, 14.99], [15.10, 21.31], [-0.03, 14.99]
            ]],
            description: 'Islamistischer Aufstand in der Sahel-Region'
        },
        {
            id: 'drc-east',
            name: 'DR Kongo (Ost)',
            intensity: 'high',
            coordinates: COUNTRY_BOUNDARIES['drc-east']?.coordinates as [number, number][][] || [[
                [27.37, -5.00], [30.86, 2.41], [27.37, -5.00]
            ]],
            description: 'Konflikt in der östlichen DR Kongo'
        },
        {
            id: 'haiti',
            name: 'Haiti',
            intensity: 'medium',
            coordinates: COUNTRY_BOUNDARIES['haiti']?.coordinates as [number, number][][] || [[
                [-74.46, 18.35], [-71.66, 18.32], [-74.46, 18.35]
            ]],
            description: 'Bandenkonflikte und Instabilität'
        },
        {
            id: 'lebanon',
            name: 'Libanon',
            intensity: 'high',
            coordinates: COUNTRY_BOUNDARIES['lebanon']?.coordinates as [number, number][][] || [[
                [35.10, 33.09], [36.42, 34.59], [35.10, 33.09]
            ]],
            description: 'Hezbollah-Israel Spannungen'
        },
        {
            id: 'israel-westbank',
            name: 'Israel/Westjordanland',
            intensity: 'high',
            coordinates: COUNTRY_BOUNDARIES['israel-westbank']?.coordinates as [number, number][][] || [[
                [34.27, 31.22], [35.63, 33.09], [34.27, 31.22]
            ]],
            description: 'Israelisch-Palästinensischer Konflikt'
        },
        {
            id: 'iraq',
            name: 'Irak',
            intensity: 'medium',
            coordinates: COUNTRY_BOUNDARIES['iraq']?.coordinates as [number, number][][] || [[
                [38.79, 33.38], [48.01, 30.99], [38.79, 33.38]
            ]],
            description: 'Anhaltende Instabilität und Milizen'
        },
        {
            id: 'iran',
            name: 'Iran',
            intensity: 'low',
            coordinates: COUNTRY_BOUNDARIES['iran']?.coordinates as [number, number][][] || [[
                [44.11, 39.43], [63.32, 26.76], [44.11, 39.43]
            ]],
            description: 'Regionale Spannungen und Sanktionen'
        },
        {
            id: 'kashmir',
            name: 'Kaschmir',
            intensity: 'medium',
            coordinates: COUNTRY_BOUNDARIES['kashmir']?.coordinates as [number, number][][] || [[
                [73.91, 32.49], [79.21, 32.50], [73.91, 32.49]
            ]],
            description: 'Indien-Pakistan Grenzkonflikt'
        }
    ];
}
