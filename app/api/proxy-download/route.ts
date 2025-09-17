import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const downloadUrl = searchParams.get('url')
    const filename = searchParams.get('filename')

    if (!downloadUrl || !filename) {
      return NextResponse.json({ error: "URL and filename are required" }, { status: 400 })
    }

    // Forward Range header for better streaming support (resume/partial content)
    const rangeHeader = request.headers.get('range') || undefined

    const upstream = await fetch(downloadUrl, {
      headers: {
        // Some CDNs require a browser-like UA and referer
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Referer': 'https://www.youtube.com/',
        ...(rangeHeader ? { Range: rangeHeader } : {}),
      },
      cache: 'no-store',
      // Keepalive disabled to allow long streaming
    })

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: `Upstream fetch failed: ${upstream.status}` }, { status: 502 })
    }

    // Prepare headers, override to force download
    const headers = new Headers(upstream.headers)
    const contentType = headers.get('content-type') || 'application/octet-stream'

    headers.set('Content-Type', contentType)
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set('Cache-Control', 'no-store')

    // Create a streaming response to avoid buffering large files in memory
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    })
  } catch (error) {
    console.error('[v0] Error proxying download:', error)
    return NextResponse.json(
      {
        error: 'Failed to download file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}