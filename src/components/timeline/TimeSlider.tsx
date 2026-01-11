import React, { useCallback, useEffect, useRef } from 'react';
import { format, addDays, differenceInDays, startOfDay } from 'date-fns';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Clock
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { IconButton } from '../ui/Button';
import styles from './TimeSlider.module.css';

export const TimeSlider: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    timeRange,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    timelineOpen,
    setTimelineOpen,
  } = useMapStore();

  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate slider values
  const totalDays = differenceInDays(timeRange.end, timeRange.start);
  const currentDay = differenceInDays(selectedDate, timeRange.start);
  const progress = totalDays > 0 ? (currentDay / totalDays) * 100 : 0;

  // Handle slider change
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      const newDate = addDays(startOfDay(timeRange.start), value);
      setSelectedDate(newDate);
    },
    [timeRange.start, setSelectedDate]
  );

  // Playback controls
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, [setIsPlaying]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  const handleStepBack = useCallback(() => {
    const newDate = addDays(selectedDate, -1);
    if (newDate >= timeRange.start) {
      setSelectedDate(newDate);
    }
  }, [selectedDate, timeRange.start, setSelectedDate]);

  const handleStepForward = useCallback(() => {
    const newDate = addDays(selectedDate, 1);
    if (newDate <= timeRange.end) {
      setSelectedDate(newDate);
    }
  }, [selectedDate, timeRange.end, setSelectedDate]);

  const handleSpeedChange = useCallback(() => {
    const speeds = [0.5, 1, 2, 4];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  }, [playbackSpeed, setPlaybackSpeed]);

  const handleGoToToday = useCallback(() => {
    const today = new Date();
    if (today <= timeRange.end && today >= timeRange.start) {
      setSelectedDate(startOfDay(today));
    } else {
      setSelectedDate(startOfDay(timeRange.end));
    }
  }, [timeRange, setSelectedDate]);

  // Playback effect
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        const currentDate = useMapStore.getState().selectedDate;
        const newDate = addDays(currentDate, 1);
        if (newDate > timeRange.end) {
          setIsPlaying(false);
        } else {
          setSelectedDate(newDate);
        }
      }, 1000 / playbackSpeed);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, timeRange.end, setIsPlaying, setSelectedDate]);

  if (!timelineOpen) {
    return (
      <button 
        className={styles.toggleButton}
        onClick={() => setTimelineOpen(true)}
        aria-label="Timeline öffnen"
      >
        <Clock size={14} />
        <span>{format(selectedDate, 'dd.MM.yy')}</span>
      </button>
    );
  }

  return (
    <div className={styles.container}>
      {/* Controls - Play/Pause */}
      <div className={styles.controlGroup}>
        <IconButton
          aria-label="Tag zurück"
          icon={<SkipBack size={12} />}
          onClick={handleStepBack}
          size="sm"
        />
        
        {isPlaying ? (
          <IconButton
            aria-label="Pause"
            icon={<Pause size={14} />}
            onClick={handlePause}
            size="sm"
          />
        ) : (
          <IconButton
            aria-label="Abspielen"
            icon={<Play size={14} />}
            onClick={handlePlay}
            size="sm"
          />
        )}
        
        <IconButton
          aria-label="Tag vor"
          icon={<SkipForward size={12} />}
          onClick={handleStepForward}
          size="sm"
        />
      </div>

      {/* Slider Track */}
      <div className={styles.sliderContainer}>
        <div className={styles.sliderTrack}>
          <div 
            className={styles.sliderProgress} 
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={totalDays}
            value={currentDay}
            onChange={handleSliderChange}
            className={styles.sliderInput}
          />
        </div>
      </div>

      {/* Date Display */}
      <div className={styles.dateDisplay}>
        <div className={styles.fullDate}>
          {format(selectedDate, 'dd.MM.yy')}
        </div>
      </div>

      {/* Speed & Today */}
      <div className={styles.controlGroup}>
        <button 
          className={styles.speedButton}
          onClick={handleSpeedChange}
          title="Geschwindigkeit"
        >
          {playbackSpeed}x
        </button>
        
        <button
          className={styles.todayButton}
          onClick={handleGoToToday}
          title="Heute"
        >
          Heute
        </button>
      </div>

      {/* Close */}
      <button 
        className={styles.collapseButton}
        onClick={() => setTimelineOpen(false)}
      >
        ×
      </button>
    </div>
  );
};
