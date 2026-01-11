// NASA EONET API Service for natural disaster events
import type { MapEvent, EventCategory, SeverityLevel, EONETResponse } from './types';
import { NASA_EONET_API } from './constants';
import { generateId } from './utils';

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

        const data: EONETResponse = await response.json();

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
                    description: `${event.categories?.[0]?.id || 'Event'} - NASA EONET`,
                    category,
                    severity,
                    coordinates: [lng, lat],
                    eventDate: new Date(geometry.date || Date.now()),
                    sourceUrl: null,
                    verified: true,
                    mediaUrls: [],
                    tags: ['nasa-eonet', event.categories?.[0]?.id || 'natural-disaster']
                });
            }
        }
    } catch (error) {
        console.error('Error fetching NASA EONET data:', error);
    }

    return events;
}
