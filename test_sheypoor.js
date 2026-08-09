const fs = require('fs');
const cheerio = require('cheerio');

try {
  const html = fs.readFileSync('sheypoor.html', 'utf8');
  const $ = cheerio.load(html);
  
  console.log("Looking for h2 and h3 tags:");
  $('h2, h3').slice(0, 10).each((i, el) => {
      console.log("\n---", el.tagName, "---");
      console.log("Class:", $(el).attr('class'));
      console.log("Text:", $(el).text().trim().substring(0, 50));
      console.log("Parent a tag href:", $(el).closest('a').attr('href') || 'none');
      console.log("Closest a tag outside parent:", $(el).parents('a').first().attr('href') || 'none');
  });

  console.log("\nLooking for all links with long numbers in href:");
  let count = 0;
  $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      // sheypoor listings usually have long IDs in them or end with .html or start with /v/
      if (href && (href.match(/-[0-9]{5,}\.html$/) || href.includes('/v/'))) {
          if (count > 5) return;
          console.log("\n--- Listing Link Found ---");
          console.log("Href:", href);
          console.log("Text:", $(el).text().trim().substring(0, 100));
          const img = $(el).find('img');
          if (img.length > 0) {
              console.log("Image found:", img.attr('src'));
          } else {
             console.log("Image found?", false);
          }
          count++;
      }
  });

} catch (e) {
  console.error("Error", e);
}
