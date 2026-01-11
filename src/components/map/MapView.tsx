import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { useMapStore } from '../../stores/mapStore';
import { CATEGORY_CONFIG, ACTOR_CONFIG } from '../../types/database';
import { EventPopup } from './EventPopup';
import { CoordinateDisplay } from './CoordinateDisplay';
import styles from './MapView.module.css';

// Map Styles
const MAP_STYLES = {
  dark: {
    version: 8 as const,
    name: 'Dark Tactical',
    sources: {
      'osm-tiles': {
        type: 'raster' as const,
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors, © CARTO',
      },
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster' as const,
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19,
        paint: {
          'raster-saturation': -0.8,
          'raster-brightness-min': 0.1,
          'raster-brightness-max': 0.5,
          'raster-contrast': 0.3,
        },
      },
    ],
  },
  satellite: {
    version: 8 as const,
    name: 'Satellite',
    sources: {
      'satellite-tiles': {
        type: 'raster' as const,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: '© Esri',
      },
    },
    layers: [
      {
        id: 'satellite-layer',
        type: 'raster' as const,
        source: 'satellite-tiles',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
  terrain: {
    version: 8 as const,
    name: 'Terrain',
    sources: {
      'terrain-tiles': {
        type: 'raster' as const,
        tiles: [
          'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors, © OpenTopoMap',
      },
    },
    layers: [
      {
        id: 'terrain-layer',
        type: 'raster' as const,
        source: 'terrain-tiles',
        minzoom: 0,
        maxzoom: 17,
        paint: {
          'raster-saturation': -0.5,
          'raster-brightness-max': 0.7,
        },
      },
    ],
  },
  tactical: {
    version: 8 as const,
    name: 'Tactical',
    sources: {
      'tactical-tiles': {
        type: 'raster' as const,
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors, © CARTO',
      },
    },
    layers: [
      {
        id: 'tactical-layer',
        type: 'raster' as const,
        source: 'tactical-tiles',
        minzoom: 0,
        maxzoom: 19,
        paint: {
          'raster-saturation': -1,
          'raster-brightness-min': 0.05,
          'raster-brightness-max': 0.3,
          'raster-contrast': 0.5,
        },
      },
    ],
  },
};

// Event data type for popup
interface PopupEventData {
  id: string;
  title: string;
  description?: string;
  category: string;
  severity: string;
  eventDate: string;
  verified: boolean;
  sourceUrl?: string;
}

export const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [popupData, setPopupData] = useState<{ event: PopupEventData; coordinates: [number, number] } | null>(null);
  const [mouseCoordinates, setMouseCoordinates] = useState<[number, number] | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const previousMapStyle = useRef<string | null>(null);

  const viewState = useMapStore((state) => state.viewState);
  const setViewState = useMapStore((state) => state.setViewState);
  const mapStyle = useMapStore((state) => state.mapStyle);
  const showEvents = useMapStore((state) => state.showEvents);
  const showTerritories = useMapStore((state) => state.showTerritories);
  const showHeatmap = useMapStore((state) => state.showHeatmap);
  const show3D = useMapStore((state) => state.show3D);
  const events = useMapStore((state) => state.events);
  const territories = useMapStore((state) => state.territories);
  const filters = useMapStore((state) => state.filters);
  const selectedDate = useMapStore((state) => state.selectedDate);
  const isPickingLocation = useMapStore((state) => state.isPickingLocation);
  const setPickedLocation = useMapStore((state) => state.setPickedLocation);

  // Memoize filtered data to prevent infinite loops
  const filteredEvents = useMemo(() => {
    const selectedTime = selectedDate.getTime();
    
    return events.filter((event) => {
      const eventTime = event.eventDate.getTime();
      if (eventTime > selectedTime) return false;
      
      if (filters.categories.length > 0 && !filters.categories.includes(event.category)) {
        return false;
      }
      
      if (filters.severities.length > 0 && !filters.severities.includes(event.severity)) {
        return false;
      }
      
      if (filters.verifiedOnly && !event.verified) {
        return false;
      }
      
      return true;
    });
  }, [events, selectedDate, filters.categories, filters.severities, filters.verifiedOnly]);

  const filteredTerritories = useMemo(() => {
    const selectedTime = selectedDate.getTime();
    
    return territories.filter((territory) => {
      const validFromTime = territory.validFrom.getTime();
      const validToTime = territory.validTo?.getTime() ?? Infinity;
      
      if (selectedTime < validFromTime || selectedTime > validToTime) {
        return false;
      }
      
      if (filters.actors.length > 0 && !filters.actors.includes(territory.actor)) {
        return false;
      }
      
      return true;
    });
  }, [territories, selectedDate, filters.actors]);

  // Setup event layers function
  const setupEventLayers = useCallback(() => {
    if (!map.current) return;

    // Add events source
    if (!map.current.getSource('events')) {
      map.current.addSource('events', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 50,
      });
    }

    // Cluster circles
    if (!map.current.getLayer('clusters')) {
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'events',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            'rgba(143, 163, 111, 0.8)',
            10, 'rgba(215, 151, 6, 0.8)',
            30, 'rgba(220, 38, 38, 0.8)',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18, 10, 24, 30, 32,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.3)',
        },
      });
    }

    // Cluster count
    if (!map.current.getLayer('cluster-count')) {
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'events',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });
    }

    // Unclustered points
    if (!map.current.getLayer('unclustered-point')) {
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'events',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'category'],
            'shelling', CATEGORY_CONFIG.shelling.color,
            'air_raid', CATEGORY_CONFIG.air_raid.color,
            'movement', CATEGORY_CONFIG.movement.color,
            'combat', CATEGORY_CONFIG.combat.color,
            'drone', CATEGORY_CONFIG.drone.color,
            'naval', CATEGORY_CONFIG.naval.color,
            'political', CATEGORY_CONFIG.political.color,
            'humanitarian', CATEGORY_CONFIG.humanitarian.color,
            'infrastructure', CATEGORY_CONFIG.infrastructure.color,
            '#888888',
          ],
          'circle-radius': [
            'match',
            ['get', 'severity'],
            'critical', 10,
            'high', 8,
            'medium', 6,
            'low', 5,
            6,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': [
            'case',
            ['get', 'verified'],
            'rgba(255, 255, 255, 0.8)',
            'rgba(255, 255, 255, 0.3)',
          ],
        },
      });
    }

    // Pulse animation for critical events
    if (!map.current.getLayer('pulse-layer')) {
      map.current.addLayer({
        id: 'pulse-layer',
        type: 'circle',
        source: 'events',
        filter: ['all',
          ['!', ['has', 'point_count']],
          ['==', ['get', 'severity'], 'critical'],
        ],
        paint: {
          'circle-color': 'transparent',
          'circle-radius': 15,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ef4444',
          'circle-stroke-opacity': [
            'interpolate',
            ['linear'],
            ['%', ['/', ['to-number', ['get', 'eventDate']], 1000], 2],
            0, 1,
            1, 0,
          ],
        },
      });
    }

    // Add heatmap source (separate from clustered events)
    if (!map.current.getSource('events-heatmap')) {
      map.current.addSource('events-heatmap', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    // Heatmap layer for event density visualization
    if (!map.current.getLayer('heatmap-layer')) {
      map.current.addLayer(
        {
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'events-heatmap',
          paint: {
            // Increase weight based on severity
            'heatmap-weight': [
              'match',
              ['get', 'severity'],
              'critical', 1,
              'high', 0.75,
              'medium', 0.5,
              'low', 0.25,
              0.5,
            ],
            // Increase intensity as zoom level increases
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 0.5,
              9, 2,
            ],
            // Military-themed color ramp: olive -> orange -> red
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 0, 0, 0)',
              0.1, 'rgba(143, 163, 111, 0.4)',
              0.3, 'rgba(143, 163, 111, 0.7)',
              0.5, 'rgba(217, 119, 6, 0.8)',
              0.7, 'rgba(234, 88, 12, 0.9)',
              1, 'rgba(220, 38, 38, 1)',
            ],
            // Radius increases with zoom
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 15,
              9, 30,
              15, 50,
            ],
            // Fade out at high zoom levels
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              7, 0.9,
              15, 0.3,
            ],
          },
        },
        'clusters' // Add before clusters layer
      );
    }

    // Click handler for unclustered points
    map.current.on('click', 'unclustered-point', (e) => {
      if (!e.features?.[0]) return;
      const feature = e.features[0];
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      
      setPopupData({
        event: feature.properties as unknown as PopupEventData,
        coordinates,
      });
    });

    // Click handler for clusters
    map.current.on('click', 'clusters', async (e) => {
      if (!map.current || !e.features?.[0]) return;
      const features = map.current.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = features[0].properties?.cluster_id;
      const source = map.current.getSource('events') as maplibregl.GeoJSONSource;
      
      try {
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.current?.easeTo({
          center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
          zoom: zoom ?? 10,
        });
      } catch (err) {
        console.error('Error getting cluster expansion zoom:', err);
      }
    });

    // Cursor handlers
    map.current.on('mouseenter', 'unclustered-point', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'unclustered-point', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

    map.current.on('mouseenter', 'clusters', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'clusters', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
  }, []);

  // Setup territory layers function
  const setupTerritoryLayers = useCallback(() => {
    if (!map.current) return;

    // Add territories source
    if (!map.current.getSource('territories')) {
      map.current.addSource('territories', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    // Territory fill layer
    if (!map.current.getLayer('territory-fill')) {
      map.current.addLayer(
        {
          id: 'territory-fill',
          type: 'fill',
          source: 'territories',
          paint: {
            'fill-color': [
              'match',
              ['get', 'actor'],
              'UA', ACTOR_CONFIG.UA.fillColor,
              'RU', ACTOR_CONFIG.RU.fillColor,
              'contested', ACTOR_CONFIG.contested.fillColor,
              'liberated', ACTOR_CONFIG.liberated.fillColor,
              'occupied', ACTOR_CONFIG.occupied.fillColor,
              'rgba(100, 100, 100, 0.3)',
            ],
            'fill-opacity': 0.6,
          },
        },
        'clusters'
      );
    }

    // Territory outline layer
    if (!map.current.getLayer('territory-outline')) {
      map.current.addLayer(
        {
          id: 'territory-outline',
          type: 'line',
          source: 'territories',
          paint: {
            'line-color': [
              'match',
              ['get', 'actor'],
              'UA', ACTOR_CONFIG.UA.color,
              'RU', ACTOR_CONFIG.RU.color,
              'contested', ACTOR_CONFIG.contested.color,
              'liberated', ACTOR_CONFIG.liberated.color,
              'occupied', ACTOR_CONFIG.occupied.color,
              '#666666',
            ],
            'line-width': 2,
            'line-opacity': 0.8,
          },
        },
        'clusters'
      );
    }
  }, []);

  // Initialize PMTiles protocol
  useEffect(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    return () => {
      maplibregl.removeProtocol('pmtiles');
    };
  }, []);

  // Initialize map - intentionally only runs once on mount
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_STYLES[mapStyle],
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        pitch: viewState.pitch,
        bearing: viewState.bearing,
        attributionControl: false,
      });

      // Add controls
      map.current.addControl(
        new maplibregl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );
      map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 200 }), 'bottom-right');
      map.current.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-right'
      );

      // Track view state changes
      map.current.on('moveend', () => {
        if (!map.current) return;
        const center = map.current.getCenter();
        setViewState({
          longitude: center.lng,
          latitude: center.lat,
          zoom: map.current.getZoom(),
          pitch: map.current.getPitch(),
          bearing: map.current.getBearing(),
        });
      });

      // Track mouse position for coordinate display
      map.current.on('mousemove', (e) => {
        setMouseCoordinates([e.lngLat.lng, e.lngLat.lat]);
      });

      map.current.on('mouseout', () => {
        setMouseCoordinates(null);
      });

      // Global click handler for location picking
      map.current.on('click', (e) => {
        const state = useMapStore.getState();
        if (state.isPickingLocation) {
          setPickedLocation([e.lngLat.lng, e.lngLat.lat]);
        }
      });

      // Setup event layers when map loads
      map.current.on('load', () => {
        if (!map.current) return;
        setMapInstance(map.current);
        setupEventLayers();
        setupTerritoryLayers();
        setIsMapLoaded(true);
      });

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('MapLibre error:', e);
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      map.current?.remove();
      map.current = null;
      setIsMapLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupEventLayers, setupTerritoryLayers, setViewState]);

  // Update map style - only when mapStyle actually changes
  useEffect(() => {
    if (!map.current) return;
    
    // Skip if this is the initial render or style hasn't changed
    if (previousMapStyle.current === null) {
      previousMapStyle.current = mapStyle;
      return;
    }
    
    if (previousMapStyle.current === mapStyle) {
      return;
    }
    
    previousMapStyle.current = mapStyle;
    
    // Save current data before style change
    const currentFilteredEvents = filteredEvents;
    const currentFilteredTerritories = filteredTerritories;
    const currentShowEvents = showEvents;
    const currentShowTerritories = showTerritories;
    const currentShowHeatmap = showHeatmap;
    
    map.current.setStyle(MAP_STYLES[mapStyle]);
    
    // Re-add layers and restore data after style change
    map.current.once('style.load', () => {
      if (!map.current) return;
      
      setupEventLayers();
      setupTerritoryLayers();
      
      // Restore event data
      const eventsSource = map.current.getSource('events') as maplibregl.GeoJSONSource | undefined;
      if (eventsSource) {
        const geojsonData: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: currentFilteredEvents.map((event) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: event.coordinates,
            },
            properties: {
              id: event.id,
              title: event.title,
              description: event.description,
              category: event.category,
              severity: event.severity,
              eventDate: event.eventDate.toISOString(),
              verified: event.verified,
              sourceUrl: event.sourceUrl,
            },
          })),
        };
        eventsSource.setData(geojsonData);
        
        // Also update heatmap source
        const heatmapSource = map.current.getSource('events-heatmap') as maplibregl.GeoJSONSource | undefined;
        if (heatmapSource) {
          heatmapSource.setData(geojsonData);
        }
      }
      
      // Restore territory data
      const territoriesSource = map.current.getSource('territories') as maplibregl.GeoJSONSource | undefined;
      if (territoriesSource) {
        const territoryData: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: currentFilteredTerritories.map((territory) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Polygon' as const,
              coordinates: territory.coordinates,
            },
            properties: {
              id: territory.id,
              actor: territory.actor,
              validFrom: territory.validFrom.toISOString(),
              validTo: territory.validTo?.toISOString(),
              changeReason: territory.changeReason,
            },
          })),
        };
        territoriesSource.setData(territoryData);
      }
      
      // Restore layer visibility
      const eventLayers = ['clusters', 'cluster-count', 'unclustered-point', 'pulse-layer'];
      const territoryLayers = ['territory-fill', 'territory-outline'];
      const heatmapLayers = ['heatmap-layer'];

      eventLayers.forEach((layer) => {
        if (map.current?.getLayer(layer)) {
          map.current.setLayoutProperty(layer, 'visibility', currentShowEvents ? 'visible' : 'none');
        }
      });

      territoryLayers.forEach((layer) => {
        if (map.current?.getLayer(layer)) {
          map.current.setLayoutProperty(layer, 'visibility', currentShowTerritories ? 'visible' : 'none');
        }
      });

      heatmapLayers.forEach((layer) => {
        if (map.current?.getLayer(layer)) {
          map.current.setLayoutProperty(layer, 'visibility', currentShowHeatmap ? 'visible' : 'none');
        }
      });
    });
  }, [mapStyle, setupEventLayers, setupTerritoryLayers, filteredEvents, filteredTerritories, showEvents, showTerritories, showHeatmap]);

  // Update event data when filtered events change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    
    const source = map.current.getSource('events') as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: filteredEvents.map((event) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: event.coordinates,
        },
        properties: {
          id: event.id,
          title: event.title,
          description: event.description,
          category: event.category,
          severity: event.severity,
          eventDate: event.eventDate.toISOString(),
          verified: event.verified,
          sourceUrl: event.sourceUrl,
        },
      })),
    };

    source.setData(geojsonData);

    // Also update heatmap source
    const heatmapSource = map.current.getSource('events-heatmap') as maplibregl.GeoJSONSource | undefined;
    if (heatmapSource) {
      heatmapSource.setData(geojsonData);
    }
  }, [filteredEvents, isMapLoaded]);

  // Update territory data when filtered territories change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    
    const source = map.current.getSource('territories') as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: filteredTerritories.map((territory) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: territory.coordinates,
        },
        properties: {
          id: territory.id,
          actor: territory.actor,
          validFrom: territory.validFrom.toISOString(),
          validTo: territory.validTo?.toISOString(),
          changeReason: territory.changeReason,
        },
      })),
    };

    source.setData(geojsonData);
  }, [filteredTerritories, isMapLoaded]);

  // Toggle layer visibility
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const eventLayers = ['clusters', 'cluster-count', 'unclustered-point', 'pulse-layer'];
    const territoryLayers = ['territory-fill', 'territory-outline'];
    const heatmapLayers = ['heatmap-layer'];

    eventLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, 'visibility', showEvents ? 'visible' : 'none');
      }
    });

    territoryLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, 'visibility', showTerritories ? 'visible' : 'none');
      }
    });

    heatmapLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, 'visibility', showHeatmap ? 'visible' : 'none');
      }
    });
  }, [showEvents, showTerritories, showHeatmap]);

  // Toggle 3D mode
  useEffect(() => {
    if (!map.current) return;
    map.current.easeTo({
      pitch: show3D ? 60 : 0,
      duration: 500,
    });
  }, [show3D]);

  return (
    <div className={styles.mapContainer}>
      <div ref={mapContainer} className={styles.map} />
      
      {popupData && (
        <EventPopup
          event={popupData.event}
          coordinates={popupData.coordinates}
          onClose={() => setPopupData(null)}
          map={mapInstance}
        />
      )}

      {/* Tactical Grid Overlay */}
      <div className={styles.gridOverlay} />
      
      {/* Mouse Coordinates Display */}
      <CoordinateDisplay coordinates={mouseCoordinates} />

      {/* Location Picking Overlay */}
      {isPickingLocation && (
        <div className={styles.pickingOverlay}>
          <div className={styles.pickingCrosshair}>
            <svg width="40" height="40" viewBox="0 0 40 40">
              <line x1="20" y1="0" x2="20" y2="40" stroke="var(--camo-accent)" strokeWidth="2" />
              <line x1="0" y1="20" x2="40" y2="20" stroke="var(--camo-accent)" strokeWidth="2" />
              <circle cx="20" cy="20" r="8" fill="none" stroke="var(--camo-accent)" strokeWidth="2" />
            </svg>
          </div>
          <div className={styles.pickingHint}>Klicken Sie auf die Karte, um die Position zu wählen</div>
        </div>
      )}
      
      {/* View State Info */}
      <div className={styles.coordinates}>
        <span className={styles.coordLabel}>LAT</span>
        <span className={styles.coordValue}>{viewState.latitude.toFixed(4)}°</span>
        <span className={styles.coordLabel}>LNG</span>
        <span className={styles.coordValue}>{viewState.longitude.toFixed(4)}°</span>
        <span className={styles.coordLabel}>ZOOM</span>
        <span className={styles.coordValue}>{viewState.zoom.toFixed(1)}</span>
      </div>

      {/* Status Indicator */}
      <div className={styles.statusBar}>
        <span className="status-dot status-dot--live" />
        <span className={styles.statusText}>LIVE</span>
        <span className={styles.eventCount}>{filteredEvents.length} Events</span>
      </div>
    </div>
  );
};
