import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = "https://youtube-downloader-backend-efg0.onrender.com"

export async function POST(request: NextRequest) {
  try {
    const { url, quality, format } = await request.json()

    if (!url || !quality) {
      return NextResponse.json({ error: "URL and quality are required" }, { status: 400 })
    }

    // 🔹 Call backend instead of Python
    const response = await fetch(`${BACKEND_URL}/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, quality, format }),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error calling backend /download:", error)
    return NextResponse.json({ error: "Failed to connect to backend" }, { status: 500 })
  }
}
