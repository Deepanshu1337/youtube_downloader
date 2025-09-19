import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const safeFilename = path.basename(filename);
    const downloadsDir = path.join(process.cwd(), "downloads");
    const filePath = path.join(downloadsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const range = request.headers.get("range");

    let start = 0;
    let end = stat.size - 1;
    let status = 200;
    let contentLength = stat.size;

    if (range) {
      const match = /bytes=(\d+)-(\d*)/.exec(range);
      if (match) {
        start = parseInt(match[1], 10);
        if (match[2]) {
          end = parseInt(match[2], 10);
        }
        status = 206;
        contentLength = end - start + 1;
      }
    }

    const ext = path.extname(safeFilename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".mp4") contentType = "video/mp4";
    else if (ext === ".mp3") contentType = "audio/mpeg";
    else if (ext === ".webm") contentType = "video/webm";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${safeFilename}"`);
    headers.set("Content-Length", contentLength.toString());
    if (status === 206) {
      headers.set("Content-Range", `bytes ${start}-${end}/${stat.size}`);
      headers.set("Accept-Ranges", "bytes");
    }

    const stream = fs.createReadStream(filePath, { start, end });

    return new NextResponse(stream as any, {
      status,
      headers,
    });
  } catch (error) {
    console.error("[v0] Error serving file:", error);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
