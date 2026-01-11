// Wikipedia Current Events Service
import type { MapEvent } from './types';
import { WIKIPEDIA_API } from './constants';
import { generateId, mapToCategory, determineSeverity } from './utils';

// Conflict locations mapping
const WIKI_CONFLICT_LOCATIONS: Record<string, [number, number]> = {
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

// Fetch Wikipedia Current Events for additional context
export async function fetchWikipediaCurrentEvents(): Promise<MapEvent[]> {
    const events: MapEvent[] = [];

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
                for (const [loc, c] of Object.entries(WIKI_CONFLICT_LOCATIONS)) {
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
