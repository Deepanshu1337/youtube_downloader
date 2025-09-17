import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 })
    }

    // Security: Only allow files from downloads directory and prevent path traversal
    const safeFilename = path.basename(filename)
    const downloadsDir = path.join(process.cwd(), "downloads")
    const filePath = path.join(downloadsDir, safeFilename)
    
    // Ensure downloads directory exists
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true })
      console.log("[v0] Created downloads directory:", downloadsDir)
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath)
    
    // Determine content type based on file extension
    const ext = path.extname(safeFilename).toLowerCase()
    let contentType = 'application/octet-stream'
    
    if (ext === '.mp4') {
      contentType = 'video/mp4'
    } else if (ext === '.mp3') {
      contentType = 'audio/mpeg'
    } else if (ext === '.webm') {
      contentType = 'video/webm'
    }

    // Create response with file
    const response = new NextResponse(fileBuffer)
    
    // Set headers for download
    response.headers.set('Content-Type', contentType)
    response.headers.set('Content-Disposition', `attachment; filename="${safeFilename}"`)
    response.headers.set('Content-Length', fileBuffer.length.toString())
    
    return response
    
  } catch (error) {
    console.error("[v0] Error serving file:", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}