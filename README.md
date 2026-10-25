# Classic Duel

A classic Yu-Gi-Oh! duel for personal use — single `index.html`, built for iPhone portrait and GitHub Pages.

## Play

Open the [GitHub Pages site](https://dkay2852-crypto.github.io/YuGiOh-Classic-Duel/) (after Pages is enabled), or open `index.html` locally. Card art loads from the network. An embedded card list lets a duel start if the [YGOPRODeck API](https://db.ygoprodeck.com/api/v7/cardinfo.php) is unavailable; successful responses are cached in `localStorage`.

The page pins itself to the visible viewport (`visualViewport` / `100dvh`, with safe-area insets) so the menu, hand, and action buttons stay on screen in Safari with the address bar showing.

## Rules

Pick **Classic** or **Duelist Kingdom** on the main menu before Free Duel. Tournament always uses Duelist Kingdom rules.

- **Classic:** 8000 LP. Level 5–6 needs 1 tribute; Level 7+ needs 2. Polymerization can use monsters from your hand or the field.
- **Duelist Kingdom:** 2000 LP, no tributes. A random field spell gives matching Types +30% ATK and DEF. Polymerization uses monsters on the field only.

Turns go Draw → Main 1 → Battle → Main 2 → End. The first player does not draw. A trap cannot be activated the turn it was Set.

## Decks

Free Duel opens a picker: **Yugi**, **Kaiba**, **Joey**, or **Custom Deck**. Each duelist deck is 40 cards from the Duelist Kingdom era (LOB, MRD, SRL, and similar). The opponent is a random one of the other two, and their name is shown on the life-point bar. A short VS screen shows both aces before the duel.

**Custom Deck** opens a builder for the classic card pool (Legend of Blue Eyes White Dragon, Metal Raiders, Magic Ruler, Spell Ruler, Pharaoh's Servant, and Labyrinth of Nightmare, plus the few starter-deck cards used by Yugi, Kaiba, and Joey). Search by name and filter by Monster/Spell/Trap, Attribute, Type, and Level. Tap a card to view it and add or remove copies.

A legal deck has a 40–60 card Main Deck, at most 3 copies of any card, and an Extra Deck of Fusion Monsters (max 15). The counter turns red when a deck is short, over, or over a copy limit, and Duel stays disabled until it is legal. Up to 3 named decks are saved in `localStorage`. You can edit, copy, or delete them, or start from a copy of Yugi, Kaiba, or Joey. The opponent for a custom deck is Yugi, Kaiba, or Joey at random.

The **Forbidden/Limited** switch is off by default. Turn it on to enforce the official TCG list (Forbidden 0, Limited 1, Semi-Limited 2). Cards on that list stay marked either way. The page refreshes the list from YGOPRODeck when it can; `classic-pool.js` holds a snapshot so the builder still works offline.

## Tournament

**Tournament** on the main menu is a Duelist Kingdom run. **Free Duel** is unchanged, including the Classic / Duelist Kingdom toggle and the deck builder.

You pick Yugi, Kaiba, Joey, or a saved legal custom deck. The island is one screen: Weevil Underwood, Rex Raptor, Mai Valentine, Bandit Keith, Panik, then a rival, then Pegasus at the castle. The rival is Kaiba, unless you are playing Kaiba, in which case it is Yugi. You can rematch anyone you have already beaten. The next new duelist stays locked until you win the one before them.

You start with 2 Star Chips. Beating a duelist takes their chips: Weevil 1, Rex 1, Mai 1, Keith 2, Panik 1, rival 2. That is 8, so winning each once reaches exactly 10 and opens the castle. A loss costs 1 Star Chip. At 0 the run is over. Pegasus does not give chips; beating him wins the tournament. The castle stays open after you earn it. Progress is stored in `localStorage` (`classicDuel_tournament_v1`). **Continue** resumes a run. **Retire** erases it.

Tournament duels use Duelist Kingdom rules (2000 LP, no tributes, fuse from the field) and a fixed field:

- Weevil — Forest
- Rex — Wasteland
- Mai — Mountain
- Keith — Fortress (Machine +30%)
- Panik — Yami
- Kaiba or Joey — Mountain; Yugi — Yami
- Pegasus — Yami

Each opponent has a 40-card deck of classic cards and a short taunt on the VS screen. Signature plays in this game:

- Weevil equips Cocoon of Evolution to Petit Moth. The next turn it can become Larvae Moth; the turn after that, Great Moth. Insect Barrier stops opposing Insect attacks. Laser Cannon Armor equips to Insects.
- Rex plays Two-Headed King Rex, Sword Arm of Dragon, and Megazowler.
- Mai plays Harpie Lady, Cyber Harpie Lady (its name is Harpie Lady), Elegant Egotist, Harpie Lady Sisters, and Harpie's Feather Duster.
- Keith plays Barrel Dragon (3 coins, 2 heads destroys), Slot Machine, Launcher Spider, and Robotic Knight. 7 Completed and Machine Conversion Factory equip to Machines.
- Panik sets Castle of Dark Illusions. While face-up it gives every Fiend +200 ATK/DEF, plus another 200 on each of his later turns, up to +1000. Malevolent Nuzzler is a +700 ATK equip.
- Pegasus pays 1000 LP for Toon World, Toon Summons without tributes, and pays 500 LP for each Toon attack. Toons attack directly unless you control a Toon, and they are destroyed if Toon World leaves the field. Black Illusion Ritual tributes a Level 1+ monster to summon Relinquished. Polymerization fuses Relinquished and Thousand-Eyes Idol into Thousand-Eyes Restrict. Relinquished and Thousand-Eyes Restrict can absorb an opponent's monster and copy its ATK/DEF. While Thousand-Eyes Restrict is face-up, other monsters cannot attack or change position.

Fusion monsters live in the Extra Deck (tap Extra during the duel):

- Yugi: Gaia The Fierce Knight + Curse of Dragon = Gaia the Dragon Champion
- Kaiba: 3× Blue-Eyes White Dragon = Blue-Eyes Ultimate Dragon; Battle Ox + Mystic Horseman = Rabid Horseman
- Joey: Flame Manipulator + Masaki the Legendary Swordsman = Flame Swordsman; Time Wizard + Baby Dragon = Thousand Dragon (also via Time Wizard’s coin flip)

Equip spells in these decks: Legendary Sword (Warrior), Book of Secret Arts (Spellcaster), Dragon Treasure (Dragon), Black Pendant (any monster, 500 damage when it leaves the field), Horn of the Unicorn (any monster, returns to the top of the deck).

Other effects used by the decks include Dark Hole, Raigeki, Monster Reborn, Pot of Greed, Fissure, Change of Heart, Trap Hole, Mirror Force, Swords of Revealing Light, Shield & Sword, Magical Hats, Kuriboh, and Panther Warrior’s attack tribute.

## Deploy

GitHub Pages deploys from the `main` branch, `/` (root).
