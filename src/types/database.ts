// Database Types for Supabase
export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          created_at: string;
          event_date: string;
          title: string;
          description: string | null;
          source_url: string | null;
          category: EventCategory;
          location: string; // PostGIS GEOGRAPHY(POINT, 4326)
          latitude: number;
          longitude: number;
          verified: boolean;
          analyst_id: string | null;
          media_urls: string[] | null;
          tags: string[] | null;
          severity: SeverityLevel;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      territory_history: {
        Row: {
          id: string;
          created_at: string;
          actor: TerritoryActor;
          geom: string; // PostGIS GEOGRAPHY(POLYGON, 4326)
          valid_from: string;
          valid_to: string | null;
          change_reason: string | null;
          source_references: string[] | null;
        };
        Insert: Omit<Database['public']['Tables']['territory_history']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['territory_history']['Insert']>;
      };
      raw_reports: {
        Row: {
          id: string;
          created_at: string;
          source: string;
          content: string;
          source_url: string | null;
          raw_data: Record<string, unknown> | null;
          processed: boolean;
          extracted_location: string | null;
          extracted_category: string | null;
        };
        Insert: Omit<Database['public']['Tables']['raw_reports']['Row'], 'id' | 'created_at' | 'processed'>;
        Update: Partial<Database['public']['Tables']['raw_reports']['Insert']>;
      };
      frontlines: {
        Row: {
          id: string;
          created_at: string;
          geom: string; // PostGIS GEOGRAPHY(LINESTRING, 4326)
          valid_from: string;
          valid_to: string | null;
          sector: string | null;
          status: FrontlineStatus;
        };
        Insert: Omit<Database['public']['Tables']['frontlines']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['frontlines']['Insert']>;
      };
    };
    Views: {
      events_geojson: {
        Row: {
          type: 'Feature';
          geometry: GeoJSON.Point;
          properties: Database['public']['Tables']['events']['Row'];
        };
      };
      territories_geojson: {
        Row: {
          type: 'Feature';
          geometry: GeoJSON.Polygon;
          properties: Database['public']['Tables']['territory_history']['Row'];
        };
      };
    };
  };
}

// Enum Types
export type EventCategory =
  | 'shelling'
  | 'air_raid'
  | 'movement'
  | 'political'
  | 'humanitarian'
  | 'combat'
  | 'drone'
  | 'naval'
  | 'infrastructure'
  | 'terrorism'
  | 'protest'
  | 'weapons'
  | 'explosion'
  | 'cyberattack'
  | 'sanctions'
  | 'election';

export type TerritoryActor =
  | 'UA'      // Ukraine controlled
  | 'RU'      // Russia controlled
  | 'contested'
  | 'liberated'
  | 'occupied';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type FrontlineStatus = 'active' | 'stable' | 'advancing' | 'retreating';

// GeoJSON Types
export interface GeoJSONFeature<G extends GeoJSON.Geometry, P> {
  type: 'Feature';
  geometry: G;
  properties: P;
  id?: string | number;
}

export interface GeoJSONFeatureCollection<G extends GeoJSON.Geometry, P> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<G, P>[];
}

// Map Event type for UI
export interface MapEvent {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  severity: SeverityLevel;
  coordinates: [number, number]; // [lng, lat]
  eventDate: Date;
  sourceUrl: string | null;
  verified: boolean;
  mediaUrls: string[];
  tags: string[];
}

// Map Territory type for UI
export interface MapTerritory {
  id: string;
  actor: TerritoryActor;
  coordinates: [number, number][][]; // Polygon coordinates
  validFrom: Date;
  validTo: Date | null;
  changeReason: string | null;
}

