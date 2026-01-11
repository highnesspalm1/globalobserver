// GDELT API Service
import type { MapEvent, GDELTGeoResponse } from './types';
import { GDELT_GEO_API, GDELT_DOC_API } from './constants';
import { generateId, mapToCategory, determineSeverity } from './utils';

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
