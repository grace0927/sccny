import axios from "axios";
import * as cheerio from "cheerio";
import { prisma } from "./db";
import { NewsCreateType } from "./validations";

export interface RawNewsData {
  title: string;
  date: string;
  excerpt: string;
  detailUrl: string;
  content?: string;
}

export class NewsScraper {
  private readonly newsUrl = "https://www.scc-ny.org/news/";

  /**
   * Fetch and parse news data from church website
   */
  async scrapeNews(): Promise<RawNewsData[]> {
    try {
      console.log("Fetching news data from:", this.newsUrl);

      const response = await axios.get(this.newsUrl, {
        timeout: 10000,
        headers: {
          "User-Agent": "SCCNY-API-Scraper/1.0",
        },
      });

      const $ = cheerio.load(response.data);
      const newsItems: RawNewsData[] = [];

      // Debug: Log the HTML structure to understand what we're working with
      console.log("Page title:", $("title").text());
      console.log("Blog list table exists:", $("table#bloglist").length > 0);
      console.log("Table rows found:", $("#bloglist tbody tr").length);

      // Try multiple selectors if the specific one doesn't work
      const selectors = [
        "table#bloglist tbody tr",
        "#bloglist tbody tr",
        "table#bloglist tr",
        "#bloglist tr",
        ".bloglist tr",
        ".news-list tr",
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        console.log(`Selector "${selector}" found ${elements.length} elements`);

        if (elements.length > 0) {
          console.log(
            `Found ${elements.length} elements with selector "${selector}"`
          );
          elements.each((index, element) => {
            console.log(`Processing element ${index + 1}/${elements.length}`);
            const newsItem = this.parseNewsItem($, element);
            console.log(
              `Parsed news item ${index + 1}:`,
              newsItem ? "Success" : "Failed"
            );
            if (newsItem) {
              newsItems.push(newsItem);
            }
          });
          break; // Found elements, stop trying other selectors
        }
      }

      console.log(`Successfully parsed ${newsItems.length} news items`);
      return newsItems;
    } catch (error) {
      console.error("Error scraping news:", error);
      throw error;
    }
  }

  /**
   * Parse individual news item from table row
   */
  private parseNewsItem(
    $: cheerio.CheerioAPI,
    element: unknown
  ): RawNewsData | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const $element = $(element as any);

      // The structure is <tr><td class="posted_on">...</td><td class="title">...</td><td class="excerpt">...</td></tr>
      const tdElements = $element.find("td");

      if (tdElements.length < 3) {
        console.log("Row doesn't have enough columns");
        return null;
      }

      // Extract date from first column (posted_on)
      const dateText = tdElements.eq(0).text().trim();
      const date = this.parseDate(dateText);

      // Extract title and URL from second column (title)
      const titleCell = tdElements.eq(1);
      const titleElement = titleCell.find("a").first();
      const title = titleElement.text().trim();
      const detailUrl = titleElement.attr("href") || "";

      // Extract excerpt from third column (excerpt)
      const excerpt = tdElements.eq(2).text().trim() || "";

      console.log("Parsed data:", {
        date,
        title,
        detailUrl: detailUrl.substring(0, 100),
        excerpt: excerpt.substring(0, 50),
      });

      if (!title || !detailUrl) {
        console.warn("Missing title or URL for news item");
        return null;
      }

