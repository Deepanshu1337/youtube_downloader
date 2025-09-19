import { type NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || !url.trim()) {
      return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 })
    }

    // Call Render backend API
    const backendUrl = "https://youtube-downloader-backend-efg0.onrender.com/video-info"
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Failed to fetch video info" }, { status: response.status })
    }

    // Return backend response as-is
    return NextResponse.json({ ...data, success: true })
  } catch (error) {
    console.error("[v0] Error fetching video info:", error)
    return NextResponse.json({ error: "Failed to fetch video information" }, { status: 500 })
  }
}
