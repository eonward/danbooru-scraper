#### Usage
```node scraper.js <tag1> [<tag2>]```

eg: ```node scraper.js tab_head furry```

This will fetch all images that turn up under tag1 and optional tag2 with original quality, and dump them into ./output

#### Notes
donmai.us exposes an API; that should be used instead of plain scraping.
This script simply automates requests and parses the html to grab CDN URLs. Expect it to break.
