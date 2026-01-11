// Fallback Demo Events when APIs fail
import type { MapEvent, EventCategory, SeverityLevel } from './types';

// Fallback demo events when APIs fail
export function getFallbackEvents(): MapEvent[] {
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
            description: 'US President ordered the "large-scale strikes" on Saturday, US Central Command said.',
            category: 'air_raid' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [40.14, 35.34], // Deir ez-Zor
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['syria', 'usa', 'airstrike']
        },
        {
            id: 'demo-3',
            title: 'Ukraine reports heavy fighting in Donbas region',
            description: 'Ukrainian forces repel multiple assault attempts near Bakhmut.',
            category: 'combat' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [38.00, 48.60], // Bakhmut area
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['ukraine', 'russia', 'combat']
        },
        {
            id: 'demo-4',
            title: 'Gaza humanitarian situation worsens amid ongoing conflict',
            description: 'Aid organizations report critical shortages of food and medicine.',
            category: 'humanitarian' as EventCategory,
            severity: 'critical' as SeverityLevel,
            coordinates: [34.46, 31.50], // Gaza
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['gaza', 'humanitarian']
        },
        {
            id: 'demo-5',
            title: 'Tensions rise at Lebanon-Israel border',
            description: 'Exchange of fire reported between Hezbollah and Israeli forces.',
            category: 'shelling' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [35.50, 33.10], // Lebanon border
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['lebanon', 'israel', 'hezbollah']
        },
        {
            id: 'demo-6',
            title: 'Sudan conflict displaces millions',
            description: 'Fighting between army and RSF forces continues in Khartoum.',
            category: 'combat' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [32.53, 15.59], // Khartoum
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['sudan', 'conflict']
        },
        {
            id: 'demo-7',
            title: 'Drone attack reported in Moscow region',
            description: 'Russian authorities report interception of drones near the capital.',
            category: 'drone' as EventCategory,
            severity: 'medium' as SeverityLevel,
            coordinates: [37.62, 55.75], // Moscow
            eventDate: now,
            sourceUrl: null,
            verified: false,
            mediaUrls: [],
            tags: ['russia', 'ukraine', 'drone']
        },
        {
            id: 'demo-8',
            title: 'Yemen Houthi forces launch missile towards Red Sea',
            description: 'Commercial shipping affected by ongoing attacks.',
            category: 'naval' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [42.50, 15.00], // Red Sea
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['yemen', 'houthi', 'red-sea']
        },
        {
            id: 'demo-9',
            title: 'Protests erupt in multiple Turkish cities',
            description: 'Demonstrations reported in Istanbul and Ankara over economic policies.',
            category: 'protest' as EventCategory,
            severity: 'medium' as SeverityLevel,
            coordinates: [28.98, 41.01], // Istanbul
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['turkey', 'protest']
        },
        {
            id: 'demo-10',
            title: 'Myanmar military operation in Rakhine State',
            description: 'Reports of civilian displacement amid fighting with rebel groups.',
            category: 'combat' as EventCategory,
            severity: 'high' as SeverityLevel,
            coordinates: [92.90, 20.15], // Rakhine
            eventDate: now,
            sourceUrl: null,
            verified: true,
            mediaUrls: [],
            tags: ['myanmar', 'military']
        }
    ];
}
