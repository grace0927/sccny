"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MediaPlayerProps } from "./types";
import { Tabs, TabsList, TabsTrigger, TabsContent, Card, CardContent, Button } from "dark-blue";

export default function MediaPlayer({
  videoUrl,
  audioUrl,
  title,
}: MediaPlayerProps) {
  const t = useTranslations("MediaPlayer");
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeMedia, setActiveMedia] = useState<"video" | "audio">(
    videoUrl ? "video" : "audio"
  );

  const mediaRef = activeMedia === "video" ? videoRef : audioRef;

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateTime = () => setCurrentTime(media.currentTime);
    const updateDuration = () => setDuration(media.duration);
    const handleEnded = () => setIsPlaying(false);

    media.addEventListener("timeupdate", updateTime);
    media.addEventListener("loadedmetadata", updateDuration);
    media.addEventListener("ended", handleEnded);

    return () => {
      media.removeEventListener("timeupdate", updateTime);
      media.removeEventListener("loadedmetadata", updateDuration);
      media.removeEventListener("ended", handleEnded);
    };
  }, [activeMedia, mediaRef]);

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const media = mediaRef.current;
    if (!media) return;

    const time = parseFloat(e.target.value);
    media.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;

    const newMuted = !isMuted;
    setIsMuted(newMuted);
    media.muted = newMuted;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const switchMedia = (type: string) => {
    setActiveMedia(type as "video" | "audio");
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  if (!videoUrl && !audioUrl) {
    return (
      <div className="bg-muted rounded-lg p-8 text-center">
        <p className="text-muted-foreground">
          {t("noMedia", {
            defaultValue: "No media available for this sermon.",
          })}
        </p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Media Selection Tabs */}
      {videoUrl && audioUrl && (
        <Tabs value={activeMedia} onValueChange={switchMedia}>
          <TabsList className="w-full rounded-none">
            <TabsTrigger value="video" className="flex-1">
              {t("video", { defaultValue: "Video" })}
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex-1">
              {t("audio", { defaultValue: "Audio" })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video">
            <CardContent className="pt-6">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full rounded-lg"
                poster="/api/placeholder/640/360"
                preload="metadata"
              />
            </CardContent>
          </TabsContent>

          <TabsContent value="audio">
            <CardContent className="pt-6">
              <div className="bg-muted rounded-lg p-8 text-center">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 mx-auto text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  preload="metadata"
                  className="hidden"
                />
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      )}

      {/* Single media (no tabs) */}
      {!(videoUrl && audioUrl) && (
        <CardContent className="pt-6">
          {activeMedia === "video" && videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full rounded-lg"
              poster="/api/placeholder/640/360"
              preload="metadata"
            />
          )}

          {activeMedia === "audio" && audioUrl && (
            <div className="bg-muted rounded-lg p-8 text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
              <audio
                ref={audioRef}
                src={audioUrl}
                preload="metadata"
                className="hidden"
              />
            </div>
          )}
        </CardContent>
      )}

      {/* Controls */}
      <CardContent className="pb-6">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground w-12">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-sm text-muted-foreground w-12">
              {formatTime(duration)}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={togglePlay}
              size="lg"
              className="rounded-full w-12 h-12 p-0"
            >
              {isPlaying ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 4a1 1 0 00-1 1v10a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1H6zM12 4a1 1 0 00-1 1v10a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1h-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 ml-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </Button>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-muted-foreground hover:text-foreground"
              >
                {isMuted || volume === 0 ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.414 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.414l3.969-3.816a1 1 0 011.234.076zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.414 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.414l3.969-3.816a1 1 0 011.234.076zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
