# cocozhao321.github.io

Personal website of Ke (Coco) Zhao: https://cocozhao321.github.io/

Static HTML/CSS/JS on GitHub Pages; no build step.

- `index.html`: all content and SEO metadata (JSON-LD `ProfilePage` + `Person` + `ScholarlyArticle`)
- `assets/css/site.css`, `assets/js/site.js`: styles and interactions
- `sitemap.xml`, `robots.txt`, `llms.txt`: crawler/LLM discovery

Local preview: `python3 -m http.server 8000`

When updating content, also bump `dateModified` in the JSON-LD and `lastmod` in `sitemap.xml`.
