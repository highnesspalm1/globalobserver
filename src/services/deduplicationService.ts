// Event Deduplication Service for Global Observer
// Advanced similarity-based duplicate detection

import type { MapEvent } from '../types/database';

/**
 * Berechnet Levenshtein-Distanz zwischen zwei Strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  // Edge cases
  if (m === 0) return n;
  if (n === 0) return m;
  
  // Erstelle Matrix
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // Löschung
        dp[i][j - 1] + 1,      // Einfügung
        dp[i - 1][j - 1] + cost // Ersetzung
      );
    }
  }
  
  return dp[m][n];
}

/**
 * Berechnet Ähnlichkeit zwischen zwei Strings (0-1)
 */
export function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

/**
 * Berechnet Jaccard-Ähnlichkeit basierend auf Wort-Sets
 */
export function jaccardSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Berechnet geografische Distanz zwischen zwei Koordinaten (Haversine)
 */
export function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371; // Erdradius in km
  
  const lat1 = coord1[1] * Math.PI / 180;
  const lat2 = coord2[1] * Math.PI / 180;
  const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distanz in km
}

/**
 * Berechnet zeitliche Nähe (0-1, 1 = gleicher Zeitpunkt)
 */
export function temporalSimilarity(date1: Date, date2: Date, maxHours: number = 24): number {
  const diffMs = Math.abs(date1.getTime() - date2.getTime());
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours >= maxHours) return 0;
  return 1 - diffHours / maxHours;
}

/**
 * Event-Duplikat-Score (0-1, höher = wahrscheinlicher Duplikat)
 */
export interface DuplicateScore {
  score: number;
  titleSimilarity: number;
  locationSimilarity: number;
  temporalSimilarity: number;
  categorySimilarity: number;
}

export function calculateDuplicateScore(
  event1: MapEvent,
  event2: MapEvent
): DuplicateScore {
  // Titel-Ähnlichkeit (Kombination aus Levenshtein und Jaccard)
  const levenshteinSim = stringSimilarity(event1.title, event2.title);
  const jaccardSim = jaccardSimilarity(event1.title, event2.title);
  const titleSimilarity = Math.max(levenshteinSim, jaccardSim);
  
  // Koordinaten-Ähnlichkeit
  const distance = haversineDistance(event1.coordinates, event2.coordinates);
  // 50km als Schwelle für "gleiches Gebiet"
  const locationSimilarity = distance < 50 ? 1 - distance / 50 : 0;
  
  // Zeitliche Ähnlichkeit
  const tempSim = temporalSimilarity(event1.eventDate, event2.eventDate, 48);
  
  // Kategorie-Ähnlichkeit
  const categorySimilarity = event1.category === event2.category ? 1 : 0.3;
  
  // Gewichteter Score
  const score = (
    titleSimilarity * 0.45 +      // Titel ist wichtigstes Kriterium
    locationSimilarity * 0.25 +   // Standort
    tempSim * 0.20 +              // Zeit
    categorySimilarity * 0.10     // Kategorie
  );
  
  return {
    score,
    titleSimilarity,
    locationSimilarity,
    temporalSimilarity: tempSim,
    categorySimilarity
  };
}

/**
 * Findet Duplikat-Cluster in einer Event-Liste
 */
export interface DuplicateCluster {
  primary: MapEvent;
  duplicates: { event: MapEvent; score: DuplicateScore }[];
}

export function findDuplicateClusters(
  events: MapEvent[],
  threshold: number = 0.65
): DuplicateCluster[] {
  const clusters: DuplicateCluster[] = [];
  const processed = new Set<string>();
  
  for (let i = 0; i < events.length; i++) {
    const event1 = events[i];
    
    if (processed.has(event1.id)) continue;
    
    const duplicates: { event: MapEvent; score: DuplicateScore }[] = [];
    
    for (let j = i + 1; j < events.length; j++) {
      const event2 = events[j];
      
      if (processed.has(event2.id)) continue;
      
      const score = calculateDuplicateScore(event1, event2);
      
      if (score.score >= threshold) {
        duplicates.push({ event: event2, score });
        processed.add(event2.id);
      }
    }
    
    if (duplicates.length > 0) {
      clusters.push({
        primary: event1,
        duplicates
      });
      processed.add(event1.id);
    }
  }
  
  return clusters;
}

/**
 * Entfernt Duplikate und behält das "beste" Event
 * Kriterien: verified > unverified, mehr Details, neueres Datum
 */
