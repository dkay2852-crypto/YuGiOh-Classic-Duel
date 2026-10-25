# Classic Duel

A classic Yu-Gi-Oh! duel for personal use — single `index.html`, built for iPhone portrait and GitHub Pages.

## Play

Open the [GitHub Pages site](https://dkay2852-crypto.github.io/YuGiOh-Classic-Duel/) (after Pages is enabled), or open `index.html` locally. Card art loads from the network. An embedded card list lets a duel start if the [YGOPRODeck API](https://db.ygoprodeck.com/api/v7/cardinfo.php) is unavailable; successful responses are cached in `localStorage`.

The page pins itself to the visible viewport (`visualViewport` / `100dvh`, with safe-area insets) so the menu, hand, and action buttons stay on screen in Safari with the address bar showing.

## Rules

Pick **Classic** or **Duelist Kingdom** on the main menu before Start Duel.

- **Classic:** 8000 LP. Level 5–6 needs 1 tribute; Level 7+ needs 2. Polymerization can use monsters from your hand or the field.
- **Duelist Kingdom:** 2000 LP, no tributes. A random field spell gives matching Types +30% ATK and DEF. Polymerization uses monsters on the field only.

Turns go Draw → Main 1 → Battle → Main 2 → End. The first player does not draw. A trap cannot be activated the turn it was Set.

## Decks

Start Duel opens a picker: **Yugi**, **Kaiba**, **Joey**, or **Custom Deck**. Each duelist deck is 40 cards from the Duelist Kingdom era (LOB, MRD, SRL, and similar). The opponent is a random one of the other two, and their name is shown on the life-point bar. A short VS screen shows both aces before the duel.

**Custom Deck** opens a builder for the classic card pool (Legend of Blue Eyes White Dragon, Metal Raiders, Magic Ruler, Spell Ruler, Pharaoh's Servant, and Labyrinth of Nightmare, plus the few starter-deck cards used by Yugi, Kaiba, and Joey). Search by name and filter by Monster/Spell/Trap, Attribute, Type, and Level. Tap a card to view it and add or remove copies.

A legal deck has a 40–60 card Main Deck, at most 3 copies of any card, and an Extra Deck of Fusion Monsters (max 15). The counter turns red when a deck is short, over, or over a copy limit, and Duel stays disabled until it is legal. Up to 3 named decks are saved in `localStorage`. You can edit, copy, or delete them, or start from a copy of Yugi, Kaiba, or Joey. The opponent for a custom deck is Yugi, Kaiba, or Joey at random.

The **Forbidden/Limited** switch is off by default. Turn it on to enforce the official TCG list (Forbidden 0, Limited 1, Semi-Limited 2). Cards on that list stay marked either way. The page refreshes the list from YGOPRODeck when it can; `classic-pool.js` holds a snapshot so the builder still works offline.

Fusion monsters live in the Extra Deck (tap Extra during the duel):

- Yugi: Gaia The Fierce Knight + Curse of Dragon = Gaia the Dragon Champion
- Kaiba: 3× Blue-Eyes White Dragon = Blue-Eyes Ultimate Dragon; Battle Ox + Mystic Horseman = Rabid Horseman
- Joey: Flame Manipulator + Masaki the Legendary Swordsman = Flame Swordsman; Time Wizard + Baby Dragon = Thousand Dragon (also via Time Wizard’s coin flip)

Equip spells in these decks: Legendary Sword (Warrior), Book of Secret Arts (Spellcaster), Dragon Treasure (Dragon), Black Pendant (any monster, 500 damage when it leaves the field), Horn of the Unicorn (any monster, returns to the top of the deck).

Other effects used by the decks include Dark Hole, Raigeki, Monster Reborn, Pot of Greed, Fissure, Change of Heart, Trap Hole, Mirror Force, Swords of Revealing Light, Shield & Sword, Magical Hats, Kuriboh, and Panther Warrior’s attack tribute.

## Deploy

GitHub Pages deploys from the `main` branch, `/` (root).
