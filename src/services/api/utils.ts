// Utility functions for API Services
import type { EventCategory, SeverityLevel, MapEvent } from './types';

// Generate unique ID
export function generateId(): string {
    return `live-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Map GDELT themes to our categories
export function mapToCategory(themes: string[] = [], title: string = ''): EventCategory {
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
export function determineSeverity(title: string, body?: string): SeverityLevel {
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

// Helper function to add timeout to fetch calls
export async function fetchWithTimeout<T>(
    fetchFn: () => Promise<T>,
    timeoutMs: number = 10000
): Promise<T> {
    return Promise.race([
        fetchFn(),
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
    ]);
}

// Create a MapEvent with defaults
export function createMapEvent(
    partial: Partial<MapEvent> & Pick<MapEvent, 'title' | 'coordinates' | 'category' | 'severity'>
): MapEvent {
    return {
        id: generateId(),
        description: null,
        eventDate: new Date(),
        sourceUrl: null,
        verified: false,
        mediaUrls: [],
        tags: [],
        ...partial,
    };
}
