// Quick test script for sermon scraper
const axios = require("axios");
const cheerio = require("cheerio");

async function testScraper() {
  const urls = [
    "https://www.scc-ny.org/sermons/%e8%ae%b2%e9%81%93%e5%bd%95%e9%9f%b3/", // Sermons
    "https://www.scc-ny.org/sermons/%e4%b8%bb%e6%97%a5%e5%ad%a6%e5%bd%95%e9%9f%b3/", // Sunday School
    "https://www.scc-ny.org/sermons/%e7%89%b9%e4%bc%9a%e4%bf%a1%e6%81%af/", // Retreat Messages
    "https://www.scc-ny.org/sermons/%e5%8f%97%e6%b5%b8%e7%8f%ad%e5%bd%95%e9%9f%b3/", // Baptism Class
  ];

  for (const url of urls) {
    console.log(`\n=== Testing URL: ${url} ===`);

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TestScript/1.0)",
        },
      });

      console.log("Page loaded, length:", response.data.length);

      const $ = cheerio.load(response.data);

      // Try different selectors for sermon content
      const selectors = [
        ".sermon-item",
        ".sermon-entry",
        "article",
        ".post",
        ".entry",
        ".sermon",
        ".audio-item",
        ".media-item",
        "li",
        ".item",
        ".content-item",
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        console.log(
          `Selector "${selector}": found ${elements.length} elements`
        );
      }

      // Look at the page structure
      console.log("\nPage structure:");
      const body = $("body");
      console.log("Body children count:", body.children().length);
      console.log("Body text length:", body.text().length);

      // Check for links that might contain audio/video
      const mediaLinks = $(
        'a[href*="mp3"], a[href*="mp4"], a[href*="youtube"], a[href*="vimeo"]'
      );
      console.log(`\nFound ${mediaLinks.length} possible media links`);

      // Check for all heading elements
      const headings = $("h1, h2, h3, h4, h5, h6");
      console.log(`\nFound ${headings.length} heading elements:`);
      headings.each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 0 && text.length < 100) {
          console.log(`  ${$(el).prop("tagName")}: "${text}"`);
        }
      });

      // Check for lists or containers that might hold sermon data
      console.log("\nChecking for list structures:");
      const lists = $("ul, ol, .list, .sermon-list");
      console.log(`Found ${lists.length} lists`);
      if (lists.length > 0) {
        const listItems = lists.find("li");
        console.log(`Total list items: ${listItems.length}`);
        console.log("Sample list items:");
        listItems.slice(0, 8).each((i, el) => {
          const text = $(el).text().trim();
          console.log(
            `  ${i + 1}: "${text.substring(0, 80)}${
              text.length > 80 ? "..." : ""
            }"`
          );
        });
      }

      // Examine media links more closely
      if (mediaLinks.length > 0) {
        console.log("\nExamining media links:");
        mediaLinks.slice(0, 10).each((i, el) => {
          const href = $(el).attr("href");
          const text = $(el).text().trim();
          console.log(`  ${i + 1}: ${text} -> ${href}`);
        });
      }

      // Look for specific sermon-related containers or sections
      console.log("\nLooking for sermon-related sections:");
      const sermonSelectors = [
        "[class*='sermon']",
        "[id*='sermon']",
        "[class*='audio']",
        "[id*='audio']",
        ".recording",
        ".podcast",
        ".media",
      ];

      for (const selector of sermonSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          console.log(
            `Selector "${selector}": found ${elements.length} elements`
          );
          elements.slice(0, 2).each((i, el) => {
            const text = $(el).text().trim().substring(0, 100);
            console.log(`  Sample content: "${text}..."`);
          });
        }
      }

      // Check for table structures or card layouts
      const tables = $("table, .table, .card, .panel");
      console.log(`\nFound ${tables.length} tables/cards`);

      // Look for any elements with date attributes
      const dateElements = $("[datetime], time");
      console.log(`Found ${dateElements.length} date/time elements`);
      if (dateElements.length > 0) {
        dateElements.slice(0, 3).each((i, el) => {
          console.log(
            `  ${i + 1}: ${$(el).prop("tagName")} - datetime: ${$(el).attr(
              "datetime"
            )}`
          );
        });
      }

      // Look for date patterns in the text
      const text = body.text();
      const chineseDatePattern = /\d{4}年\d{1,2}月\d{1,2}日/g;
      const westernDatePattern =
        /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{1,2}-\d{1,2}/g;
      const dates =
        text.match(chineseDatePattern) || text.match(westernDatePattern);
      console.log(`\nDate pattern search results:`);
      console.log(
        `Chinese dates: ${text.match(chineseDatePattern)?.length || 0}`
      );
      console.log(
        `Western dates: ${text.match(westernDatePattern)?.length || 0}`
      );
      if (dates) {
        console.log("Sample dates found:", dates.slice(0, 5));
      }
    } catch (error) {
      console.error("Test failed for", url, ":", error.message);
    }
  }
}

testScraper();
