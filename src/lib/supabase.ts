import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Configuration
// In production, these should be environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Check if Supabase is properly configured
const isConfigured = 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key';

export const supabase: SupabaseClient | null = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export const isSupabaseConfigured = () => isConfigured;

// Helper functions for database operations
export const db = {
  // Events
  events: {
    async getAll(options?: {
      verified?: boolean;
      category?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      
      let query = supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (options?.verified !== undefined) {
        query = query.eq('verified', options.verified);
      }
      if (options?.category) {
        query = query.eq('category', options.category);
      }
      if (options?.startDate) {
        query = query.gte('event_date', options.startDate.toISOString());
      }
      if (options?.endDate) {
        query = query.lte('event_date', options.endDate.toISOString());
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      return query;
    },

    async getById(id: string) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase.from('events').select('*').eq('id', id).single();
    },

    async create(event: Record<string, unknown>) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase.from('events').insert(event as never).select().single();
    },

    async update(id: string, event: Record<string, unknown>) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase.from('events').update(event as never).eq('id', id).select().single();
    },

    async delete(id: string) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase.from('events').delete().eq('id', id);
    },

    async verify(id: string, analystId: string) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase
        .from('events')
        .update({ verified: true, analyst_id: analystId } as never)
        .eq('id', id)
        .select()
        .single();
    },
  },

  // Territory History
  territories: {
    async getAll(options?: { actor?: string; date?: Date }) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      
      let query = supabase.from('territory_history').select('*');

      if (options?.actor) {
        query = query.eq('actor', options.actor);
      }
      if (options?.date) {
        const dateStr = options.date.toISOString();
        query = query
          .lte('valid_from', dateStr)
          .or(`valid_to.is.null,valid_to.gt.${dateStr}`);
      }

      return query;
    },

    async create(territory: Record<string, unknown>) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase.from('territory_history').insert(territory as never).select().single();
    },

    async update(id: string, territory: Record<string, unknown>) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase.from('territory_history').update(territory as never).eq('id', id).select().single();
    },

    async closeTerritory(id: string, validTo: Date, reason?: string) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase
        .from('territory_history')
        .update({ valid_to: validTo.toISOString(), change_reason: reason } as never)
        .eq('id', id)
        .select()
        .single();
    },
  },

  // Raw Reports (for ingestion pipeline)
  rawReports: {
    async create(report: {
      source: string;
      content: string;
      source_url?: string;
      raw_data?: Record<string, unknown>;
    }) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase.from('raw_reports').insert(report as never).select().single();
    },

    async getPending(limit = 50) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase
        .from('raw_reports')
        .select('*')
        .eq('processed', false)
        .order('created_at', { ascending: true })
        .limit(limit);
    },

    async markProcessed(id: string) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase.from('raw_reports').update({ processed: true } as never).eq('id', id);
    },
  },
};

// Subscribe to real-time updates
export const subscribeToEvents = (callback: (payload: unknown) => void) => {
  if (!supabase) {
    console.warn('Supabase not configured, real-time disabled');
    return null;
  }
  
  return supabase
    .channel('events-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: 'verified=eq.true',
      },
      callback
    )
    .subscribe();
};

export const subscribeToTerritories = (callback: (payload: unknown) => void) => {
  if (!supabase) {
    console.warn('Supabase not configured, real-time disabled');
    return null;
  }
  
  return supabase
    .channel('territories-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'territory_history',
      },
      callback
    )
    .subscribe();
};
