"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Play, Clock, Eye, AlertCircle, CheckCircle } from "lucide-react";

// Use environment variable if available
const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    return isLocal
      ? "http://localhost:8000"
      : "https://youtube-downloader-backend-efg0.onrender.com";
  }
  return "https://youtube-downloader-backend-efg0.onrender.com";
};

interface VideoFormat {
  quality: string;
  format: string;
  size?: string;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  channel: string;
  videoId: string;
  formats: VideoFormat[];
  is_live?: boolean;
}

export default function YouTubeDownloader() {
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("");
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
      const endpoint = `${getApiBase()}/video-info`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch video information");
      }

      setVideoInfo(data);
      setSelectedQuality(data.formats[0]?.quality || "720p");
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
      const selectedFormat = videoInfo.formats.find(f => f.quality === selectedQuality);
      const format = selectedFormat?.format || "mp4";

      const endpoint = `${getApiBase()}/download`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, quality: selectedQuality, format }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to download video");
      }

      // Trigger browser download via hidden iframe
      if (data.downloadUrl) {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = data.downloadUrl;
        document.body.appendChild(iframe);

        setTimeout(() => {
          iframe.remove();
          setSuccess(`Download started! Check your downloads folder for: ${data.filename}`);
        }, 3000);
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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">YouTube Downloader</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Home</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* URL Input */}
          <Card>
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Get Video"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Video Info */}
          {videoInfo && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" /> Video Preview
                    {videoInfo.is_live && <Badge variant="destructive">LIVE</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={videoInfo.thumbnail || "/placeholder.svg"}
                    alt="Video thumbnail"
                    className="w-full rounded-lg"
                  />
                  <h3 className="font-semibold text-foreground mt-2">{videoInfo.title}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {videoInfo.duration}</span>
                    <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {videoInfo.views}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">by {videoInfo.channel}</p>
                </CardContent>
              </Card>

              {/* Download */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" /> Download Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Format buttons */}
                  <div>
                    <h4 className="font-medium mb-2">Available Formats</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {videoInfo.formats.map((format) => (
                        <button
                          key={format.quality}
                          onClick={() => setSelectedQuality(format.quality)}
                          className={`p-3 rounded-lg border flex items-center justify-between ${
                            selectedQuality === format.quality
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card hover:bg-muted border-border"
                          }`}
                        >
                          <span>{format.quality}</span>
                          <Badge variant="outline" className="text-xs">{format.format.toUpperCase()}</Badge>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleDownload} disabled={isDownloading} className="w-full py-6 text-lg">
                    <Download className="w-5 h-5 mr-2" /> {isDownloading ? "Downloading..." : `Download ${selectedQuality}`}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16 text-center py-6 text-sm text-muted-foreground">
        © 2024 YouTube Downloader. For personal use only.
      </footer>
    </div>
  );
}
