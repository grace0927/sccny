import axios from "axios";
import * as cheerio from "cheerio";
import { prisma } from "./db";
import { SermonCreateType } from "./validations";
import { SermonType as PrismaSermonType } from "../generated/prisma";

export interface RawSermonData {
  title: string;
  speaker: string;
  date: string;
  type: PrismaSermonType;
  series?: string;
  scripture?: string;
  videoUrl?: string;
  audioUrl?: string;
  description?: string;
}

export interface SermonSource {
  url: string;
  type: PrismaSermonType;
}

export class SermonScraper {
  private readonly sources: SermonSource[] = [
    {
      url: "https://www.scc-ny.org/sermons/%e8%ae%b2%e9%81%93%e5%bd%95%e9%9f%b3/",
      type: PrismaSermonType.SERMON,
    },
    {
      url: "https://www.scc-ny.org/sermons/%e4%b8%bb%e6%97%a5%e5%ad%a6%e5%bd%95%e9%9f%b3/",
      type: PrismaSermonType.SUNDAY_SCHOOL,
    },
    {
      url: "https://www.scc-ny.org/sermons/%e7%89%b9%e4%bc%9a%e4%bf%a1%e6%81%af/",
      type: PrismaSermonType.RETREAT_MESSAGE,
    },
    {
      url: "https://www.scc-ny.org/sermons/%e5%8f%97%e6%b5%b8%e7%8f%ad%e5%bd%95%e9%9f%b3/",
      type: PrismaSermonType.BAPTISM_CLASS,
    },
  ];

  /**
   * Fetch and parse sermon data from all church website sources
   */
  async scrapeSermons(): Promise<RawSermonData[]> {
    const allSermons: RawSermonData[] = [];

    for (const source of this.sources) {
      try {
        console.log(`Fetching ${source.type} data from: ${source.url}`);

        const sermons = await this.scrapeSermonsFromSource(source);
        console.log(`Found ${sermons.length} ${source.type} sermons`);

        allSermons.push(...sermons);
      } catch (error) {
        console.error(
          `Error scraping ${source.type} from ${source.url}:`,
          error
        );
        // Continue with other sources even if one fails
      }
    }

    console.log(
      `Successfully scraped ${allSermons.length} total sermons from all sources`
    );
    return allSermons;
  }

  /**
   * Fetch and parse sermons from a single source
   */
  private async scrapeSermonsFromSource(
    source: SermonSource
  ): Promise<RawSermonData[]> {
    const response = await axios.get(source.url, {
      timeout: 10000,
      headers: {
        "User-Agent": "SCCNY-API-Scraper/1.0",
      },
    });

    const $ = cheerio.load(response.data);
    const sermons: RawSermonData[] = [];

    // Parse sermon entries using the correct selector found from testing
    $("table#bloglist tbody tr").each((_, element) => {
      const sermon = this.parseSermonElement($, element, source.type);
      if (sermon) {
        sermons.push(sermon);
      }
    });

    // If no sermons found with class selector, try finding by mp3 links directly
    if (sermons.length === 0) {
      const mp3Links = $('a[href$=".mp3"]');
      mp3Links.each((_, element) => {
        const sermon = this.parseSermonFromMp3Link($, element, source.type);
        if (sermon) {
          sermons.push(sermon);
        }
      });
    }

    return sermons;
  }

  /**
   * Parse individual sermon element from HTML
   */
  private parseSermonElement(
    $: cheerio.CheerioAPI,
    element: unknown,
    type: PrismaSermonType = PrismaSermonType.SERMON
  ): RawSermonData | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const $element = $(element as any);
      const titleElement = $element
        .find("h1, h2, h3, .title, .sermon-title")
        .first();
      const title = titleElement.text().trim();

      // Extract date
      const dateElement = $element.find(".posted_on").first();
      const dateText = dateElement.text().trim();
      const date = this.parseDate(dateText);

      // Extract series
      const seriesElement = $element.find(".series, .category").first();
      const series = seriesElement.text().trim() || undefined;

      // Extract scripture
      const scriptureElement = $element
        .find(".scripture, .bible-verse")
        .first();
      const scripture = scriptureElement.text().trim() || undefined;

      // Extract URLs
      const videoUrl = this.extractUrl(
        $element.find('a[href*="youtube"], a[href*="vimeo"], video').first()
      );
      const audioUrl = this.extractUrl(
        $element.find('a[href*="mp3"], a[href*="audio"], audio source').first()
      );

      // Extract speaker
      const speaker =
        audioUrl?.split("-").at(-1)?.trim().split(".")[0] || "Unknown Speaker";

      // Extract description
      const descriptionElement = $element
        .find(".description, .summary, .excerpt, .content p")
        .first();
      const description = descriptionElement.text().trim() || undefined;

