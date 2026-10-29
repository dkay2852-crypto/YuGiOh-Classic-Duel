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

**Custom Deck** opens a builder that lists only cards you own. A new game, and Reset Progress, starts you with two copies of 20 commons — enough for one legal 40-card deck. You cannot add a card you do not own, and you cannot pass 3 copies or the number you own. Preset Yugi, Kaiba, and Joey decks stay playable and do not pour their cards into the collection. Search by name and filter by Monster/Spell/Trap, Attribute, Type, and Level, or look at the Main and Extra lists. **Auto-Build** fills the strongest legal 40-card deck from cards you own, plus Fusion Monsters in the Extra Deck when you have them. **Binder** in the builder opens your collection. Tap a card to view it and add or remove copies.

**Card Binder** on the main menu shows every card in the classic pool, grouped by Legend of Blue Eyes, Metal Raiders, Magic Ruler, Pharaoh's Servant, Labyrinth of Nightmare, and Spell Ruler, plus Exodia, the Egyptian Gods, and the other classic cards. Owned cards show their art and count. Missing cards are a dark silhouette. Each set, and the whole binder, shows a completion percent. Tap a card for its text.

The first time a card enters the collection — a booster, Grandpa's shop, an ante, or another reward — the reveal shows a **NEW** badge and a glow. The binder keeps **NEW** on that card until you tap it. A green count on Card Binder is how many of those you have not opened. Cards already in a save are treated as seen. The starter pile is seen from the start. Seen cards are stored with the collection (`classicDuel_collection_v1`).

A legal deck has a 40–60 card Main Deck, at most 3 copies of any card, and an Extra Deck of Fusion Monsters (max 15). The counter turns red when a deck is short, over, or over a copy limit, and Duel stays disabled until it is legal. Up to 8 named decks are saved in `localStorage` (`classicDuel_customDecks_v1`). An older save — a decks list, or one deck object — is migrated in place and keeps its cards. You can edit, rename, copy, or delete them. New Deck starts empty. Pick which deck to use before a free duel, before a tournament run, before a rematch, or from Deck on the island for the next duel in a run. The opponent for a custom deck is Yugi, Kaiba, or Joey at random.

The **Forbidden/Limited** switch is off by default. Turn it on to enforce the official TCG list (Forbidden 0, Limited 1, Semi-Limited 2). Cards on that list stay marked either way. The page refreshes the list from YGOPRODeck when it can; `classic-pool.js` holds a snapshot so the builder still works offline.

## Daily Puzzle

**Daily Puzzle** on the main menu opens one board for the local date. Fourteen handcrafted puzzles rotate with that date. Each one names its rules, Classic or Duelist Kingdom, and starts mid-duel: monsters, Spells, Traps, Life Points, and hands are already set. Win that turn. Ending the turn, or hitting 0 Life Points, fails it. **Hint** and **Retry** sit above the field. The first solve of a day pays 40 Duel Points. Solving on back-to-back days raises a streak, saved on this device (`classicDuel_puzzle_v1`). Reset Progress clears the streak.

## Tournament

**Tournament** on the main menu starts a run. Choose **Classic** or **Duelist Kingdom** on the deck screen before you pick Yugi, Kaiba, Joey, or a saved legal custom deck. That choice is stored on the run. **Free Duel** still uses the main-menu toggle. **Continue** resumes a run under the rules it was started with. The island title is Classic Rules or Duelist Kingdom, with the Life Point total under it.

The island is one screen: Weevil Underwood, Rex Raptor, Mai Valentine, Bandit Keith, Panik, then a rival, then Pegasus at the castle. The rival is Kaiba, unless you are playing Kaiba, in which case it is Yugi. You can rematch anyone you have already beaten. The next new duelist stays locked until you win the one before them.

You start with 2 Star Chips. Beating a duelist the first time takes their chips: Weevil 1, Rex 1, Mai 1, Keith 2, Panik 1, rival 2. That is 8, so winning each once reaches exactly 10 and opens the castle. The island shows how many chips you still need for Pegasus. A loss costs 1 Star Chip. At 0 the run is over. Pegasus does not give chips; beating him wins the tournament. The castle stays open after you earn it. Progress is stored in `localStorage` (`classicDuel_tournament_v1`). **Retire** erases the run and leaves your card collection.

If every duelist on the path is beaten and you still have fewer than 10 Star Chips, island rematches of those duelists pay their chips again (the same wager as the first win). A loss in that rematch still costs 1 Star Chip, and 0 still ends the run. Other rematches do not move chips.

**Rematch** is available from a beaten duelist on the island, and from **Rematch** on the main menu after the run. The return fight uses a tighter deck and sharper plays. A win pays more Duel Points than the first duel and the reward pack is more likely to contain a rare.

**Ante** is off unless you turn it on in Settings. Before each tournament duel, both sides put up one card. Yours is a spare card from your collection: preset Yugi, Kaiba, and Joey decks are never edited, and the last copy a saved deck needs is left alone. The winner takes the loser's card. The antes show before the duel, and the result shows after. A card you did not own before is marked NEW.

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

## Main menu

The menu is one screen. Duel Points and the current run's Star Chips sit in the top corners. Before Pegasus is beaten, the background is his castle on a misty island. After that win, it switches to the Battle City night skyline: the KaibaCorp blimp sits in the open sky above the buttons, and the lit towers show through the translucent menu. Settings can switch back to the castle; Battle City stays locked until Pegasus is beaten. Animations Off stops the fog, sparkles, lightning, and glow. Card art for the two aces is stored in `art/`.

A VS intro plays before each free duel and tournament duel. Both names slam in over their ace art, with the opponent's line underneath. It moves on after about two seconds, or when you tap. Settings → Cinematics turns that intro off, and the summon flashes too. Animations Off and reduced motion do the same.

Blue-Eyes White Dragon, Dark Magician, and Red-Eyes Black Dragon play a short art flash when either side summons them. Completing Exodia does too. Tap to skip.

During a duel the mat uses that opponent's arena: Yugi's Duelist Kingdom grounds, KaibaCorp at night, Joey's dusk street, Weevil's forest, Rex's wasteland, Mai's mountain, Keith's fortress, Panik's shadow, and Pegasus's castle. A dim overlay keeps the cards readable. Other opponents use the plain green field.

Packs and Grandpa's daily deal can pull a foil copy: Super Rare (silver sheen), Ultra Rare (gold name and a holo sweep), or Secret Rare (a rainbow shimmer). Secret is the rarest. The binder shows which foil versions you own, and each set's completion line counts those foils. A foil and a normal copy both count as that card when you build a deck. Foils also shine in the pack reveal, the deck builder, your hand, and on the field. Older saves keep their cards; foils start at zero until you pull one.

## Grandpa's shop

Packs are unchanged. A **daily deal** sells one classic card at a discount. The card is chosen from the local date, so the same day offers the same card. **Sell** pays Duel Points for a spare copy. A copy that any saved deck still uses cannot be sold, and the shop asks before a card leaves.

## Deploy

GitHub Pages deploys from the `main` branch, `/` (root).