      return {
        title,
        date,
        excerpt,
        detailUrl: detailUrl.startsWith("http")
          ? detailUrl
          : `https://www.scc-ny.org${detailUrl}`,
      };
    } catch (error) {
      console.error("Error parsing news item:", error);
      return null;
    }
  }

  /**
   * Fetch full content from news detail page
   */
  async scrapeNewsContent(detailUrl: string): Promise<string> {
    try {
      console.log(`Fetching news content from: ${detailUrl}`);

      const response = await axios.get(detailUrl, {
        timeout: 10000,
        headers: {
          "User-Agent": "SCCNY-API-Scraper/1.0",
        },
      });

      const $ = cheerio.load(response.data);

      // Extract main content - look for common content containers
      const contentSelectors = [
        ".article_content", // Specific SCCNY selector for news content
        ".entry-content",
        ".post-content",
        ".content",
        "article .content",
        "#content",
        ".blog-post-content",
      ];

      let content = "";
      for (const selector of contentSelectors) {
        const contentElement = $(selector).first();
        if (contentElement.length > 0) {
          content =
            contentElement.html()?.trim() || contentElement.text().trim();
          if (content) break;
        }
      }

      // Fallback to body content if no specific content container found
      if (!content) {
        const bodyContent = $("body").text().trim();
        content = bodyContent.substring(0, 2000); // Limit to reasonable length
      }

      return content || "Content not available";
    } catch (error) {
      console.error(`Error scraping content from ${detailUrl}:`, error);
      return "Content not available";
    }
  }

  /**
   * Parse date string into ISO format
   * Handles various date formats from SCCNY website
   */
  private parseDate(dateText: string): string {
    if (!dateText) {
      return new Date().toISOString();
    }

    // Try multiple date formats
    const date = new Date(dateText);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    // Try common formats like "Dec 15, 2023" or "December 15, 2023"
    const formats = [
      // "Dec 15, 2023"
      /(\w{3})\s+(\d{1,2}),\s+(\d{4})/,
      // "December 15, 2023"
      /(\w+)\s+(\d{1,2}),\s+(\d{4})/,
      // Chinese: "2023年12月15日"
      /(\d{4})年(\d{1,2})月(\d{1,2})日/,
      // ISO-like: "2023-12-15"
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
    ];

    for (const format of formats) {
      const match = dateText.match(format);
      if (match) {
        if (format === formats[0] || format === formats[1]) {
          // English month format
          const [, month, day, year] = match;
          const monthNames: { [key: string]: string } = {
            Jan: "01",
            Feb: "02",
            Mar: "03",
            Apr: "04",
            May: "05",
            Jun: "06",
            Jul: "07",
            Aug: "08",
            Sep: "09",
            Oct: "10",
            Nov: "11",
            Dec: "12",
          };
          const monthNum = monthNames[month.substring(0, 3)] || "01";
          return new Date(
            `${year}-${monthNum}-${day.padStart(2, "0")}`
          ).toISOString();
        } else if (format === formats[2]) {
          // Chinese format
          const [, year, month, day] = match;
          return new Date(
            `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
          ).toISOString();
        } else if (format === formats[3]) {
          // ISO format
          const [, year, month, day] = match;
          return new Date(
            `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
          ).toISOString();
        }
      }
    }

    console.warn(`Could not parse date: "${dateText}", using current date`);
    return new Date().toISOString();
  }

  /**
   * Transform raw scraped data into database format
   */
  transformNewsData(data: RawNewsData[]): NewsCreateType[] {
    return data.map((item) => ({
      title: item.title,
      date: item.date,
      content: item.content || "Content will be populated from detail page",
      excerpt: item.excerpt,
      status: "PUBLISHED" as const,
    }));
  }

  /**
   * Sync scraped news to database using upsert
   */
  async syncNews(): Promise<{
    new: number;
    updated: number;
    totalProcessed: number;
  }> {
    const rawData = await this.scrapeNews();

    // Fetch full content for each news item (optional - can be batched)
    const newsWithContent: RawNewsData[] = [];
    for (const item of rawData.slice(0, 5)) {
      // Limit to first 5 for testing
      try {
        console.log(`Fetching content for: ${item.title}`);
        const content = await this.scrapeNewsContent(item.detailUrl);
        newsWithContent.push({
          ...item,
          content,
        });

        // Small delay to be respectful to the server
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to get content for ${item.title}:`, error);
        newsWithContent.push(item); // Still include without content
      }
    }

    const transformedData = this.transformNewsData(newsWithContent);
    let newCount = 0;
    let updatedCount = 0;

    for (const news of transformedData) {
      try {
        // Use title + date as unique identifier for upsert
        const existing = await prisma.news.findFirst({
          where: {
            title: news.title,
            date: new Date(news.date!),
          },
        });

        if (existing) {
          // Update existing news
          await prisma.news.update({
            where: { id: existing.id },
            data: {
              content: news.content,
              excerpt: news.excerpt,
            },
          });
          updatedCount++;
        } else {
          // Create new news
          await prisma.news.create({
            data: {
              title: news.title,
              date: new Date(news.date!),
              content: news.content || "Content not available",
              excerpt: news.excerpt,
            },
          });
          newCount++;
        }
      } catch (error) {
        console.error(`Error upserting news "${news.title}":`, error);
        // Continue with other news items even if one fails
      }
    }

    console.log(
      `News sync complete: ${newCount} new, ${updatedCount} updated, ${transformedData.length} total processed`
    );
    return {
      new: newCount,
      updated: updatedCount,
      totalProcessed: transformedData.length,
    };
  }
}

export const newsScraper = new NewsScraper();