// Category metadata for UI
export const CATEGORY_CONFIG: Record<EventCategory, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  shelling: {
    label: 'Beschuss',
    color: '#dc2626',
    icon: 'bomb',
    description: 'Artillerie, Raketen, Mörserbeschuss',
  },
  air_raid: {
    label: 'Luftangriff',
    color: '#ea580c',
    icon: 'plane',
    description: 'Luftalarme und Luftangriffe',
  },
  movement: {
    label: 'Truppenbewegung',
    color: '#d97706',
    icon: 'truck',
    description: 'Militärische Bewegungen und Kolonnen',
  },
  combat: {
    label: 'Gefecht',
    color: '#b91c1c',
    icon: 'crosshair',
    description: 'Aktive Kampfhandlungen',
  },
  drone: {
    label: 'Drohne',
    color: '#7c3aed',
    icon: 'radio',
    description: 'Drohnenaktivität und -angriffe',
  },
  naval: {
    label: 'Marine',
    color: '#0284c7',
    icon: 'anchor',
    description: 'Maritime Operationen',
  },
  political: {
    label: 'Politik',
    color: '#0891b2',
    icon: 'landmark',
    description: 'Politische Ereignisse',
  },
  humanitarian: {
    label: 'Humanitär',
    color: '#16a34a',
    icon: 'heart',
    description: 'Humanitäre Vorfälle',
  },
  infrastructure: {
    label: 'Infrastruktur',
    color: '#ca8a04',
    icon: 'building',
    description: 'Infrastrukturschäden',
  },
  terrorism: {
    label: 'Terrorismus',
    color: '#7f1d1d',
    icon: 'skull',
    description: 'Terroranschläge und -aktivitäten',
  },
  protest: {
    label: 'Demonstration',
    color: '#a855f7',
    icon: 'megaphone',
    description: 'Proteste und Demonstrationen',
  },
  weapons: {
    label: 'Waffen',
    color: '#374151',
    icon: 'swords',
    description: 'Waffen und Rüstung',
  },
  explosion: {
    label: 'Explosion',
    color: '#f97316',
    icon: 'flame',
    description: 'Explosionen und Detonationen',
  },
  cyberattack: {
    label: 'Cyberangriff',
    color: '#06b6d4',
    icon: 'terminal',
    description: 'Cyberangriffe und Hacking',
  },
  sanctions: {
    label: 'Sanktionen',
    color: '#8b5cf6',
    icon: 'ban',
    description: 'Wirtschaftssanktionen und Embargo',
  },
  election: {
    label: 'Wahl',
    color: '#10b981',
    icon: 'vote',
    description: 'Wahlen und politische Abstimmungen',
  },
};

// Territory Actor metadata
export const ACTOR_CONFIG: Record<TerritoryActor, {
  label: string;
  color: string;
  fillColor: string;
  description: string;
}> = {
  UA: {
    label: 'Ukraine',
    color: '#0057b7',
    fillColor: 'rgba(0, 87, 183, 0.3)',
    description: 'Unter ukrainischer Kontrolle',
  },
  RU: {
    label: 'Russland',
    color: '#dc2626',
    fillColor: 'rgba(220, 38, 38, 0.3)',
    description: 'Unter russischer Besatzung',
  },
  contested: {
    label: 'Umkämpft',
    color: '#ea580c',
    fillColor: 'rgba(234, 88, 12, 0.4)',
    description: 'Umkämpftes Gebiet',
  },
  liberated: {
    label: 'Befreit',
    color: '#16a34a',
    fillColor: 'rgba(22, 163, 74, 0.3)',
    description: 'Kürzlich befreites Gebiet',
  },
  occupied: {
    label: 'Besetzt',
    color: '#991b1b',
    fillColor: 'rgba(153, 27, 27, 0.4)',
    description: 'Besetztes Gebiet',
  },
};

// Severity metadata
export const SEVERITY_CONFIG: Record<SeverityLevel, {
  label: string;
  color: string;
  priority: number;
}> = {
  low: {
    label: 'Niedrig',
    color: '#16a34a',
    priority: 1,
  },
  medium: {
    label: 'Mittel',
    color: '#d97706',
    priority: 2,
  },
  high: {
    label: 'Hoch',
    color: '#dc2626',
    priority: 3,
  },
  critical: {
    label: 'Kritisch',
    color: '#7f1d1d',
    priority: 4,
  },
};
