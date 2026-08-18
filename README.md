# Folkify 😭

Upload an image. It gets the word **Folk** and a randomly chosen pile of extremely
weird emojis slapped onto it. That's the whole app.

Based on the [Folk 😭](https://knowyourmeme.com/memes/folk-%F0%9F%98%AD) meme.

## What it does

- Drop, browse, or paste an image (nothing is uploaded — it all runs in your browser)
- Picks one of six layouts at random each roll:
  - **bottom band** — Folk over one or more rows of emojis along the bottom
  - **top banner** — a solid banner with Folk and an emoji row inside it
  - **emoji wall** — the whole image tiled with emojis, Folk huge on top
  - **sticker chaos** — emojis flung everywhere at random sizes and angles
  - **sandwich** — emoji rows top and bottom, Folk in the middle
  - **halo** — a ring of emojis orbiting Folk
- Emojis are ~1/3 😭 and ~2/3 whatever cursed thing the pool coughs up
  (🫀 🪱 🚽 🩻 🪳 🏺 🧌 …)
- `RE-ROLL 🎲` (or the spacebar) reshuffles the layout, the emojis, and the
  casing of the word
- Two sliders: emoji infestation and Folk size. Both re-render the *same* roll,
  so you can tune without losing the one you liked
- Download as PNG or copy straight to the clipboard

## Running it locally

It's three static files, no build step:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying to GitHub Pages

`.github/workflows/pages.yml` publishes the repo root to Pages on every push
to `main`.

It needs Pages pointed at Actions once, by hand — a workflow's `GITHUB_TOKEN`
is not allowed to create a Pages site itself:
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

After that, re-run the workflow (Actions → Deploy to GitHub Pages → Re-run
jobs) and the site goes live at `https://<user>.github.io/folkify/`.

## Files

| File | What's in it |
| --- | --- |
| `index.html` | Markup |
| `styles.css` | Styling |
| `app.js` | Emoji pools, layout presets, canvas rendering |
