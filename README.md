# rishabh-raj-dev.github.io

Professional portfolio of Rishabh Raj, frontend and mobile engineer in fintech. No music content here.
The music lives on its own site (the shaanzayin repo).
Live at https://rishabh-raj-dev.github.io/

Plain static HTML, CSS and a little JavaScript. No build step, no framework, no trackers.
GitHub Pages serves this repository from `main`, root folder (`.nojekyll` turns off Jekyll).

## Layout

```
index.html                  home page (all sections)
projects/<slug>/index.html  case studies: mechamind, homepathy, habito
404.html                    not-found page
assets/css/site.css         design tokens (light + dark), layout, components
assets/js/site.js           theme toggle, nav, active section, reveal
assets/fonts/               self-hosted Newsreader and IBM Plex (SIL Open Font License)
assets/img/                 photos and screenshots (WebP), og.jpg for link previews
```

## Editing

- Facts, sources and decisions live in the private `digital-twin` repo
  (`evidence/claims.json`, `evidence/unresolved-items.md`). Change the facts there first.
- Every claim on the site comes from a sourced claim there. No unverified numbers.
- Type and palette follow curious-utkarsh.github.io (Newsreader + IBM Plex, ink-blue accent).
- Before pushing, run `npm run check:site` in `digital-twin`. It checks this folder for broken
  internal links, missing images or alt text, and anything marked private in the knowledge base.
