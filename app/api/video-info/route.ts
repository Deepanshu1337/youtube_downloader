import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

interface VideoInfo {
  title: string
  thumbnail: string
  duration: string
  views: string
  channel: string
  videoId: string
  formats: Array<{
    quality: string
    format: string
    size?: string
  }>
  is_live?: boolean
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Video info API called")
    const { url } = await request.json()
    console.log("[v0] URL received:", url)

    if (!url) {
      console.log("[v0] No URL provided")
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log("[v0] Calling getVideoInfoFromYtDlp")
    const videoInfo = await getVideoInfoFromYtDlp(url)
    console.log("[v0] Video info result:", videoInfo)

    if (!videoInfo.success) {
      console.log("[v0] Video info failed:", videoInfo.error)
      return NextResponse.json({ error: videoInfo.error || "Failed to fetch video information" }, { status: 500 })
    }

    return NextResponse.json(videoInfo)
  } catch (error) {
    console.error("[v0] Error in video-info API:", error)
    return NextResponse.json({ error: "Failed to fetch video information" }, { status: 500 })
  }
}

async function getVideoInfoFromYtDlp(url: string): Promise<any> {
  return new Promise((resolve) => {
    console.log("[v0] Starting Python process for video info")
    const scriptPath = path.join(process.cwd(), "scripts", "youtube_downloader.py")
    console.log("[v0] Script path:", scriptPath)

    const pythonProcess = spawn("py", [scriptPath, "info", url])

    let output = ""
    let errorOutput = ""

    pythonProcess.stdout.on("data", (data) => {
      const chunk = data.toString()
      console.log("[v0] Python stdout:", chunk)
      output += chunk
    })

    pythonProcess.stderr.on("data", (data) => {
      const chunk = data.toString()
      console.log("[v0] Python stderr:", chunk)
      errorOutput += chunk
    })

    pythonProcess.on("close", (code) => {
      console.log("[v0] Python process closed with code:", code)
      console.log("[v0] Full output:", output)
      console.log("[v0] Full error output:", errorOutput)

      if (code !== 0) {
        if (errorOutput.includes("command not found") || errorOutput.includes("No such file")) {
          console.log("[v0] Trying with 'python' command instead")
          const pythonProcess2 = spawn("python", [scriptPath, "info", url])

          let output2 = ""
          let errorOutput2 = ""

          pythonProcess2.stdout.on("data", (data) => {
            output2 += data.toString()
          })

          pythonProcess2.stderr.on("data", (data) => {
            errorOutput2 += data.toString()
          })

          pythonProcess2.on("close", (code2) => {
            if (code2 !== 0) {
              resolve({ success: false, error: `Python script failed: ${errorOutput2 || errorOutput}` })
              return
            }

            try {
              const result = JSON.parse(output2)
              resolve(result)
            } catch (e) {
              console.log("[v0] JSON parse error:", e)
              resolve({ success: false, error: `Failed to parse video information: ${output2}` })
            }
          })

          return
        }

        resolve({ success: false, error: `Python script failed (code ${code}): ${errorOutput}` })
        return
      }

      try {
        const result = JSON.parse(output)
        resolve(result)
      } catch (e) {
        console.log("[v0] JSON parse error:", e)
        resolve({ success: false, error: `Failed to parse video information: ${output}` })
      }
    })

    pythonProcess.on("error", (error) => {
      console.log("[v0] Python process error:", error)
      resolve({ success: false, error: `Failed to start Python process: ${error.message}` })
    })

    // Timeout after 30 seconds
    setTimeout(() => {
      console.log("[v0] Python process timeout")
      pythonProcess.kill()
      resolve({ success: false, error: "Request timeout" })
    }, 30000)
  })
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/live\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}
