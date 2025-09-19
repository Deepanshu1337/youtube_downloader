"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Play, Clock, Eye, AlertCircle, CheckCircle } from "lucide-react";

// Determine the API base URL. In production (non-localhost), default to the Render backend.
// You can override with NEXT_PUBLIC_API_BASE if needed.
const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE.replace(/\/$/, "")
  }
  if (typeof window !== "undefined") {
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    return isLocal ? "http://localhost:8000" : "https://youtube-downloader-backend-efg0.onrender.com"
  }
  return "https://youtube-downloader-backend-efg0.onrender.com"
}



interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  channel: string;
  videoId: string;
  formats: Array<{
    quality: string;
    format: string;
    size?: string;
    format_id?: string;
    filesize?: number;
  }>;
  is_live?: boolean;
}

export default function YouTubeDownloader() {
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("720p");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setVideoInfo(null);

    try {
      const base = getApiBase();
      const endpoint = `${base}/video-info`; // Always hit backend
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch video information");
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch video information");
      }

      setVideoInfo(data);
      setSuccess("Video information loaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo) return;

    setIsDownloading(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedFormat = videoInfo.formats.find((f) => f.quality === selectedQuality);
      const format = selectedFormat?.format || "mp4";

      const base = getApiBase();
      const endpoint = `${base}/download`; // Always hit backend
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url, // use original YouTube URL
          quality: selectedQuality,
          format,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to download video");
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to download video");
      }

      setSuccess(`Download starting...`);

      // Trigger download using a hidden iframe to avoid opening a new tab
      if (data.downloadUrl) {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = data.downloadUrl;
        document.body.appendChild(iframe);

        // Cleanup after some time
        setTimeout(() => {
          if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
          setSuccess(`Download started! Check your downloads folder for: ${data.filename}`);
        }, 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">YouTube Downloader</h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Home
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">Download YouTube Videos & Audio</h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Paste any YouTube URL to download videos in high quality or extract audio files
            </p>
          </div>

          {/* URL Input Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Enter YouTube URL</CardTitle>
              <CardDescription>Supports regular videos and live streams</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUrlSubmit} className="flex gap-4">
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={isLoading} className="px-8">
                  {isLoading ? "Processing..." : "Get Video"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error and Success Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Video Info & Download Options */}
          {videoInfo && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Video Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Video Preview
                    {videoInfo.is_live && (
                      <Badge variant="destructive" className="ml-2">
                        LIVE
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <img
                      src={videoInfo.thumbnail || "/placeholder.svg"}
                      alt="Video thumbnail"
                      className="w-full rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = "/video-thumbnail.png";
                      }}
                    />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2 text-pretty">{videoInfo.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {videoInfo.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {videoInfo.views}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">by {videoInfo.channel}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Download Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Download Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Quality Selection */}
                    <div>
                      <h4 className="font-medium mb-3">Available Formats</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {videoInfo.formats.map((format) => (
                          <button
                            key={format.quality}
                            onClick={() => setSelectedQuality(format.quality)}
                            className={`p-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-between ${
                              selectedQuality === format.quality
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card hover:bg-muted border-border"
                            }`}
                          >
                            <span>{format.quality}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {format.format.toUpperCase()}
                              </Badge>
                              {format.size && <span className="text-xs opacity-75">{format.size}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Download Button */}
                    <Button onClick={handleDownload} disabled={isDownloading} className="w-full py-6 text-lg" size="lg">
                      <Download className="w-5 h-5 mr-2" />
                      {isDownloading ? "Downloading..." : `Download ${selectedQuality}`}
                    </Button>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Video formats: MP4, WebM</p>
                      <p>• Audio formats: MP3, M4A</p>
                      <p>• Files downloaded to your browser</p>
                      <p>• Processing time: 30-300 seconds</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Features */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">High Quality Downloads</h3>
                <p className="text-sm text-muted-foreground">
                  Download videos up to 1080p HD quality and crystal clear audio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Play className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Live Stream Support</h3>
                <p className="text-sm text-muted-foreground">
                  Download from both regular videos and live streaming content
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold mb-2">Fast Processing</h3>
                <p className="text-sm text-muted-foreground">Quick video processing and download preparation</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">© 2024 YouTube Downloader. For personal use only.</p>
            <div className="flex justify-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
