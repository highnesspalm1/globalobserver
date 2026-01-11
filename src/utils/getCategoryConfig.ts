// Category and Severity Configuration with i18n support
// This provides a function-based approach to get localized labels

import type { EventCategory, SeverityLevel, TerritoryActor } from '../types/database';
import type { TranslationKeys } from '../i18n/types';

// Category metadata structure (without hardcoded labels)
export interface CategoryMetadata {
    key: EventCategory;
    color: string;
    icon: string;
}

// Base category configuration (without labels - labels come from i18n)
export const CATEGORY_METADATA: Record<EventCategory, Omit<CategoryMetadata, 'key'>> = {
    shelling: { color: '#dc2626', icon: 'bomb' },
    air_raid: { color: '#ea580c', icon: 'plane' },
    movement: { color: '#d97706', icon: 'truck' },
    combat: { color: '#b91c1c', icon: 'crosshair' },
    drone: { color: '#7c3aed', icon: 'radio' },
    naval: { color: '#0284c7', icon: 'anchor' },
    political: { color: '#0891b2', icon: 'landmark' },
    humanitarian: { color: '#16a34a', icon: 'heart' },
    infrastructure: { color: '#ca8a04', icon: 'building' },
    terrorism: { color: '#7f1d1d', icon: 'skull' },
    protest: { color: '#a855f7', icon: 'megaphone' },
    weapons: { color: '#374151', icon: 'swords' },
    explosion: { color: '#f97316', icon: 'flame' },
    cyberattack: { color: '#06b6d4', icon: 'terminal' },
    sanctions: { color: '#8b5cf6', icon: 'ban' },
    election: { color: '#10b981', icon: 'vote' },
};

// Severity metadata structure
export interface SeverityMetadata {
    key: SeverityLevel;
    color: string;
    priority: number;
}

// Base severity configuration
export const SEVERITY_METADATA: Record<SeverityLevel, Omit<SeverityMetadata, 'key'>> = {
    low: { color: '#16a34a', priority: 1 },
    medium: { color: '#d97706', priority: 2 },
    high: { color: '#dc2626', priority: 3 },
    critical: { color: '#7f1d1d', priority: 4 },
};

// Actor metadata structure
export interface ActorMetadata {
    key: TerritoryActor;
    color: string;
    fillColor: string;
}

// Base actor configuration
export const ACTOR_METADATA: Record<TerritoryActor, Omit<ActorMetadata, 'key'>> = {
    UA: { color: '#0057b7', fillColor: 'rgba(0, 87, 183, 0.3)' },
    RU: { color: '#dc2626', fillColor: 'rgba(220, 38, 38, 0.3)' },
    contested: { color: '#ea580c', fillColor: 'rgba(234, 88, 12, 0.4)' },
    liberated: { color: '#16a34a', fillColor: 'rgba(22, 163, 74, 0.3)' },
    occupied: { color: '#991b1b', fillColor: 'rgba(153, 27, 27, 0.4)' },
};

// Helper function to get localized category config
export function getCategoryConfig(
    category: EventCategory,
    t: TranslationKeys
): CategoryMetadata & { label: string; description: string } {
    const metadata = CATEGORY_METADATA[category];
    const categoryKey = category === 'air_raid' ? 'airRaid' : category;

    return {
        key: category,
        ...metadata,
        label: t.categories[categoryKey as keyof typeof t.categories] || category,
        description: '', // Add descriptions to i18n if needed
    };
}

// Helper function to get localized severity config
export function getSeverityConfig(
    severity: SeverityLevel,
    t: TranslationKeys
): SeverityMetadata & { label: string } {
    const metadata = SEVERITY_METADATA[severity];

    return {
        key: severity,
        ...metadata,
        label: t.severity[severity] || severity,
    };
}

// Get all categories with localized labels
export function getAllCategoriesConfig(t: TranslationKeys) {
    return (Object.keys(CATEGORY_METADATA) as EventCategory[]).map(cat =>
        getCategoryConfig(cat, t)
    );
}

// Get all severities with localized labels
export function getAllSeveritiesConfig(t: TranslationKeys) {
    return (Object.keys(SEVERITY_METADATA) as SeverityLevel[]).map(sev =>
        getSeverityConfig(sev, t)
    );
}
