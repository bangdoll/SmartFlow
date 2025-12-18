'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2, Volume2 } from 'lucide-react';
import { useLanguage } from './language-context';

interface AudioPlayerProps {
    newsId: string;
    initialAudioUrl?: string | null;
    title?: string;
    language?: 'en' | 'zh-TW';
}

export function AudioPlayer({ newsId, initialAudioUrl, title, language = 'zh-TW' }: AudioPlayerProps) {
    const { t } = useLanguage();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
    const [progress, setProgress] = useState(0);
    const [speed, setSpeed] = useState(1);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const speeds = [1, 1.2, 1.5, 2];

    useEffect(() => {
        setAudioUrl(initialAudioUrl || null);
        setIsPlaying(false);
        setProgress(0);
    }, [initialAudioUrl, language]);

    const handlePlayClick = async () => {
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }

        if (!audioUrl) {
            setIsLoading(true);
            try {
                const res = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        newsId,
                        lang: language
                    }),
                });

                if (!res.ok) throw new Error('Failed to generate audio');

                const data = await res.json();
                setAudioUrl(data.audioUrl);

            } catch (error) {
                console.error('TTS Error:', error);
                alert(t('player.error'));
            } finally {
                setIsLoading(false);
            }
        } else {
            if (audioRef.current) {
                audioRef.current.playbackRate = speed;
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const toggleSpeed = () => {
        const currentIndex = speeds.indexOf(speed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        const newSpeed = speeds[nextIndex];
        setSpeed(newSpeed);
        if (audioRef.current) {
            audioRef.current.playbackRate = newSpeed;
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const duration = audioRef.current.duration;
            if (duration) {
                setProgress((current / duration) * 100);
            }
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 my-4 flex items-center gap-3 shadow-sm">
            <audio
                ref={audioRef}
                src={audioUrl || undefined}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onLoadedData={() => {
                    if (isLoading) {
                        setIsLoading(false);
                        if (audioRef.current) {
                            audioRef.current.playbackRate = speed;
                            audioRef.current.play();
                            setIsPlaying(true);
                        }
                    } else if (audioRef.current) {
                        // Ensure speed persists if src changes or reloads
                        audioRef.current.playbackRate = speed;
                    }
                }}
            />

            <button
                onClick={handlePlayClick}
                disabled={isLoading}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700 truncate">
                        {isLoading
                            ? t('player.generating')
                            : isPlaying
                                ? t('player.playing')
                                : t('player.listen')}
                    </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Speed Toggle Button - Moved to Root Flex Container */}
            <button
                onClick={toggleSpeed}
                className="flex-shrink-0 min-w-[3rem] h-9 px-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all shadow-sm flex items-center justify-center tracking-wide"
                title={t('player.speed')}
            >
                {speed}x
            </button>
        </div>
    );
}
