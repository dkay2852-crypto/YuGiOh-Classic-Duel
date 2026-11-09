# Classic Duel

A classic Yu-Gi-Oh! duel for personal use — single `index.html`, built for iPhone portrait and GitHub Pages.

## Play

Open the [GitHub Pages site](https://dkay2852-crypto.github.io/YuGiOh-Classic-Duel/) (after Pages is enabled), or open `index.html` locally. Card art loads from the network. An embedded card list lets a duel start if the [YGOPRODeck API](https://db.ygoprodeck.com/api/v7/cardinfo.php) is unavailable; successful responses are cached in `localStorage`.

The page pins itself to the visible viewport (`visualViewport` / `100dvh`, with safe-area insets) so the menu, hand, and action buttons stay on screen in Safari with the address bar showing.

## Rules

Pick **Classic** or **Duelist Kingdom** on the main menu before Free Duel. A new tournament run asks again, and Continue keeps the choice with that run. The island title shows which set is active.

- **Classic:** 8000 LP. Level 5–6 needs 1 tribute; Level 7+ needs 2. Egyptian Gods need 3. The very first turn cannot attack. Polymerization can use monsters from your hand or the field. A tournament arena still shows its field, without the bonus.
- **Duelist Kingdom:** 2000 LP, no tributes. The field gives matching Types +30% ATK and DEF. The first player may attack. Polymerization uses monsters on the field only.

Turns go Draw → Main 1 → Battle → Main 2 → End. The first player does not draw. A trap cannot be activated the turn it was Set. In your Main Phase, Change Position switches a face-up monster between Attack and Defense, or Flip Summons a face-down Defense monster to Attack. Once per monster each turn, not the turn it was summoned or Set, and not after it attacked. Gravity Bind, while face-up, stops Level 4 or higher monsters from declaring an attack.

## Decks

Free Duel opens a picker: **Yugi**, **Kaiba**, **Joey**, or **Custom Deck**. Each duelist deck is 40 cards from the Duelist Kingdom era (LOB, MRD, SRL, and similar). The opponent is a random one of the other two, and their name is shown on the life-point bar. A short VS screen shows both aces before the duel.

**Custom Deck** opens a builder that lists only cards you own. A new game, and Reset Progress, starts you with two copies of 20 commons — enough for one legal 40-card deck. You cannot add a card you do not own, and you cannot pass 3 copies or the number you own. Preset Yugi, Kaiba, and Joey decks stay playable and do not pour their cards into the collection. Search by name and filter by Monster/Spell/Trap, Attribute, Type, and Level, or look at the Main and Extra lists. **Auto-Build** fills the strongest legal 40-card deck from cards you own, plus Fusion Monsters in the Extra Deck when you have them. **Binder** in the builder opens your collection. Tap a card to view it and add or remove copies.

**Card Binder** on the main menu shows every card in the classic pool, grouped by Legend of Blue Eyes, Metal Raiders, Magic Ruler, Pharaoh's Servant, Labyrinth of Nightmare, and Spell Ruler, plus Exodia, the Egyptian Gods, and the other classic cards. Owned cards show their art and count. Missing cards are a dark silhouette. Each set, and the whole binder, shows a completion percent. Tap a card for its text.

The first time a card enters the collection — a booster, Grandpa's shop, an ante, or another reward — the reveal shows a **NEW** badge and a glow. The binder keeps **NEW** on that card until you tap it. A green count on Card Binder is how many of those you have not opened. Cards already in a save are treated as seen. The starter pile is seen from the start. Seen cards are stored with the collection (`classicDuel_collection_v1`).

A legal deck has a 40–60 card Main Deck, at most 3 copies of any card, and an Extra Deck of Fusion Monsters (max 15). The counter turns red when a deck is short, over, or over a copy limit, and Duel stays disabled until it is legal. Up to 8 named decks are saved in `localStorage` (`classicDuel_customDecks_v1`). An older save — a decks list, or one deck object — is migrated in place and keeps its cards. You can edit, rename, copy, or delete them. New Deck starts empty. Pick which deck to use before a free duel, before a tournament run, before a rematch, or from Deck on the island for the next duel in a run. The opponent for a custom deck is Yugi, Kaiba, or Joey at random.

On the deck screen for a free duel or a rematch, **Shadow Game** can be turned on. The island and the Rematch list have the same switch. A warning explains the stake before the duel starts. The opponent plays harder — more traps and spells, and sharper attacks — and the field turns dark purple. A win pays double Duel Points. If you have a spare collection card, both sides put one up and the winner takes it. A loss forfeits yours. Preset decks are never edited, and a saved deck keeps the copies it needs. With no spare card, a loss costs 80 Duel Points instead of a card. Shadow wins count toward the Shadow Game Winner title.

The **Forbidden/Limited** switch is off by default. Turn it on to enforce the official TCG list (Forbidden 0, Limited 1, Semi-Limited 2). Cards on that list stay marked either way. The page refreshes the list from YGOPRODeck when it can; `classic-pool.js` holds a snapshot so the builder still works offline.

## Daily Puzzle

**Daily Puzzle** on the main menu opens one board for the local date. Fourteen handcrafted puzzles rotate with that date. Each one names its rules, Classic or Duelist Kingdom, and starts mid-duel: monsters, Spells, Traps, Life Points, and hands are already set. Win that turn. Ending the turn, or hitting 0 Life Points, fails it. **Hint** and **Retry** sit above the field. The first solve of a day pays 40 Duel Points. Solving on back-to-back days raises a streak, saved on this device (`classicDuel_puzzle_v1`). Reset Progress clears the streak.

## Weekly challenges

**Challenges** on the main menu shows 3 to 5 goals for the local calendar week. The same week always draws the same set. The next week replaces them. Goals include winning under Duelist Kingdom rules, winning without a monster being destroyed (a Tribute is not a loss), Tribute Summoning, winning with a deck of cards you own, and similar duels. Each row has a progress bar. Duel Points, and sometimes a pack, pay once per goal per week. Finish every goal in a week to build a streak. Two finished weeks in a row unlock the Weekly Streak title. Stored in `classicDuel_challenges_v1`. An older save with no challenge data starts at the current week. Reset Progress clears the streak.

## Trading

**Trade** opens after you have beaten a duelist. Pick one. They offer a few cards from their deck, and those offers change the next calendar day. You give one spare card from your collection. Preset Yugi, Kaiba, and Joey decks are never edited, and a copy any saved deck still needs cannot be traded. The trade goes through when the two cards are close in rarity and ATK or DEF. A card you did not own arrives in the binder with a NEW tag. Three trades unlock the Trader title. The day's offers and your trade count are stored in `classicDuel_trade_v1`. Reset Progress clears them and leaves your name.

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

## Battle City

Beating Pegasus unlocks **Battle City** on the main menu. The night skyline can still be chosen in Settings after that win. Before it, the button stays locked.

The first visit opens a short rules screen. Those rules apply only to duels started from the Domino City map:

- 4000 Life Points
- Level 5–6 needs 1 tribute, Level 7 or higher needs 2, and Egyptian Gods need 3
- The first player does not draw, and neither duelist can attack on that turn
- Polymerization can use monsters in the hand or on the field
- A Fusion Monster cannot attack the turn it is summoned
- Duelist Kingdom's arena bonus does not apply

The map is Domino at night: Clock Tower, KaibaCorp, Domino Park, Domino Pier, the Industrial Quarter, and Shopping Street, with the KaibaCorp blimp in the sky. You start at the Clock Tower. Tap a neighboring district to walk the street. Tap the district you are standing in to duel the duelist who holds it.

Each district has one featured duelist, with a classic-era deck, a short line before the duel, and another after:

- Clock Tower — Joey. Warriors, Time Wizard, and Red-Eyes. He antes Red-Eyes Black Dragon.
- KaibaCorp — Kaiba. Blue-Eyes. The hardest street duel. He antes a Blue-Eyes White Dragon.
- Domino Park — Mai. Harpies. She antes Harpie's Feather Duster. Bonz is in the park graves, with zombies, and he does not hold a locator card.
- Domino Pier — Mako. The ocean, Umi, and The Legendary Fisherman.
- Industrial Quarter — a street thug running Keith's machines. He antes Barrel Dragon.
- Shopping Street — Esper Roba. Jinzo and his psychic act. He antes Jinzo.

The first win against that district's featured duelist earns its locator card. Beating Bonz, a rematch, or a Rare Hunter does not. The count is on the map and on your profile (`locators` in `classicDuel_profile_v1`). Where you are standing, whether you have read the rules, the deck you picked, and how long it has been since a Rare Hunter appeared are stored in `classicDuel_battlecity_v1`. An older save with none of that starts at the Clock Tower with zero locator cards. Six cards light the blimp. The finals themselves stay locked: "Finals coming soon."

**Ante.** Before every street duel you see both cards and confirm. The winner takes the loser's rarest card that can leave your collection. The opponent puts up the signature card above. A loss removes your card from the collection, so the deck builder can no longer use that copy. Preset Yugi, Kaiba, and Joey decks are never edited. A copy any saved deck still needs is left alone, and so is the deck you picked for the city. You are never left with fewer than 40 cards. If nothing can be wagered, the stake is Duel Points instead (more, against a Rare Hunter).

**Rare Hunters.** Walking the streets sometimes brings a hooded Ghoul. One burns with direct damage and Cannon Soldier. Seeker plays Exodia: the five pieces are Ghoul copies, Backup Soldier can pull the limbs back, and they still win the duel if all five meet in his hand. They wager a rarer card (Change of Heart, or Exodia the Forbidden One) and pay more Duel Points. Their lines name Marik. Marik himself is not in this part.

Free Duel, the tournament, puzzles, rematches, trades, and Shadow Game keep their own rules. Reset Progress clears locator cards and the city deck. Your name and portrait stay.

## Main menu

The menu is one screen. Duel Points and the current run's Star Chips sit in the top corners. Before Pegasus is beaten, the background is his castle. After that win, it switches to the Battle City night skyline: the KaibaCorp blimp sits in the open sky above the buttons, and the lit towers show through the translucent menu. Both menus use that same layout, so the picture stays visible behind the buttons. Settings can switch the picture back to the castle. Battle City on the menu stays locked until Pegasus is beaten, then opens the Domino City map. Animations Off stops the glow. Card art for the duel intros is stored in `art/`.

**Profile** on the main menu is your duelist: a portrait, a name, and the record (wins, losses, win rate, tournaments cleared, cards and set completion, foils, best puzzle streak, Shadow Game wins, trades, the weekly challenge streak, and locator cards). Titles unlock from that record — Duelist Kingdom Champion and Pegasus Slayer from beating Pegasus, Foil Collector, Puzzle Master, Deck Master, Rematch King, Shadow Game Winner, Trader, Weekly Streak, Battle City Finalist from 6 locator cards, and others. A toast names a title when it unlocks. The one you equip shows on the profile and on the VS screen. An older save counts duelists you already beat, a cleared tournament, foils you own, a saved deck, and the puzzle streak. New title counts start at zero until you earn them. The name and portrait stay if you reset progress. Stored in `classicDuel_profile_v1`.

Settings has Mute, a music slider, and a sound-effects slider. The menu, a normal duel, and a Pegasus duel each loop an original piece made in the browser. Nothing plays until the first tap, so iPhone can start the audio.

A VS intro plays before each free duel and tournament duel. Both names slam in over their ace art, with the opponent's line underneath. It moves on after about two seconds, or when you tap. Settings → Cinematics turns that intro off, and the summon flashes too. Animations Off and reduced motion do the same.

Blue-Eyes White Dragon, Dark Magician, and Red-Eyes Black Dragon play a short art flash when either side summons them. Completing Exodia does too. Tap to skip.

During a duel the mat uses that opponent's arena: Yugi's Duelist Kingdom grounds, KaibaCorp at night, Joey's dusk street, Weevil's forest, Rex's wasteland, Mai's mountain, Keith's fortress, Panik's shadow, and Pegasus's castle. A dim overlay keeps the cards readable. Other opponents use the plain green field.

Packs and Grandpa's daily deal can pull a foil copy: Super Rare (silver sheen), Ultra Rare (gold name and a holo sweep), or Secret Rare (a rainbow shimmer). Secret is the rarest. The binder shows which foil versions you own, and each set's completion line counts those foils. A foil and a normal copy both count as that card when you build a deck. Foils also shine in the pack reveal, the deck builder, your hand, and on the field. Older saves keep their cards; foils start at zero until you pull one.

## Grandpa's shop

Each pack has **Buy 1**, **Buy 5**, and **Buy 10**. The buttons stay off when you do not have the Duel Points. Buying more than one pack opens a single grid of every card, with NEW and foil badges. Reveal all flips the grid. Skip leaves the cards in the collection and goes back. A **daily deal** sells one classic card at a discount. The card is chosen from the local date, so the same day offers the same card. **Sell** pays Duel Points for a spare copy. A copy that any saved deck still uses cannot be sold, and the shop asks before a card leaves.

## Deploy

GitHub Pages deploys from the `main` branch, `/` (root).
