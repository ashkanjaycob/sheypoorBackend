const fs = require('fs');
const cheerio = require('cheerio');

try {
  const html = fs.readFileSync('sheypoor.html', 'utf8');
  const $ = cheerio.load(html);
  
  $('a[href*="/v/"]').slice(0, 3).each((i, el) => {
      console.log("\n--- Post", i, "---");
      const $el = $(el);
      const title = $el.find('h2').text().trim();
      console.log("Title:", title);
      
      const imgElement = $el.find('img');
      const image = imgElement.attr('src') || '';
      console.log("Image:", image);

      // Find all text inside spans/divs to see how we can extract price/city
      const parts = [];
      $el.find('*').each((idx, child) => {
         // only get text nodes directly inside
         const text = $(child).contents().filter(function() {
            return this.type === 'text';
         }).text().trim();
         if (text && text.length > 2 && text !== title) {
            parts.push(text);
         }
      });
      console.log("Text parts:", parts);
  });

} catch (e) {
  console.error("Error", e);
}
