const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
   const url = 'https://www.sheypoor.com/v/%D8%A7%D9%85-%D8%B3-j7-1403-%D8%B3%D9%81-%D8%AF-466075580.html';
   try {
       const res = await axios.get(url, { headers: {
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
       }});
       const $ = cheerio.load(res.data);
       let desc = "";
       $('p').each((_, p) => {
           const t = $(p).text().trim();
           if (t.length > desc.length) desc = t;
       });
       console.log("Extracted Description:", desc);
   } catch(e) {
       console.error("Error", e.message);
   }
}

test();