      return {
        title,
        speaker,
        date,
        type,
        series,
        scripture,
        videoUrl,
        audioUrl,
        description,
      };
    } catch (error) {
      console.error("Error parsing sermon element:", error);
      return null;
    }
  }

  /**
   * Extract URL from element
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractUrl(element: cheerio.Cheerio<any>): string | undefined {
    const href = element.attr("href");
    const src = element.attr("src");
    return href || src || undefined;
  }

  /**
   * Parse date string into ISO format
   */
  private parseDate(dateText: string): string {
    // Try multiple date formats
    const date = new Date(dateText);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    // Try common Chinese date formats
    const chineseDateMatch = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (chineseDateMatch) {
      const [, year, month, day] = chineseDateMatch;
      return new Date(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      ).toISOString();
    }

    // Default to current date if parsing fails
    console.warn(`Could not parse date: ${dateText}, using current date`);
    return new Date().toISOString();
  }

  /**
   * Transform raw scraped data into database format
   */
  transformSermonData(data: RawSermonData[]): SermonCreateType[] {
    return data.map((item) => ({
      title: item.title,
      speaker: item.speaker,
      date: item.date,
      type: item.type,
      series: item.series,
      scripture: item.scripture,
      videoUrl: item.videoUrl,
      audioUrl: item.audioUrl,
      description: item.description,
    }));
  }

  /**
   * Parse sermon data from mp3 link filename
   * Filenames follow patterns like: "中文标题-演讲者名.mp3" or "English Title-Speaker.mp3"
   */
  private parseSermonFromMp3Link(
    $: cheerio.CheerioAPI,
    element: unknown,
    type: PrismaSermonType = PrismaSermonType.SERMON
  ): RawSermonData | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mp3Url = $(element as any).attr("href");
      if (!mp3Url || !mp3Url.endsWith(".mp3")) {
        return null;
      }

      // Extract filename from URL (remove path and extension)
      const filename = mp3Url.split("/").pop()?.replace(".mp3", "");
      if (!filename) {
        return null;
      }

      // Parse filename to extract title, speaker, and date
      const parts = filename.split("-");

      // Default values
      let title = filename;
      let speaker = "Unknown Speaker";
      let date = new Date().toISOString();

      if (parts.length >= 2) {
        // Try to identify speaker (usually last part or part before date)
        const potentialSpeakers = parts.slice(-3); // Last 3 parts might contain speaker

        // Look for Chinese or English names
        for (const part of potentialSpeakers) {
          // Chinese names pattern (2-4 characters)
          if (/^[\u4e00-\u9fff]{2,4}$/.test(part.trim())) {
            speaker = part.trim();
            title = parts.slice(0, parts.indexOf(part)).join("-").trim();
            break;
          }
          // English names pattern
          if (/^[A-Za-z\s]{3,50}$/.test(part.trim())) {
            speaker = part.trim();
            title = parts.slice(0, parts.indexOf(part)).join("-").trim();
            break;
          }
        }

        // If no clear speaker found, use last part as speaker and rest as title
        if (speaker === "Unknown Speaker" && parts.length >= 2) {
          speaker = parts[parts.length - 1].trim();
          title = parts
            .slice(0, parts.length - 1)
            .join("-")
            .trim();
        }
      }

      // Use URL for date extraction - try to find date patterns in URL
      const dateMatch = mp3Url.match(/\/(\d{4})\/(\d{2})\//);
      if (dateMatch) {
        const [, year, month] = dateMatch;
        date = new Date(`${year}-${month}-01`).toISOString();
      }

      return {
        title: title || filename,
        speaker,
        date,
        type,
        audioUrl: mp3Url,
      };
    } catch (error) {
      console.error("Error parsing mp3 link:", error);
      return null;
    }
  }

  /**
   * Sync scraped sermons to database using upsert
   */
  async syncSermons(): Promise<{ new: number; updated: number }> {
    const rawData = await this.scrapeSermons();
    const transformedData = this.transformSermonData(rawData);

    let newCount = 0;
    let updatedCount = 0;

    for (const sermon of transformedData) {
      try {
        // Use title + date as unique identifier for upsert
        const existing = await prisma.sermon.findFirst({
          where: {
            title: sermon.title,
            date: new Date(sermon.date!),
          },
        });

        if (existing) {
          // Update existing sermon
          await prisma.sermon.update({
            where: { id: existing.id },
            data: {
              speaker: sermon.speaker,
              type: sermon.type,
              series: sermon.series,
              scripture: sermon.scripture,
              videoUrl: sermon.videoUrl,
              audioUrl: sermon.audioUrl,
              description: sermon.description,
            },
          });
          updatedCount++;
        } else {
          // Create new sermon
          await prisma.sermon.create({
            data: {
              title: sermon.title,
              speaker: sermon.speaker,
              date: new Date(sermon.date!),
              type: sermon.type,
              series: sermon.series,
              scripture: sermon.scripture,
              videoUrl: sermon.videoUrl,
              audioUrl: sermon.audioUrl,
              description: sermon.description,
            },
          });
          newCount++;
        }
      } catch (error) {
        console.error(`Error upserting sermon "${sermon.title}":`, error);
        // Continue with other sermons even if one fails
      }
    }

    console.log(
      `Sermon sync complete: ${newCount} new, ${updatedCount} updated`
    );
    return { new: newCount, updated: updatedCount };
  }
}

export const sermonScraper = new SermonScraper();
