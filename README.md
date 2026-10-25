# rishabh-raj-dev.github.io

Personal portfolio of Rishabh Raj, frontend and mobile engineer in fintech, who also releases music as Shaan Zayin.
Live at https://rishabh-raj-dev.github.io/

Plain static HTML, CSS and a little JavaScript. No build step, no framework, no trackers.
GitHub Pages serves this repository from `main`, root folder (`.nojekyll` turns off Jekyll).

## Layout

```
index.html                  home page (all sections)
projects/<slug>/index.html  case studies: xohra-realm, habito
404.html                    not-found page
assets/css/site.css         design tokens (light + dark), layout, components
assets/js/site.js           theme toggle, nav, reveal, Spotify click-to-play
assets/fonts/               self-hosted Instrument Serif and IBM Plex (SIL Open Font License)
assets/img/                 photos and screenshots (WebP), og.jpg for link previews
```

## Editing

- Facts, sources and decisions live in the private `digital-twin` repo
  (`evidence/claims.json`, `evidence/unresolved-items.md`). Change the facts there first.
- Every claim on the site comes from a sourced claim there. No unverified numbers.
- Spotify players load only when a visitor presses play.
- Before pushing, run `npm run check:site` in `digital-twin`. It checks this folder for broken
  internal links, missing images or alt text, and anything marked private in the knowledge base.
