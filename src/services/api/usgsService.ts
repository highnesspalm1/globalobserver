// USGS Earthquake API Service
import type { MapEvent, SeverityLevel, USGSResponse } from './types';
import { USGS_EARTHQUAKE_API } from './constants';
import { generateId } from './utils';

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

        const data: USGSResponse = await response.json();

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
