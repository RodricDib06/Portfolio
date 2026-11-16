# Rodric Dib — Portfolio

Live at **https://rodricdib06.github.io/Portfolio/**

A hand-coded, dependency-free portfolio: plain HTML, CSS, and vanilla JavaScript, with no framework and no build step.

## What's on the page

- **Live order book** — a JavaScript miniature of my [C++ matching engine](https://github.com/RodricDib06/limit-order-book): price-time priority, integer-tick prices, pre-trade risk checks, mark-to-market P&L, and a kill switch you can trip yourself.
- **Agent pipeline run** — an animated walk through the LangGraph state machine behind [AutonomousSDR](https://github.com/RodricDib06/autonomous-sdr), using sample data.
- **Skill inspector** — select any skill to see the projects and roles where it shipped.
- **Command menu** — press `⌘K` / `Ctrl K` to jump around, open repos, or copy my email.
- Light and dark themes, responsive down to phone widths, and reduced-motion support.

## Structure

```
index.html     markup and content
styles.css     design tokens, layout, components
main.js        order book engine, pipeline demo, interactions
assets/        images
```

## Run locally

```bash
python3 -m http.server 4173
```

The previous version of this site is kept on the `legacy-2025` branch.
