# Classic Duel

A classic Yu-Gi-Oh! duel for personal use — single `index.html`, built for iPhone portrait and GitHub Pages.

## Play

Open the [GitHub Pages site](https://dkay2852-crypto.github.io/YuGiOh-Classic-Duel/) (after Pages is enabled), or open `index.html` locally with a network connection for card data.

## Phase 1

- Duel a simple computer opponent
- **Classic** rules (8000 LP, tributes) or **Duelist Kingdom** (2000 LP, no tributes, field bonuses)
- Draw → Main 1 → Battle → Main 2 → End
- Working cards: Dark Hole, Raigeki, Monster Reborn, Pot of Greed, Trap Hole, Mirror Force, Fissure, Change of Heart
- Card text/images from the [YGOPRODeck API](https://db.ygoprodeck.com/api/v7/cardinfo.php), cached in `localStorage`

## Deploy

GitHub Pages is set to deploy from the `main` branch, `/` (root).
