// Shared Types for API Services
import type { MapEvent, EventCategory, SeverityLevel } from '../../types/database';

// GDELT API Response Types
export interface GDELTGeoResponse {
    type: string;
    features: Array<{
        type: string;
        properties: {
            name: string;
            count: number;
            shareimage?: string;
            html?: string;
            urltone?: number;
        };
        geometry: {
            type: string;
            coordinates: [number, number];
        };
    }>;
}

// ReliefWeb API Response Types
export interface ReliefWebReport {
    id: number;
    fields: {
        title?: string;
        country?: Array<{ name: string }>;
        theme?: Array<{ name: string }>;
        date?: { created: string };
    };
}

export interface ReliefWebResponse {
    data: ReliefWebReport[];
}

// NASA EONET Types
export interface EONETEvent {
    id: string;
    title: string;
    categories?: Array<{ id: string }>;
    geometry?: Array<{
        coordinates: [number, number];
        date: string;
    }>;
}

export interface EONETResponse {
    events: EONETEvent[];
}

// USGS Earthquake Types
export interface USGSFeature {
    id: string;
    properties: {
        mag: number;
        place: string;
        time: number;
        url: string;
        title: string;
    };
    geometry: {
        coordinates: [number, number, number];
    };
}

export interface USGSResponse {
    features: USGSFeature[];
}

// Re-export common types
export type { MapEvent, EventCategory, SeverityLevel };
