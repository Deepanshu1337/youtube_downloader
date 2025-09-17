import { NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function GET() {
  console.log("[v0] Test endpoint called")

  // Test Python availability
  const testUrl = "https://youtu.be/2PYpGGn4l7s"

  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), "scripts", "youtube_downloader.py")
    console.log("[v0] Testing with script path:", scriptPath)

    const pythonProcess = spawn("py", [scriptPath, "info", testUrl])

    let output = ""
    let errorOutput = ""

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString()
    })

    pythonProcess.on("close", (code) => {
      console.log("[v0] Test process closed with code:", code)
      console.log("[v0] Test output:", output)
      console.log("[v0] Test error:", errorOutput)

      resolve(
        NextResponse.json({
          success: code === 0,
          code,
          output,
          errorOutput,
          scriptPath,
          testUrl,
        }),
      )
    })

    pythonProcess.on("error", (error) => {
      console.log("[v0] Test process error:", error)
      resolve(
        NextResponse.json({
          success: false,
          error: error.message,
          scriptPath,
          testUrl,
        }),
      )
    })

    setTimeout(() => {
      pythonProcess.kill()
      resolve(
        NextResponse.json({
          success: false,
          error: "Test timeout",
          scriptPath,
          testUrl,
        }),
      )
    }, 10000)
  })
}
