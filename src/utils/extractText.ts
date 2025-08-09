import pdfjsLib from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { load } from "cheerio";
import { YouTubeTranscript } from "youtube-transcript";

export async function extractFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = (content.items as TextItem[])
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    text += `${strings}\n`;
  }
  return text.trim();
}

export async function extractFromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const html = await res.text();
  const $ = load(html);
  return $("body").text().replace(/\s+/g, " ").trim();
}

export async function extractFromYoutube(videoUrl: string): Promise<string> {
  const videoIdMatch = videoUrl.match(/[?&]v=([^&#]+)/) || videoUrl.match(/youtu\.be\/([^?&#]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }
  const transcript = await YouTubeTranscript.fetchTranscript(videoId, {
    // Optional API key for quota-limited endpoints
    apiKey: process.env.YOUTUBE_API_KEY,
  });
  return transcript.map((item) => item.text).join(" ");
}

