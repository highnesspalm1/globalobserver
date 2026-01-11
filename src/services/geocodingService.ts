// Geocoding Service for Global Observer
// Uses Nominatim (OpenStreetMap) for precise coordinate extraction

interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
  importance: number;
  type: string;
  country?: string;
  city?: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  type: string;
  address?: {
    country?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
}

// Cache für Geocoding-Ergebnisse (reduziert API-Calls)
const CACHE_MAX_SIZE = 1000;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 Stunden

interface CacheEntry {
  result: GeocodingResult | null;
  timestamp: number;
}

const cacheWithTTL = new Map<string, CacheEntry>();

// Rate Limiting (Nominatim: max 1 request/second)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 Sekunden

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  return fetch(url);
}

/**
 * Geocodiert einen Ortsnamen zu Koordinaten
 */
export async function geocodeLocation(locationName: string): Promise<GeocodingResult | null> {
  if (!locationName || locationName.trim().length < 2) {
    return null;
  }

  const cacheKey = locationName.toLowerCase().trim();
  
  // Cache prüfen
  const cached = cacheWithTTL.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  try {
    const encodedLocation = encodeURIComponent(locationName);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&limit=1&addressdetails=1`;
    
    const response = await rateLimitedFetch(url);
    
    if (!response.ok) {
      console.warn(`Geocoding API error: ${response.status}`);
      return null;
    }

    const data: NominatimResponse[] = await response.json();
    
    if (data.length === 0) {
      // Cache negative Ergebnisse auch
      cacheWithTTL.set(cacheKey, { result: null, timestamp: Date.now() });
      return null;
    }

    const result: GeocodingResult = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name,
      importance: data[0].importance,
      type: data[0].type,
      country: data[0].address?.country,
      city: data[0].address?.city || data[0].address?.town || data[0].address?.village
    };

    // Cache speichern
    if (cacheWithTTL.size >= CACHE_MAX_SIZE) {
      // Älteste Einträge entfernen
      const oldestKey = cacheWithTTL.keys().next().value;
      if (oldestKey) cacheWithTTL.delete(oldestKey);
    }
    cacheWithTTL.set(cacheKey, { result, timestamp: Date.now() });

    return result;

  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Extrahiert Ortsnamen aus Text mit NLP-Heuristiken
 */
export function extractLocationNames(text: string): string[] {
  const locations: string[] = [];
  
  // Bekannte Ortsnamen-Patterns (Case-insensitive)
  const locationPatterns = [
    // "in [Location]"
    /\bin\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/g,
    // "[Location] city/region/province"
    /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:city|region|province|oblast|district|governorate)/gi,
    // "near/at/around [Location]"
    /(?:near|at|around|outside)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/gi,
    // Kapitalisierte Wörter nach ":" oder "-" (Headlines)
    /[:|-]\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/g,
  ];

  for (const pattern of locationPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 2) {
        locations.push(match[1].trim());
      }
    }
  }

  // Deduplizieren
  return [...new Set(locations)];
}

/**
 * Bekannte Konflikt-Orte mit präzisen Koordinaten
 */
export const KNOWN_LOCATIONS: Record<string, [number, number]> = {
  // Ukraine - Präzise Koordinaten
  'kyiv': [30.5234, 50.4501],
  'kiev': [30.5234, 50.4501],
  'kharkiv': [36.2304, 49.9935],
  'odesa': [30.7233, 46.4825],
  'odessa': [30.7233, 46.4825],
  'dnipro': [35.0462, 48.4647],
  'zaporizhzhia': [35.1396, 47.8388],
  'mariupol': [37.5494, 47.0951],
  'donetsk': [37.8028, 48.0159],
  'luhansk': [39.3078, 48.5740],
  'kherson': [32.6178, 46.6354],
  'bakhmut': [38.0000, 48.5953],
  'avdiivka': [37.7503, 48.1394],
  'kursk': [36.1874, 51.7373],
  'belgorod': [36.5873, 50.5997],
  
  // Gaza/Israel - Präzise
  'gaza': [34.4668, 31.5017],
  'gaza city': [34.4668, 31.5017],
  'rafah': [34.2355, 31.2969],
  'khan younis': [34.3029, 31.3462],
  'tel aviv': [34.7818, 32.0853],
  'jerusalem': [35.2137, 31.7683],
  'haifa': [34.9896, 32.7940],
  'ashkelon': [34.5715, 31.6688],
  
  // Libanon
  'beirut': [35.5018, 33.8938],
  'tyre': [35.1956, 33.2705],
  'sidon': [35.3731, 33.5633],
  'nabatieh': [35.4833, 33.3833],
  
  // Syrien
  'damascus': [36.2765, 33.5138],
  'aleppo': [37.1611, 36.2028],
  'idlib': [36.6317, 35.9306],
  'homs': [36.7128, 34.7324],
  'latakia': [35.7919, 35.5317],
  
  // Iran
  'tehran': [51.3890, 35.6892],
  'isfahan': [51.6688, 32.6546],
  'shiraz': [52.5836, 29.5918],
  'tabriz': [46.2919, 38.0800],
  
  // Jemen
  'sanaa': [44.2067, 15.3694],
  'aden': [45.0187, 12.7855],
  'hodeidah': [42.9511, 14.7979],
  'marib': [45.3250, 15.4617],
  
  // Sudan
  'khartoum': [32.5599, 15.5007],
  'omdurman': [32.4821, 15.6445],
  'port sudan': [37.2164, 19.6158],
  'darfur': [24.9042, 13.4500],
  'el fasher': [25.3494, 13.6286],
  
  // Rotes Meer / Houthi
  'bab el mandeb': [43.3333, 12.5833],
  'red sea': [38.0000, 20.0000],
  
  // Afrika
  'mogadishu': [45.3182, 2.0469],
  'addis ababa': [38.7578, 9.0054],
  'nairobi': [36.8219, -1.2921],
  'kinshasa': [15.2663, -4.4419],
  'goma': [29.2285, -1.6771],
  'bamako': [-8.0029, 12.6392],
  'ouagadougou': [-1.5197, 12.3714],
  'niamey': [2.1098, 13.5137],
  
  // Asien
  'kabul': [69.1723, 34.5553],
  'islamabad': [73.0479, 33.6844],
  'new delhi': [77.2090, 28.6139],
  'kashmir': [76.0700, 33.7800],
  'taipei': [121.5654, 25.0330],
  'beijing': [116.4074, 39.9042],
  'pyongyang': [125.7625, 39.0392],
  'seoul': [126.9780, 37.5665],
  'tokyo': [139.6917, 35.6895],
  'yangon': [96.1951, 16.8661],
  'naypyidaw': [96.1297, 19.7633],
  
  // Kaukasus
  'tbilisi': [44.7833, 41.7151],
  'yerevan': [44.5126, 40.1792],
  'baku': [49.8671, 40.4093],
  'stepanakert': [46.7657, 39.8265],
  
  // Europa
  'moscow': [37.6173, 55.7558],
  'berlin': [13.4050, 52.5200],
  'paris': [2.3522, 48.8566],
  'london': [-0.1276, 51.5074],
  'brussels': [4.3517, 50.8503],
  'warsaw': [21.0122, 52.2297],
  'bucharest': [26.1025, 44.4268],
  
  // Amerika
  'washington': [-77.0369, 38.9072],
  'new york': [-74.0060, 40.7128],
  'mexico city': [-99.1332, 19.4326],
  'caracas': [-66.9036, 10.4806],
  'bogota': [-74.0721, 4.7110],
  'port au prince': [-72.3388, 18.5944],
};

/**
 * Schnelle Koordinaten-Lookup für bekannte Orte
 */
export function getKnownLocationCoords(locationName: string): [number, number] | null {
  const normalized = locationName.toLowerCase().trim();
  
  // Exakte Übereinstimmung
  if (KNOWN_LOCATIONS[normalized]) {
    return KNOWN_LOCATIONS[normalized];
  }
  
  // Partielle Übereinstimmung
  for (const [key, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }
  
  return null;
}

/**
 * Kombinierte Geocoding-Funktion: Erst Cache/Known, dann API
 */
export async function smartGeocode(text: string): Promise<{ coordinates: [number, number]; confidence: 'high' | 'medium' | 'low' } | null> {
  // 1. Bekannte Orte checken (schnell, kein API-Call)
  const lowerText = text.toLowerCase();
  for (const [location, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (lowerText.includes(location)) {
      return {
        coordinates: [coords[0], coords[1]],
        confidence: 'high'
      };
    }
  }

  // 2. Ortsnamen aus Text extrahieren
  const extractedLocations = extractLocationNames(text);
  
  for (const location of extractedLocations) {
    // Erst bekannte Orte
    const known = getKnownLocationCoords(location);
    if (known) {
      return {
        coordinates: known,
        confidence: 'high'
      };
    }
    
    // Dann API (rate-limited)
    const geocoded = await geocodeLocation(location);
    if (geocoded && geocoded.importance > 0.3) {
      return {
        coordinates: [geocoded.lon, geocoded.lat],
        confidence: geocoded.importance > 0.6 ? 'high' : 'medium'
      };
    }
  }

  return null;
}

/**
 * Batch-Geocoding für mehrere Texte (mit Rate Limiting)
 */
export async function batchGeocode(
  texts: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, [number, number] | null>> {
  const results = new Map<string, [number, number] | null>();
  
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    const result = await smartGeocode(text);
    results.set(text, result?.coordinates || null);
    
    if (onProgress) {
      onProgress(i + 1, texts.length);
    }
  }
  
  return results;
}

/**
 * Exportiere Cache-Statistiken für Debugging
 */
export function getGeocodeStats() {
  return {
    cacheSize: cacheWithTTL.size,
    maxSize: CACHE_MAX_SIZE,
    knownLocationsCount: Object.keys(KNOWN_LOCATIONS).length
  };
}
