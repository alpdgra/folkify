# Folkify 😭

Upload an image. It gets the word **Folk** and a randomly chosen pile of extremely
weird emojis slapped onto it. That's the whole app.

Based on the [Folk 😭](https://knowyourmeme.com/memes/folk-%F0%9F%98%AD) meme.

## What it does

- Drop, browse, or paste an image (nothing is uploaded — it all runs in your browser)
- Lays out the meme the same way every time: the word **Folk**, then emojis
  running on from it and wrapping into full-width rows underneath. Placement is
  fixed — only the emojis themselves are random
- Four controls, all re-rendering the *same* roll so you can tune without
  losing the one you liked:
  - **Folk position** — top, middle, or bottom
  - **Folk size** — scales the word
  - **How many emojis** — from one up to however many fill the frame
  - **How random** — `pure 😭` at one end, `unhinged` at the other, with the
    cursed pool (🫀 🪱 🚽 🩻 🪳 🏺 🧌 …) mixed in as you turn it up
- `RE-ROLL 🎲` (or the spacebar) reshuffles which emojis get picked and the
  casing of the word
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
| `app.js` | Emoji pools, layout, canvas rendering |
