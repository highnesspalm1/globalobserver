import { useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useMapStore } from '../stores/mapStore';
import { notify } from '../stores/notificationStore';
import type { MapEvent, EventCategory, SeverityLevel } from '../types/database';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface DatabaseEvent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  severity: string;
  location: string; // PostGIS POINT format
  event_date: string;
  source_url: string | null;
  verified: boolean;
  media_urls: string[] | null;
  tags: string[] | null;
  created_at: string;
}

// Parse PostGIS POINT format: "POINT(lng lat)"
const parsePostGISPoint = (point: string): [number, number] => {
  const match = point.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (match) {
    return [parseFloat(match[1]), parseFloat(match[2])];
  }
  return [0, 0];
};

// Convert database event to MapEvent
const transformEvent = (dbEvent: DatabaseEvent): MapEvent => ({
  id: dbEvent.id,
  title: dbEvent.title,
  description: dbEvent.description ?? null,
  category: dbEvent.category as EventCategory,
  severity: dbEvent.severity as SeverityLevel,
  coordinates: parsePostGISPoint(dbEvent.location),
  eventDate: new Date(dbEvent.event_date),
  sourceUrl: dbEvent.source_url ?? null,
  verified: dbEvent.verified,
  mediaUrls: dbEvent.media_urls || [],
  tags: dbEvent.tags || [],
});

export const useSupabaseRealtime = () => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const addEvent = useMapStore((state) => state.addEvent);
  const updateEvent = useMapStore((state) => state.updateEvent);
  const removeEvent = useMapStore((state) => state.removeEvent);

  const handleInsert = useCallback((payload: RealtimePostgresChangesPayload<DatabaseEvent>) => {
    if (payload.new && 'id' in payload.new) {
      const newEvent = transformEvent(payload.new as DatabaseEvent);
      addEvent(newEvent);
      
      // Notify user about new event
      notify.event(
        `Neues Event: ${newEvent.title}`,
        newEvent.description?.slice(0, 100),
        newEvent.id,
        newEvent.coordinates
      );
    }
  }, [addEvent]);

  const handleUpdate = useCallback((payload: RealtimePostgresChangesPayload<DatabaseEvent>) => {
    if (payload.new && 'id' in payload.new) {
      const updated = transformEvent(payload.new as DatabaseEvent);
      updateEvent(updated.id, updated);
      
      // Notify about verification
      if (updated.verified && payload.old && !('verified' in payload.old && payload.old.verified)) {
        notify.success('Event verifiziert', updated.title);
      }
    }
  }, [updateEvent]);

  const handleDelete = useCallback((payload: RealtimePostgresChangesPayload<DatabaseEvent>) => {
    if (payload.old && 'id' in payload.old && payload.old.id) {
      removeEvent(payload.old.id);
      notify.warning('Event entfernt', `Event wurde aus der Datenbank gelöscht`);
    }
  }, [removeEvent]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('Supabase not configured - realtime disabled');
      return;
    }

    // Subscribe to events table changes
    channelRef.current = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
        },
        handleInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
        },
        handleUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'events',
        },
        handleDelete
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscription active');
          notify.success('Realtime verbunden', 'Live-Updates sind aktiv');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error');
          notify.error('Verbindungsfehler', 'Realtime-Updates nicht verfügbar');
        }
      });

    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [handleInsert, handleUpdate, handleDelete]);

  // Manual refresh function
  const refreshEvents = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('verified', true)
        .order('event_date', { ascending: false })
        .limit(500);

      if (error) throw error;

      if (data) {
        const events = data.map(transformEvent);
        useMapStore.getState().setEvents(events);
        notify.success('Daten aktualisiert', `${events.length} Events geladen`);
      }
    } catch (err) {
      console.error('Error refreshing events:', err);
      notify.error('Fehler', 'Events konnten nicht geladen werden');
    }
  }, []);

  return {
    isConnected: isSupabaseConfigured(),
    refreshEvents,
  };
};
