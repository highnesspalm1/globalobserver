// Live Data Service for Global Observer
// Main aggregator that uses modular API services
// Fetches real-time events from GDELT, ReliefWeb, RSS feeds, NASA EONET, USGS, and Wikipedia

import type { MapEvent } from '../types/database';
import { COUNTRY_BOUNDARIES } from '../data/countryBoundaries';
import { fastDeduplicateEvents, getDeduplicationStats, findDuplicateClusters } from './deduplicationService';

// Import from modular API services
import {
    fetchGDELTEvents,
    fetchReliefWebEvents,
    fetchRSSEvents,
    fetchNASAEONETEvents,
    fetchUSGSEarthquakes,
    fetchWikipediaCurrentEvents,
    getFallbackEvents,
    fetchWithTimeout
} from './api';

// Re-export for backwards compatibility
export { fetchGDELTEvents, fetchGDELTArticles } from './api/gdeltService';
export { fetchReliefWebEvents } from './api/reliefWebService';
export { fetchRSSEvents } from './api/rssService';
export { fetchNASAEONETEvents } from './api/nasaEonetService';
export { fetchUSGSEarthquakes } from './api/usgsService';
export { fetchWikipediaCurrentEvents } from './api/wikipediaService';
export { getFallbackEvents } from './api/fallbackData';

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
            // Use advanced similarity-based deduplication
            const uniqueEvents = fastDeduplicateEvents(allEvents, 0.65);

            // Get deduplication stats for logging
            const clusters = findDuplicateClusters(allEvents, 0.65);
            const stats = getDeduplicationStats(allEvents, uniqueEvents, clusters);

            console.log(`✅ Fetched ${uniqueEvents.length} unique events (${stats.removedCount} duplicates removed):`);
            console.log(`   - GDELT: ${results.gdeltEvents.length}`);
            console.log(`   - ReliefWeb: ${results.reliefWebEvents.length}`);
            console.log(`   - RSS: ${results.rssEvents.length}`);
            console.log(`   - NASA EONET: ${results.eonetEvents.length}`);
            console.log(`   - USGS Earthquakes: ${results.earthquakeEvents.length}`);
            console.log(`   - Wikipedia: ${results.wikiEvents.length}`);
            console.log(`   📊 Dedup Stats: ${stats.clusterCount} clusters, avg size ${stats.averageClusterSize.toFixed(1)}`);

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

export function getConflictZones(): ConflictZone[] {
    return [
        {
            id: 'ukraine',
            name: 'Ukraine',
            intensity: 'critical',
            coordinates: COUNTRY_BOUNDARIES['ukraine']?.coordinates as [number, number][][] || [[[22.15, 48.40], [40.08, 49.31], [35.02, 45.65], [22.15, 48.40]]],
            description: 'Aktive Kampfzone im Ukraine-Konflikt'
        },
        {
            id: 'gaza',
            name: 'Gazastreifen',
            intensity: 'critical',
            coordinates: COUNTRY_BOUNDARIES['gaza']?.coordinates as [number, number][][] || [[[34.22, 31.22], [34.48, 31.60], [34.22, 31.22]]],
            description: 'Israel-Gaza Konflikt'
        },
        {
            id: 'syria',
            name: 'Syrien',
            intensity: 'high',
            coordinates: COUNTRY_BOUNDARIES['syria']?.coordinates as [number, number][][] || [[[35.63, 33.09], [42.36, 37.11], [35.63, 33.09]]],
            description: 'Syrischer Bürgerkrieg'
        },
        {
            id: 'yemen',
            name: 'Jemen',
            intensity: 'high',
            coordinates: COUNTRY_BOUNDARIES['yemen']?.coordinates as [number, number][][] || [[[43.22, 13.22], [52.00, 19.00], [43.22, 13.22]]],
            description: 'Jemen-Konflikt'
        },
        {
            id: 'sudan',
            name: 'Sudan',
            intensity: 'high',
            coordinates: COUNTRY_BOUNDARIES['sudan']?.coordinates as [number, number][][] || [[[21.8, 8.7], [38.6, 22.2], [21.8, 8.7]]],
            description: 'Sudan-Konflikt'
        },
        {
            id: 'myanmar',
            name: 'Myanmar',
            intensity: 'medium',
            coordinates: COUNTRY_BOUNDARIES['myanmar']?.coordinates as [number, number][][] || [[[92.19, 20.87], [100.12, 20.35], [92.19, 20.87]]],
            description: 'Myanmar Bürgerkrieg'
        },
        {
            id: 'lebanon',
            name: 'Libanon',
            intensity: 'high',
            coordinates: COUNTRY_BOUNDARIES['lebanon']?.coordinates as [number, number][][] || [[[35.10, 33.09], [36.42, 34.59], [35.10, 33.09]]],
            description: 'Hezbollah-Israel Spannungen'
        },
        {
            id: 'israel-westbank',
            name: 'Israel/Westjordanland',
            intensity: 'high',
            coordinates: COUNTRY_BOUNDARIES['israel-westbank']?.coordinates as [number, number][][] || [[[34.27, 31.22], [35.63, 33.09], [34.27, 31.22]]],
            description: 'Israelisch-Palästinensischer Konflikt'
        }
    ];
}
