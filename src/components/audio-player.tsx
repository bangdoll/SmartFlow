'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
    newsId: string;
    initialAudioUrl?: string | null;
    title?: string;
}

export function AudioPlayer({ newsId, initialAudioUrl, title }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (initialAudioUrl) {
            setAudioUrl(initialAudioUrl);
        }
    }, [initialAudioUrl]);

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
                    body: JSON.stringify({ newsId }),
                });

                if (!res.ok) throw new Error('Failed to generate audio');

                const data = await res.json();
                setAudioUrl(data.audioUrl);

                // Audio will auto-play due to useEffect or we trigger it here once src is set
                // But safer to wait for state update or set src directly on new Audio obj?
                // Let's rely on the <audio> tag updating src
            } catch (error) {
                console.error('TTS Error:', error);
                alert('無法生成語音，請稍後再試。');
            } finally {
                setIsLoading(false);
            }
        } else {
            audioRef.current?.play();
            setIsPlaying(true);
        }
    };

    // Auto-play when audioUrl is set (if it was triggered by a user click)
    // Complexity: User interaction required for audio play.
    // If user clicked Play -> Loading -> URL Set -> We want it to play.
    useEffect(() => {
        if (audioUrl && !isPlaying && !initialAudioUrl) {
            // This condition is tricky. "initialAudioUrl" logic handles pre-existing.
            // If we just fetched it (!initialAudioUrl check is imperfect if we passed it in props initially... wait)
            // Let's simplify: If we just finished loading (was loading is true -> false), try play?
            // Easier: check header of function.
        }
    }, [audioUrl]);

    // Better logic for auto-play after fetch:
    const onAudioSrcSet = () => {
        if (!isPlaying && !isLoading) { // If we were waiting
            audioRef.current?.play().then(() => setIsPlaying(true)).catch(e => console.log('Autoplay blocked', e));
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
                    if (isLoading) { setIsLoading(false); audioRef.current?.play(); setIsPlaying(true); }
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
                        {isLoading ? '正在生成 AI 語音導讀...' : isPlaying ? '正在播放 AI 導讀' : '聆聽 AI 導讀'}
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

            {/* Optional time display? Keep it simple for now as per design aesthetic */}
        </div>
    );
}
