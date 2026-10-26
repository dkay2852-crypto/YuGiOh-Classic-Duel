# Classic Duel

A classic Yu-Gi-Oh! duel for personal use — single `index.html`, built for iPhone portrait and GitHub Pages.

## Play

Open the [GitHub Pages site](https://dkay2852-crypto.github.io/YuGiOh-Classic-Duel/) (after Pages is enabled), or open `index.html` locally. Card art loads from the network. An embedded card list lets a duel start if the [YGOPRODeck API](https://db.ygoprodeck.com/api/v7/cardinfo.php) is unavailable; successful responses are cached in `localStorage`.

The page pins itself to the visible viewport (`visualViewport` / `100dvh`, with safe-area insets) so the menu, hand, and action buttons stay on screen in Safari with the address bar showing.

## Rules

Pick **Classic** or **Duelist Kingdom** on the main menu before Free Duel. A new tournament run asks again, and Continue keeps the choice with that run. The island title shows which set is active.

- **Classic:** 8000 LP. Level 5–6 needs 1 tribute; Level 7+ needs 2. Egyptian Gods need 3. The very first turn cannot attack. Polymerization can use monsters from your hand or the field. A tournament arena still shows its field, without the bonus.
- **Duelist Kingdom:** 2000 LP, no tributes. The field gives matching Types +30% ATK and DEF. The first player may attack. Polymerization uses monsters on the field only.

Turns go Draw → Main 1 → Battle → Main 2 → End. The first player does not draw. A trap cannot be activated the turn it was Set.

## Decks

Free Duel opens a picker: **Yugi**, **Kaiba**, **Joey**, or **Custom Deck**. Each duelist deck is 40 cards from the Duelist Kingdom era (LOB, MRD, SRL, and similar). The opponent is a random one of the other two, and their name is shown on the life-point bar. A short VS screen shows both aces before the duel.

**Custom Deck** opens a builder for the classic card pool (Legend of Blue Eyes White Dragon, Metal Raiders, Magic Ruler, Spell Ruler, Pharaoh's Servant, and Labyrinth of Nightmare, plus the few starter-deck cards used by Yugi, Kaiba, and Joey). Each card shows how many copies you own. You can add only cards in your collection. Search by name and filter by Monster/Spell/Trap, Attribute, Type, and Level, or switch the list to Owned. Tap a card to view it and add or remove copies.

A legal deck has a 40–60 card Main Deck, at most 3 copies of any card, and an Extra Deck of Fusion Monsters (max 15). The counter turns red when a deck is short, over, or over a copy limit, and Duel stays disabled until it is legal. Up to 3 named decks are saved in `localStorage`. You can edit, copy, or delete them, or start from a copy of Yugi, Kaiba, or Joey. The opponent for a custom deck is Yugi, Kaiba, or Joey at random.

The **Forbidden/Limited** switch is off by default. Turn it on to enforce the official TCG list (Forbidden 0, Limited 1, Semi-Limited 2). Cards on that list stay marked either way. The page refreshes the list from YGOPRODeck when it can; `classic-pool.js` holds a snapshot so the builder still works offline.

## Tournament

**Tournament** on the main menu starts a run. Choose **Classic** or **Duelist Kingdom** on the deck screen before you pick Yugi, Kaiba, Joey, or a saved legal custom deck. That choice is stored on the run. **Free Duel** still uses the main-menu toggle. **Continue** resumes a run under the rules it was started with. The island title is Classic Rules or Duelist Kingdom, with the Life Point total under it.

The island is one screen: Weevil Underwood, Rex Raptor, Mai Valentine, Bandit Keith, Panik, then a rival, then Pegasus at the castle. The rival is Kaiba, unless you are playing Kaiba, in which case it is Yugi. You can rematch anyone you have already beaten. The next new duelist stays locked until you win the one before them.

You start with 2 Star Chips. Beating a duelist takes their chips: Weevil 1, Rex 1, Mai 1, Keith 2, Panik 1, rival 2. That is 8, so winning each once reaches exactly 10 and opens the castle. A loss costs 1 Star Chip. At 0 the run is over. Pegasus does not give chips; beating him wins the tournament. The castle stays open after you earn it. Progress is stored in `localStorage` (`classicDuel_tournament_v1`). **Retire** erases the run and leaves your card collection.

Every win opens a 5-card booster themed to that duelist's set. Commons come from the set, and the last card is often one of their signature cards. Pulled cards are saved in `localStorage` (`classicDuel_collection_v1`).

- Weevil — Legend of Blue Eyes White Dragon
- Rex — Metal Raiders
- Mai — Magic Ruler
- Keith — Pharaoh's Servant
- Panik — Labyrinth of Nightmare
- Rival — Legend of Blue Eyes White Dragon
- Pegasus — Spell Ruler

Beating Pegasus the first time also unlocks the five Exodia pieces and Slifer, Obelisk, and Ra. A celebration screen shows them, then his pack opens. Holding all five Exodia pieces in your hand wins the duel in either rule set. In Classic rules each God needs 3 tributes. In Duelist Kingdom they need none, like every other monster. Slifer's ATK and DEF are 1000 times the cards in your hand, and it punishes a monster summoned in front of it. Obelisk is 4000/4000 and can tribute 2 monsters to destroy the opponent's board, but it cannot attack that turn. Ra's ATK and DEF become the Life Points you pay when it is summoned. Gods are unaffected by Spells and Traps. Later packs can pull extra copies as a Secret Rare.

Tournament duels keep each arena's field in both rule sets. The +30% bonus applies only in Duelist Kingdom:

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
- Pegasus pays 1000 LP for Toon World and 500 LP for each Toon attack. In Duelist Kingdom a Toon needs no tribute. In Classic, Toon Mermaid needs none, Toon Summoned Skull needs 1, and the other Toons need 2. Toons attack directly unless you control a Toon, and they are destroyed if Toon World leaves the field. Black Illusion Ritual tributes a Level 1+ monster to summon Relinquished. Polymerization fuses Relinquished and Thousand-Eyes Idol into Thousand-Eyes Restrict. Relinquished and Thousand-Eyes Restrict can absorb an opponent's monster and copy its ATK/DEF. While Thousand-Eyes Restrict is face-up, other monsters cannot attack or change position.

Fusion monsters live in the Extra Deck (tap Extra during the duel):

- Yugi: Gaia The Fierce Knight + Curse of Dragon = Gaia the Dragon Champion
- Kaiba: 3× Blue-Eyes White Dragon = Blue-Eyes Ultimate Dragon; Battle Ox + Mystic Horseman = Rabid Horseman
- Joey: Flame Manipulator + Masaki the Legendary Swordsman = Flame Swordsman; Time Wizard + Baby Dragon = Thousand Dragon (also via Time Wizard’s coin flip)

Equip spells in these decks: Legendary Sword (Warrior), Book of Secret Arts (Spellcaster), Dragon Treasure (Dragon), Black Pendant (any monster, 500 damage when it leaves the field), Horn of the Unicorn (any monster, returns to the top of the deck).

Other effects used by the decks include Dark Hole, Raigeki, Monster Reborn, Pot of Greed, Fissure, Change of Heart, Trap Hole, Mirror Force, Swords of Revealing Light, Shield & Sword, Magical Hats, Kuriboh, and Panther Warrior’s attack tribute.

## Deploy

GitHub Pages deploys from the `main` branch, `/` (root).
