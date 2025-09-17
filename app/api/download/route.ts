import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Download API called")
    const { url, quality, format } = await request.json()
    console.log("[v0] Download params:", { url, quality, format })

    if (!url || !quality) {
      console.log("[v0] Missing required parameters")
      return NextResponse.json({ error: "URL and quality are required" }, { status: 400 })
    }

    console.log("[v0] Getting direct download URL")
    const downloadResult = await getDirectDownloadUrl(url, quality, format || "mp4")
    console.log("[v0] Download result:", downloadResult)

    if (!downloadResult.success) {
      console.log("[v0] Download failed:", downloadResult.error)
      return NextResponse.json({ error: downloadResult.error || "Failed to get download URL" }, { status: 500 })
    }

    // Create a proxy URL that will force download
    const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(downloadResult.downloadUrl)}&filename=${encodeURIComponent(downloadResult.filename)}`
    
    return NextResponse.json({
      success: true,
      downloadUrl: proxyUrl,
      filename: downloadResult.filename,
      title: downloadResult.title,
      message: "Download URL generated successfully",
    })
  } catch (error) {
    console.error("[v0] Error in download API:", error)
    return NextResponse.json({ error: "Failed to get download URL" }, { status: 500 })
  }
}

async function getDirectDownloadUrl(url: string, quality: string, format: string): Promise<any> {
  return new Promise((resolve) => {
    console.log("[v0] Getting direct download URL")
    const scriptPath = path.join(process.cwd(), "scripts", "youtube_downloader.py")
    console.log("[v0] Script path:", scriptPath)

    const pythonProcess = spawn("py", [scriptPath, "get-url", url, quality, format])

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

      if (code !== 0) {
        resolve({ success: false, error: `Failed to get download URL (code ${code}): ${errorOutput}` })
        return
      }

      try {
        const result = JSON.parse(output)
        resolve(result)
      } catch (e) {
        console.log("[v0] JSON parse error:", e)
        resolve({ success: false, error: `Failed to parse result: ${output}` })
      }
    })

    pythonProcess.on("error", (error) => {
      console.log("[v0] Python process error:", error)
      resolve({ success: false, error: `Failed to start process: ${error.message}` })
    })

    // Timeout after 30 seconds
    setTimeout(() => {
      console.log("[v0] Process timeout")
      pythonProcess.kill()
      resolve({ success: false, error: "Request timeout" })
    }, 30000)
  })
}

async function downloadVideoWithYtDlp(url: string, quality: string, format: string): Promise<any> {
  return new Promise((resolve) => {
    console.log("[v0] Starting Python download process")
    const scriptPath = path.join(process.cwd(), "scripts", "youtube_downloader.py")
    console.log("[v0] Download script path:", scriptPath)

    const pythonProcess = spawn("py", [scriptPath, "download", url, quality, format])

    let output = ""
    let errorOutput = ""

    pythonProcess.stdout.on("data", (data) => {
      const chunk = data.toString()
      console.log("[v0] Download stdout:", chunk)
      output += chunk
    })

    pythonProcess.stderr.on("data", (data) => {
      const chunk = data.toString()
      console.log("[v0] Download stderr:", chunk)
      errorOutput += chunk
    })

    pythonProcess.on("close", (code) => {
      console.log("[v0] Download process closed with code:", code)
      console.log("[v0] Download output:", output)
      console.log("[v0] Download error output:", errorOutput)

      if (code !== 0) {
        if (errorOutput.includes("command not found") || errorOutput.includes("No such file")) {
          console.log("[v0] Trying download with 'python' command instead")
          const pythonProcess2 = spawn("python", [scriptPath, "download", url, quality, format])

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
              resolve({ success: false, error: `Download failed (code ${code2}): ${errorOutput2 || errorOutput}` })
              return
            }

            try {
              const result = JSON.parse(output2)
              resolve(result)
            } catch (e) {
              resolve({ success: false, error: `Failed to process download result: ${output2}` })
            }
          })

          return
        }

        resolve({ success: false, error: `Download failed (code ${code}): ${errorOutput}` })
        return
      }

      try {
        const result = JSON.parse(output)
        resolve(result)
      } catch (e) {
        console.log("[v0] Download JSON parse error:", e)
        resolve({ success: false, error: `Failed to process download result: ${output}` })
      }
    })

    pythonProcess.on("error", (error) => {
      console.log("[v0] Download process error:", error)
      resolve({ success: false, error: `Failed to start download process: ${error.message}` })
    })

    // Timeout after 5 minutes for downloads
    setTimeout(() => {
      console.log("[v0] Download process timeout")
      pythonProcess.kill()
      resolve({ success: false, error: "Download timeout" })
    }, 300000)
  })
}
