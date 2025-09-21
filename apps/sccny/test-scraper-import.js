// Test scraper import and functionality
async function testScraperImport() {
  try {
    console.log("Testing scraper import and basic functionality...");

    // Manually test the scraping logic with a simpler approach
    const axios = require("axios");
    const cheerio = require("cheerio");

    const url =
      "https://www.scc-ny.org/sermons/%e8%ae%b2%e9%81%93%e5%bd%95%e9%9f%b3/";

    console.log("Fetching sermon data from:", url);

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TestScript/1.0)",
      },
    });

    const $ = cheerio.load(response.data);
    const sermons = [];

    // Test the mp3 link parsing logic directly
    const mp3Links = $('a[href$=".mp3"]');
    console.log(`Found ${mp3Links.length} mp3 links`);

    mp3Links.each((_, element) => {
      const mp3Url = $(element).attr("href");
      if (!mp3Url || !mp3Url.endsWith(".mp3")) {
        return;
      }

      // Extract filename from URL
      const filename = mp3Url.split("/").pop()?.replace(".mp3", "");
      if (!filename) {
        return;
      }

      console.log(`Processing filename: ${filename}`);

      // Parse filename to extract title and speaker
      const parts = filename.split("-");

      let title = filename;
      let speaker = "Unknown Speaker";

      if (parts.length >= 2) {
        // Look for Chinese names (2-4 Chinese characters)
        for (
          let i = parts.length - 1;
          i >= Math.max(0, parts.length - 3);
          i--
        ) {
          const part = parts[i].trim();
          if (/^[\u4e00-\u9fff]{2,4}$/.test(part)) {
            speaker = part;
            title = parts.slice(0, i).join("-").trim();
            break;
          }
          // Also check for English names
          if (/^[A-Za-z\s]{3,50}$/.test(part)) {
            speaker = part;
            title = parts.slice(0, i).join("-").trim();
            break;
          }
        }

        // Fallback: last part as speaker
        if (speaker === "Unknown Speaker") {
          speaker = parts[parts.length - 1].trim();
          title = parts
            .slice(0, parts.length - 1)
            .join("-")
            .trim();
        }
      }

      // Extract date from URL path
      let date = new Date().toISOString();
      const dateMatch = mp3Url.match(/\/(\d{4})\/(\d{2})\//);
      if (dateMatch) {
        const [, year, month] = dateMatch;
        date = new Date(`${year}-${month}-01`).toISOString();
      }

      sermons.push({
        title,
        speaker,
        date,
        audioUrl: mp3Url,
      });

      console.log(
        `Parsed: Title="${title}", Speaker="${speaker}", Date="${date}"`
      );
    });

    console.log(`\nSuccessfully parsed ${sermons.length} sermons`);
    console.log("Sample sermon:", sermons[0]);
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testScraperImport();
