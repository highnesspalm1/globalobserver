// ReliefWeb API Service
import type { MapEvent, ReliefWebResponse } from './types';
import { RELIEFWEB_API, CONFLICT_KEYWORDS } from './constants';
import { generateId, mapToCategory, determineSeverity } from './utils';

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

        const data: ReliefWebResponse = await response.json();

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
