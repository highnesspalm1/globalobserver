// RSS Feed Service
import type { MapEvent } from './types';
import { RSS_FEEDS, CONFLICT_KEYWORDS, CORS_PROXIES } from './constants';
import { generateId, mapToCategory, determineSeverity } from './utils';

// Expanded conflict locations for RSS geocoding
const RSS_CONFLICT_LOCATIONS: Record<string, [number, number]> = {
    // Russia/Ukraine
    'ukraine': [31.16, 48.38], 'kyiv': [30.52, 50.45], 'kharkiv': [36.23, 49.99],
    'odesa': [30.73, 46.48], 'odessa': [30.73, 46.48], 'donbas': [38.50, 48.00],
    'donetsk': [37.80, 48.02], 'luhansk': [39.30, 48.57], 'crimea': [34.10, 44.95],
    'mariupol': [37.55, 47.10], 'zaporizhzhia': [35.14, 47.84], 'russia': [37.62, 55.75],
    'moscow': [37.62, 55.75], 'kursk': [36.18, 51.73], 'belgorod': [36.60, 50.60],

    // Gaza/Israel
    'gaza': [34.46, 31.50], 'israel': [35.21, 31.77], 'jerusalem': [35.21, 31.77],
    'tel aviv': [34.78, 32.08], 'west bank': [35.25, 31.95], 'rafah': [34.25, 31.30],

    // Syria
    'syria': [36.72, 34.80], 'damascus': [36.28, 33.51], 'aleppo': [37.16, 36.21],
    'idlib': [36.63, 35.93], 'homs': [36.72, 34.73],

    // Iran
    'iran': [51.42, 35.69], 'tehran': [51.42, 35.69], 'isfahan': [51.67, 32.65],

    // Turkey/Kurdistan
    'turkey': [32.86, 39.93], 'türkiye': [32.86, 39.93], 'ankara': [32.86, 39.93],
    'istanbul': [28.98, 41.01], 'kurdish': [43.00, 37.00], 'diyarbakir': [40.21, 37.92],

    // Europe
    'germany': [10.45, 51.17], 'berlin': [13.40, 52.52], 'france': [2.35, 48.86],
    'paris': [2.35, 48.86], 'uk': [-0.12, 51.51], 'london': [-0.12, 51.51],

    // USA
    'usa': [-77.04, 38.91], 'united states': [-77.04, 38.91], 'washington': [-77.04, 38.91],

    // Other hotspots
    'yemen': [44.21, 15.37], 'sudan': [32.53, 15.59], 'lebanon': [35.50, 33.89],
    'iraq': [44.36, 33.31], 'afghanistan': [69.17, 34.52], 'pakistan': [73.05, 33.69],
    'india': [77.21, 28.61], 'china': [116.41, 39.90], 'taiwan': [121.56, 25.03],
    'myanmar': [96.17, 16.87], 'ethiopia': [38.74, 9.03], 'somalia': [45.34, 2.04],
    'libya': [13.18, 32.89], 'nigeria': [7.49, 9.06], 'mali': [-8.00, 12.65],
    'venezuela': [-66.88, 10.49], 'mexico': [-99.13, 19.43], 'haiti': [-72.29, 18.54],
    'north korea': [125.75, 39.03], 'south korea': [126.98, 37.57], 'japan': [139.69, 35.69]
};

// Get coordinates from text by matching location names
function getCoordinatesFromText(text: string): [number, number] | null {
    const lowerText = text.toLowerCase();
    for (const [location, coords] of Object.entries(RSS_CONFLICT_LOCATIONS)) {
        if (lowerText.includes(location)) {
            // Add randomness to avoid stacking
            return [
                coords[0] + (Math.random() - 0.5) * 2,
                coords[1] + (Math.random() - 0.5) * 2
            ];
        }
    }
    return null;
}

// Fetch and parse RSS feeds
export async function fetchRSSEvents(): Promise<MapEvent[]> {
    const events: MapEvent[] = [];
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
