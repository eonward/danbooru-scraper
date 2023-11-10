#### Usage
```node scraper.js <tag1> [<tag2>]```

eg: ```node scraper.js tab_head furry```

files will be dumped into ./output

#### Notes
donmai.us exposes an API; that should be used instead of plain scraping.
This script simply automates requests and parses the html to grab CDN URLs. Expect it to break.