export function deduplicateEvents(
  events: MapEvent[],
  threshold: number = 0.65
): MapEvent[] {
  const clusters = findDuplicateClusters(events, threshold);
  const toRemove = new Set<string>();
  
  for (const cluster of clusters) {
    // Wähle das "beste" Event aus dem Cluster
    const allEvents = [cluster.primary, ...cluster.duplicates.map(d => d.event)];
    
    // Sortiere nach Qualität
    allEvents.sort((a, b) => {
      // Verified Events bevorzugen
      if (a.verified !== b.verified) {
        return a.verified ? -1 : 1;
      }
      // Mehr Tags = mehr Kontext
      const tagsA = a.tags?.length || 0;
      const tagsB = b.tags?.length || 0;
      if (tagsA !== tagsB) return tagsB - tagsA;
      // Längere Beschreibung bevorzugen
      const descA = a.description?.length || 0;
      const descB = b.description?.length || 0;
      if (Math.abs(descA - descB) > 50) return descB - descA;
      // Neueres Event bevorzugen
      return b.eventDate.getTime() - a.eventDate.getTime();
    });
    
    // Behalte das beste, markiere Rest zum Entfernen
    for (let i = 1; i < allEvents.length; i++) {
      toRemove.add(allEvents[i].id);
    }
  }
  
  return events.filter(e => !toRemove.has(e.id));
}

/**
 * Schnelle Pre-Filter für potenzielle Duplikate (O(n) statt O(n²))
 * Gruppiert Events nach Zeit und ungefährem Standort
 */
export function createEventBuckets(events: MapEvent[]): Map<string, MapEvent[]> {
  const buckets = new Map<string, MapEvent[]>();
  
  for (const event of events) {
    // Zeit-Bucket (4-Stunden-Fenster)
    const date = event.eventDate;
    const timeKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${Math.floor(date.getHours() / 4)}`;
    
    // Geo-Bucket (gerundete Koordinaten)
    const lat = Math.round(event.coordinates[1]);
    const lon = Math.round(event.coordinates[0]);
    const geoKey = `${lat}_${lon}`;
    
    const bucketKey = `${timeKey}|${geoKey}`;
    
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(event);
  }
  
  return buckets;
}

/**
 * Optimierte Deduplizierung mit Bucketing (für große Event-Mengen)
 */
export function fastDeduplicateEvents(
  events: MapEvent[],
  threshold: number = 0.65
): MapEvent[] {
  // Wenn wenige Events, normale Methode verwenden
  if (events.length < 100) {
    return deduplicateEvents(events, threshold);
  }
  
  const buckets = createEventBuckets(events);
  const toRemove = new Set<string>();
  
  // Nur innerhalb von Buckets vergleichen
  for (const bucketEvents of buckets.values()) {
    if (bucketEvents.length > 1) {
      const clusters = findDuplicateClusters(bucketEvents, threshold);
      
      for (const cluster of clusters) {
        const allEvents = [cluster.primary, ...cluster.duplicates.map(d => d.event)];
        
        // Sortiere und behalte bestes
        allEvents.sort((a, b) => {
          if (a.verified !== b.verified) return a.verified ? -1 : 1;
          return b.eventDate.getTime() - a.eventDate.getTime();
        });
        
        for (let i = 1; i < allEvents.length; i++) {
          toRemove.add(allEvents[i].id);
        }
      }
    }
  }
  
  return events.filter(e => !toRemove.has(e.id));
}

/**
 * Merge-Funktion für Duplikate (kombiniert Informationen)
 */
export function mergeEvents(events: MapEvent[]): MapEvent {
  if (events.length === 0) throw new Error('No events to merge');
  if (events.length === 1) return events[0];
  
  // Sortiere nach Qualität
  const sorted = [...events].sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    return b.eventDate.getTime() - a.eventDate.getTime();
  });
  
  const primary = sorted[0];
  
  // Sammle alle Tags
  const allTags = new Set<string>();
  for (const event of events) {
    event.tags?.forEach(tag => allTags.add(tag));
  }
  
  // Längste Beschreibung verwenden
  let bestDescription = primary.description;
  for (const event of events) {
    if (event.description && (!bestDescription || event.description.length > bestDescription.length)) {
      bestDescription = event.description;
    }
  }
  
  // Sammle alle Media-URLs
  const allMedia = new Set<string>();
  for (const event of events) {
    event.mediaUrls?.forEach(url => allMedia.add(url));
  }
  
  return {
    ...primary,
    description: bestDescription,
    tags: [...allTags],
    mediaUrls: [...allMedia],
    verified: events.some(e => e.verified)
  };
}

/**
 * Statistiken über Duplikate
 */
export interface DeduplicationStats {
  originalCount: number;
  deduplicatedCount: number;
  removedCount: number;
  clusterCount: number;
  averageClusterSize: number;
}

export function getDeduplicationStats(
  originalEvents: MapEvent[],
  deduplicatedEvents: MapEvent[],
  clusters: DuplicateCluster[]
): DeduplicationStats {
  const totalInClusters = clusters.reduce(
    (sum, c) => sum + 1 + c.duplicates.length,
    0
  );
  
  return {
    originalCount: originalEvents.length,
    deduplicatedCount: deduplicatedEvents.length,
    removedCount: originalEvents.length - deduplicatedEvents.length,
    clusterCount: clusters.length,
    averageClusterSize: clusters.length > 0 
      ? totalInClusters / clusters.length 
      : 0
  };
}
