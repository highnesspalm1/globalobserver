import { describe, it, expect, beforeEach } from 'vitest'
import { useMapStore } from './mapStore'
import type { MapEvent, EventCategory, SeverityLevel } from '../types/database'

// Helper to reset store between tests
const resetStore = () => {
    useMapStore.setState({
        events: [],
        territories: [],
        selectedEventId: null,
        selectedTerritoryId: null,
        hoveredEventId: null,
        filters: {
            categories: [],
            actors: [],
            severities: [],
            verifiedOnly: true,
            searchQuery: '',
            dateRange: { start: null, end: null },
        },
        isLoading: false,
        error: null,
    })
}

// Create mock event
const createMockEvent = (overrides: Partial<MapEvent> = {}): MapEvent => ({
    id: `test-${Math.random().toString(36).substring(7)}`,
    title: 'Test Event',
    description: 'Test description',
    category: 'combat' as EventCategory,
    severity: 'medium' as SeverityLevel,
    coordinates: [30.5, 50.4] as [number, number],
    eventDate: new Date(),
    sourceUrl: null,
    verified: true,
    mediaUrls: [],
    tags: ['test'],
    ...overrides,
})

describe('mapStore', () => {
    beforeEach(() => {
        resetStore()
    })

    describe('events', () => {
        it('should set events', () => {
            const events = [createMockEvent(), createMockEvent()]
            useMapStore.getState().setEvents(events)

            expect(useMapStore.getState().events).toHaveLength(2)
        })

        it('should add a single event', () => {
            const event = createMockEvent()
            useMapStore.getState().addEvent(event)

            expect(useMapStore.getState().events).toHaveLength(1)
            expect(useMapStore.getState().events[0]).toEqual(event)
        })

        it('should update an event', () => {
            const event = createMockEvent({ id: 'update-test' })
            useMapStore.getState().setEvents([event])

            useMapStore.getState().updateEvent('update-test', { title: 'Updated Title' })

            expect(useMapStore.getState().events[0].title).toBe('Updated Title')
        })

        it('should remove an event', () => {
            const events = [
                createMockEvent({ id: 'keep' }),
                createMockEvent({ id: 'remove' }),
            ]
            useMapStore.getState().setEvents(events)

            useMapStore.getState().removeEvent('remove')

            expect(useMapStore.getState().events).toHaveLength(1)
            expect(useMapStore.getState().events[0].id).toBe('keep')
        })
    })

    describe('selection', () => {
        it('should set selected event id', () => {
            useMapStore.getState().setSelectedEventId('test-id')

            expect(useMapStore.getState().selectedEventId).toBe('test-id')
        })

        it('should clear selected event id', () => {
            useMapStore.getState().setSelectedEventId('test-id')
            useMapStore.getState().setSelectedEventId(null)

            expect(useMapStore.getState().selectedEventId).toBeNull()
        })
    })

    describe('filters', () => {
        it('should toggle category filter', () => {
            useMapStore.getState().toggleCategory('combat')

            expect(useMapStore.getState().filters.categories).toContain('combat')

            useMapStore.getState().toggleCategory('combat')

            expect(useMapStore.getState().filters.categories).not.toContain('combat')
        })

        it('should toggle severity filter', () => {
            useMapStore.getState().toggleSeverity('high')

            expect(useMapStore.getState().filters.severities).toContain('high')
        })

        it('should set partial filters', () => {
            useMapStore.getState().setFilters({ searchQuery: 'test query' })

            expect(useMapStore.getState().filters.searchQuery).toBe('test query')
            expect(useMapStore.getState().filters.verifiedOnly).toBe(true) // unchanged
        })

        it('should reset filters', () => {
            useMapStore.getState().toggleCategory('combat')
            useMapStore.getState().setFilters({ searchQuery: 'test' })

            useMapStore.getState().resetFilters()

            expect(useMapStore.getState().filters.categories).toHaveLength(0)
            expect(useMapStore.getState().filters.searchQuery).toBe('')
        })
    })

    describe('UI state', () => {
        it('should toggle sidebar', () => {
            const initialState = useMapStore.getState().sidebarOpen
            useMapStore.getState().setSidebarOpen(!initialState)

            expect(useMapStore.getState().sidebarOpen).toBe(!initialState)
        })

        it('should set map style', () => {
            useMapStore.getState().setMapStyle('satellite')

            expect(useMapStore.getState().mapStyle).toBe('satellite')
        })

        it('should toggle loading state', () => {
            useMapStore.getState().setIsLoading(true)

            expect(useMapStore.getState().isLoading).toBe(true)

            useMapStore.getState().setIsLoading(false)

            expect(useMapStore.getState().isLoading).toBe(false)
        })

        it('should set error', () => {
            useMapStore.getState().setError('Test error')

            expect(useMapStore.getState().error).toBe('Test error')
        })
    })

    describe('view state', () => {
        it('should update view state partially', () => {
            useMapStore.getState().setViewState({ zoom: 10 })

            expect(useMapStore.getState().viewState.zoom).toBe(10)
            expect(useMapStore.getState().viewState.longitude).toBeDefined()
        })
    })

    describe('time controls', () => {
        it('should set selected date', () => {
            const date = new Date('2024-01-15')
            useMapStore.getState().setSelectedDate(date)

            expect(useMapStore.getState().selectedDate).toEqual(date)
        })

        it('should toggle playback', () => {
            useMapStore.getState().setIsPlaying(true)

            expect(useMapStore.getState().isPlaying).toBe(true)
        })

        it('should set playback speed', () => {
            useMapStore.getState().setPlaybackSpeed(2)

            expect(useMapStore.getState().playbackSpeed).toBe(2)
        })
    })
})
