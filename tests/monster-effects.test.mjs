import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chrome = process.env.CHROME_PATH || "/usr/bin/google-chrome";

function serve() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const rel = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const file = path.normalize(path.join(root, rel));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      const body = await readFile(file);
      const type = file.endsWith(".js") ? "text/javascript" : "text/html";
      res.writeHead(200, { "content-type": type });
      res.end(body);
    } catch (err) {
      res.writeHead(404);
      res.end(String(err && err.message));
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function boot(browser, url) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err && err.stack || err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.setViewport({ width: 420, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.ClassicDuel && window.ClassicDuel.card("Sangan"));
  await page.evaluate(() => {
    window.__FAST = true;
    window.prepDuel = function (rules) {
      const filler = [];
      for (let i = 0; i < 24; i++) filler.push("Silver Fang");
      const names = [
        "Sangan", "Witch of the Black Forest", "Kuriboh", "Basic Insect", "Mystical Elf",
        "Celtic Guardian", "Beaver Warrior", "Dark Magician", "Giant Rat", "Curse of Dragon",
        "Man-Eater Bug", "Gemini Elf", "The Unhappy Maiden", "Shining Angel", "Revival Jam",
        "Big Eye", "Bombardment Beetle", "Jigen Bakudan", "Morphing Jar #2",
        "Invader of the Throne", "Parasite Paracide", "Summoner of Illusions", "Supply",
        "Gaia The Fierce Knight", "Polymerization", "Polymerization", "Insect Barrier",
        "Pot of Greed", "Raigeki", "Flame Manipulator", "Masaki the Legendary Swordsman",
        "Obelisk the Tormentor",
      ];
      window.ClassicDuel.begin(
        { id: "t", name: "You", main: names.concat(filler), extra: ["Gaia the Dragon Champion", "Flame Swordsman", "Thousand Dragon"] },
        "yugi",
        { rules: rules, field: "Fortress" }
      );
      ["menu", "vs", "decks"].forEach((id) => {
        const node = document.getElementById(id);
        if (!node) return;
        node.hidden = true;
        node.classList.remove("active");
      });
      const duel = document.getElementById("duel");
      duel.hidden = false;
      duel.classList.add("active");
      const st = window.ClassicDuel.getState();
      st.firstTurn = false;
      st.turnCount = 4;
      st.phase = "battle";
      st.turn = "player";
      st.busy = false;
      st.prompt = false;
      st.battleOver = false;
      st.field = rules === "dk" ? "Fortress" : null;
      st.player.monsters.fill(null);
      st.ai.monsters.fill(null);
      st.player.spells.fill(null);
      st.ai.spells.fill(null);
      window.trash = [];
      window.duel = st;
    };
    window.grab = function (name) {
      const sides = [window.duel.player, window.duel.ai];
      for (let s = 0; s < sides.length; s++) {
        const p = sides[s];
        const piles = [p.hand, p.deck, p.gy];
        for (let n = 0; n < piles.length; n++) {
          const i = piles[n].findIndex((c) => c && c.name === name);
          if (i >= 0) return piles[n].splice(i, 1)[0];
        }
        for (let i = 0; i < p.monsters.length; i++) {
          if (p.monsters[i] && p.monsters[i].name === name) {
            const c = p.monsters[i];
            p.monsters[i] = null;
            return { uid: c.uid, name: c.name, ref: c.ref };
          }
        }
      }
      const trash = window.trash || [];
      const ti = trash.findIndex((c) => c && c.name === name);
      if (ti >= 0) return trash.splice(ti, 1)[0];
      throw new Error("Missing card: " + name);
    };
    window.asMon = function (card, pos, faceup) {
      return {
        uid: card.uid, name: card.name, ref: card.ref,
        position: pos || "atk", faceup: faceup !== false, tempControl: null,
      };
    };
    window.keepDeck = function (owner, names) {
      const keep = {};
      names.forEach((n) => { keep[n] = true; });
      if (!window.trash) window.trash = [];
      const stay = (c) => {
        if (keep[c.name]) return true;
        window.trash.push(c);
        return false;
      };
      owner.hand = owner.hand.filter(stay);
      owner.deck = owner.deck.filter(stay);
    };
    window.putDeck = function (owner, name) {
      owner.deck.push(window.grab(name));
    };
    window.names = function (list) { return list.map((c) => c.name); };
    window.fight = function (atkSide, atkIdx, defSide, defIdx) {
      const st = window.duel;
      const atk = atkSide === "ai" ? st.ai : st.player;
      const def = defSide === "ai" ? st.ai : st.player;
      return window.ClassicDuel.battle(atk, atkIdx, def, defIdx);
    };
  });
  return { page: page, errors: errors };
}

async function labels(page) {
  await page.waitForSelector("#choiceOverlay.open", { timeout: 4000 });
  return page.$$eval("#choiceBtns button", (nodes) => nodes.map((n) => n.textContent));
}

async function clickLabel(page, name) {
  const buttons = await page.$$("#choiceBtns button");
  for (const button of buttons) {
    const text = await button.evaluate((node) => node.textContent);
    if (text.indexOf(name) === 0) {
      await button.click();
      return;
    }
  }
  throw new Error("No choice named " + name);
}

test("graveyard monster effects", { timeout: 180000 }, async (t) => {
  const server = await serve();
  const address = server.address();
  const url = "http://127.0.0.1:" + address.port + "/index.html";
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  const { page, errors } = await boot(browser, url);
  const failQuiet = () => {
    assert.deepEqual(errors, []);
  };

  try {
    await t.test("card text matches the classic search", async () => {
      const text = await page.evaluate(() => ({
        sangan: window.ClassicDuel.card("Sangan").desc,
        witch: window.ClassicDuel.card("Witch of the Black Forest").desc,
      }));
      assert.match(text.sangan, /1000 or less ATK/);
      assert.match(text.sangan, /shuffle/i);
      assert.match(text.witch, /1500 or less DEF/);
      assert.match(text.witch, /shuffle/i);
    });

    await t.test("Sangan destroyed by battle lets the player pick only legal targets", async () => {
      for (const rules of ["classic", "dk", "city"]) {
        await page.evaluate((rules) => {
          window.prepDuel(rules);
          const st = window.duel;
          window.keepDeck(st.player, ["Kuriboh", "Mystical Elf", "Celtic Guardian", "Dark Magician", "Silver Fang"]);
          window.putDeck(st.player, "Kuriboh");
          window.putDeck(st.player, "Mystical Elf");
          window.putDeck(st.player, "Celtic Guardian");
          window.putDeck(st.player, "Dark Magician");
          st.player.monsters[0] = window.asMon(window.grab("Sangan"), "def", true);
          st.ai.monsters[0] = window.asMon(window.grab("Dark Magician"), "atk", true);
          st.player.hand = st.player.hand.filter((c) => c.name !== "Kuriboh");
          window.ClassicDuel.render();
        }, rules);
        const pending = page.evaluate(() => window.fight("ai", 0, "player", 0));
        const shown = await labels(page);
        if (rules === "classic") {
          await page.screenshot({ path: "/opt/cursor/artifacts/sangan_search_picker.png" });
        }
        assert.ok(shown.some((text) => text.indexOf("Kuriboh") === 0), shown.join(" | "));
        assert.ok(shown.some((text) => text.indexOf("Mystical Elf") === 0), shown.join(" | "));
        assert.equal(shown.some((text) => text.indexOf("Celtic Guardian") === 0), false, shown.join(" | "));
        assert.equal(shown.some((text) => text.indexOf("Dark Magician") === 0), false, shown.join(" | "));
        assert.equal(shown.some((text) => text.indexOf("Silver Fang") === 0), false, shown.join(" | "));
        assert.equal(shown.indexOf("Cancel"), -1);
        await clickLabel(page, "Kuriboh");
        await pending;
        const after = await page.evaluate(() => {
          const st = window.ClassicDuel.getState();
          return {
            hand: st.player.hand.map((c) => c.name),
            deck: st.player.deck.map((c) => c.name),
            gy: st.player.gy.map((c) => c.name),
            field: st.player.monsters.map((m) => (m ? m.name : "")),
            rules: st.rules,
          };
        });
        assert.equal(after.rules, rules);
        assert.ok(after.hand.indexOf("Kuriboh") >= 0);
        assert.equal(after.deck.indexOf("Kuriboh"), -1);
        assert.ok(after.gy.indexOf("Sangan") >= 0);
        assert.equal(after.field[0], "");
        assert.ok(after.deck.indexOf("Mystical Elf") >= 0);
        if (rules === "classic") {
          await page.screenshot({ path: "/opt/cursor/artifacts/sangan_kuriboh_in_hand.png" });
        }
      }
      failQuiet();
    });

    await t.test("Sangan face-down still searches when battle sends it", async () => {
      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        window.keepDeck(st.player, ["Basic Insect", "Silver Fang"]);
        window.putDeck(st.player, "Basic Insect");
        st.player.monsters[0] = window.asMon(window.grab("Sangan"), "def", false);
        st.ai.monsters[0] = window.asMon(window.grab("Summoned Skull"), "atk", true);
      });
      const pending = page.evaluate(() => window.fight("ai", 0, "player", 0));
      const shown = await labels(page);
      assert.deepEqual(shown.filter((text) => text.indexOf("Basic Insect") === 0).length, 1);
      assert.equal(shown.some((text) => text.indexOf("Silver Fang") === 0), false);
      await clickLabel(page, "Basic Insect");
      await pending;
      const hand = await page.evaluate(() => window.ClassicDuel.getState().player.hand.map((c) => c.name));
      assert.ok(hand.indexOf("Basic Insect") >= 0);
    });

    await t.test("Sangan tributed in Classic and Battle City searches", async () => {
      for (const rules of ["classic", "city"]) {
        await page.evaluate((rules) => {
          window.prepDuel(rules);
          const st = window.duel;
          st.phase = "main1";
          window.keepDeck(st.player, ["Kuriboh", "Gemini Elf", "Silver Fang"]);
          window.putDeck(st.player, "Kuriboh");
          window.putDeck(st.player, "Gemini Elf");
          st.player.monsters[0] = window.asMon(window.grab("Sangan"), "atk", true);
          st.player.hand = [window.grab("Curse of Dragon")];
          st.player.normalSummoned = false;
        }, rules);
        const placed = page.evaluate(() => window.ClassicDuel.placeMonster("player", 0, "atk", true, [0]));
        const shown = await labels(page);
        assert.ok(shown.some((text) => text.indexOf("Kuriboh") === 0), shown.join(" | "));
        assert.equal(shown.some((text) => text.indexOf("Gemini Elf") === 0), false, shown.join(" | "));
        await clickLabel(page, "Kuriboh");
        const result = await placed;
        assert.equal(result.monster.name, "Curse of Dragon");
        const after = await page.evaluate(() => {
          const st = window.ClassicDuel.getState();
          return {
            hand: st.player.hand.map((c) => c.name),
            gy: st.player.gy.map((c) => c.name),
            field: st.player.monsters.map((m) => (m ? m.name : "")),
          };
        });
        assert.ok(after.hand.indexOf("Kuriboh") >= 0);
        assert.ok(after.gy.indexOf("Sangan") >= 0);
        assert.ok(after.field.indexOf("Curse of Dragon") >= 0);
      }
    });

    await t.test("Raigeki sends Sangan and still searches", async () => {
      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "main1";
        window.keepDeck(st.player, ["Kuriboh", "Dark Magician"]);
        window.putDeck(st.player, "Kuriboh");
        window.putDeck(st.player, "Dark Magician");
        st.player.monsters[0] = window.asMon(window.grab("Sangan"), "atk", true);
        st.ai.monsters[0] = window.asMon(window.grab("Celtic Guardian"), "atk", true);
      });
      const pending = page.evaluate(() => window.ClassicDuel.cast("ai", "Raigeki"));
      const shown = await labels(page);
      assert.ok(shown.some((text) => text.indexOf("Kuriboh") === 0));
      assert.equal(shown.some((text) => text.indexOf("Dark Magician") === 0), false);
      await clickLabel(page, "Kuriboh");
      assert.equal(await pending, true);
      const after = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          hand: st.player.hand.map((c) => c.name),
          gy: st.player.gy.map((c) => c.name),
          aiField: st.ai.monsters.map((m) => (m ? m.name : "")),
        };
      });
      assert.ok(after.hand.indexOf("Kuriboh") >= 0);
      assert.ok(after.gy.indexOf("Sangan") >= 0);
      assert.ok(after.aiField.indexOf("Celtic Guardian") >= 0);
    });

    await t.test("Witch searches DEF 1500 or less and the AI prefers the highest DEF", async () => {
      await page.evaluate(() => {
        window.prepDuel("dk");
        const st = window.duel;
        window.keepDeck(st.player, ["Beaver Warrior", "Celtic Guardian", "Mystical Elf", "Dark Magician", "Silver Fang"]);
        ["Beaver Warrior", "Celtic Guardian", "Mystical Elf", "Dark Magician"].forEach((name) => window.putDeck(st.player, name));
        st.player.monsters[0] = window.asMon(window.grab("Witch of the Black Forest"), "def", true);
        st.ai.monsters[0] = window.asMon(window.grab("Summoned Skull"), "atk", true);
      });
      const pending = page.evaluate(() => window.fight("ai", 0, "player", 0));
      const shown = await labels(page);
      assert.ok(shown.some((text) => text.indexOf("Beaver Warrior") === 0), shown.join(" | "));
      assert.ok(shown.some((text) => text.indexOf("Celtic Guardian") === 0), shown.join(" | "));
      assert.equal(shown.some((text) => text.indexOf("Mystical Elf") === 0), false, shown.join(" | "));
      assert.equal(shown.some((text) => text.indexOf("Dark Magician") === 0), false, shown.join(" | "));
      await page.screenshot({ path: "/opt/cursor/artifacts/witch_search_picker.png" });
      await clickLabel(page, "Beaver Warrior");
      await pending;
      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        window.keepDeck(st.ai, []);
        window.putDeck(st.ai, "Beaver Warrior");
        window.putDeck(st.ai, "Celtic Guardian");
        window.putDeck(st.ai, "Mystical Elf");
        st.ai.monsters[0] = window.asMon(window.grab("Witch of the Black Forest"), "def", true);
        st.player.monsters[0] = window.asMon(window.grab("Dark Magician"), "atk", true);
        st.player.hand = st.player.hand.filter((c) => c.name !== "Kuriboh");
      });
      await page.evaluate(() => window.fight("player", 0, "ai", 0));
      const ai = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          hand: st.ai.hand.map((c) => c.name),
          gy: st.ai.gy.map((c) => c.name),
          open: document.getElementById("choiceOverlay").classList.contains("open"),
        };
      });
      assert.ok(ai.hand.indexOf("Beaver Warrior") >= 0);
      assert.equal(ai.hand.indexOf("Celtic Guardian"), -1);
      assert.equal(ai.hand.indexOf("Mystical Elf"), -1);
      assert.ok(ai.gy.indexOf("Witch of the Black Forest") >= 0);
      assert.equal(ai.open, false);
    });

    await t.test("the AI picks the highest legal ATK for Sangan", async () => {
      await page.evaluate(() => {
        window.prepDuel("city");
        const st = window.duel;
        window.keepDeck(st.ai, []);
        window.putDeck(st.ai, "Kuriboh");
        window.putDeck(st.ai, "Basic Insect");
        window.putDeck(st.ai, "Celtic Guardian");
        st.ai.monsters[0] = window.asMon(window.grab("Sangan"), "def", true);
        st.player.monsters[0] = window.asMon(window.grab("Dark Magician"), "atk", true);
        st.player.hand = [];
      });
      await page.evaluate(() => window.fight("player", 0, "ai", 0));
      const ai = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return { hand: st.ai.hand.map((c) => c.name), deck: st.ai.deck.map((c) => c.name) };
      });
      assert.ok(ai.hand.indexOf("Basic Insect") >= 0);
      assert.equal(ai.hand.indexOf("Kuriboh"), -1);
      assert.equal(ai.hand.indexOf("Celtic Guardian"), -1);
      assert.ok(ai.deck.indexOf("Kuriboh") >= 0);
    });

    await t.test("no legal target does nothing and raises no error", async () => {
      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        window.keepDeck(st.player, ["Gemini Elf", "Dark Magician", "Silver Fang"]);
        window.putDeck(st.player, "Gemini Elf");
        window.putDeck(st.player, "Dark Magician");
        st.player.hand = [];
        st.player.monsters[0] = window.asMon(window.grab("Sangan"), "def", true);
        st.ai.monsters[0] = window.asMon(window.grab("Summoned Skull"), "atk", true);
        window.__before = st.player.hand.length;
      });
      await page.evaluate(() => window.fight("ai", 0, "player", 0));
      const after = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          hand: st.player.hand.length,
          before: window.__before,
          gy: st.player.gy.map((c) => c.name),
          deck: st.player.deck.map((c) => c.name),
          open: document.getElementById("choiceOverlay").classList.contains("open"),
          log: st.log[0] || "",
        };
      });
      assert.equal(after.hand, after.before);
      assert.ok(after.gy.indexOf("Sangan") >= 0);
      assert.ok(after.deck.indexOf("Gemini Elf") >= 0);
      assert.equal(after.open, false);
      assert.match(after.log, /no valid target/);
      failQuiet();
    });

    await t.test("Giant Rat recruits on battle destruction and not on tribute or Raigeki", async () => {
      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        window.keepDeck(st.ai, []);
        window.putDeck(st.ai, "Beaver Warrior");
        window.putDeck(st.ai, "Kuriboh");
        st.ai.monsters[0] = window.asMon(window.grab("Giant Rat"), "def", true);
        st.player.monsters[0] = window.asMon(window.grab("Dark Magician"), "atk", true);
        st.player.hand = [];
      });
      await page.evaluate(() => window.fight("player", 0, "ai", 0));
      const battled = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          field: st.ai.monsters.map((m) => (m ? m.name + ":" + m.position + ":" + m.faceup : "")),
          deck: st.ai.deck.map((c) => c.name),
        };
      });
      assert.ok(battled.field.indexOf("Beaver Warrior:atk:true") >= 0, battled.field.join(","));
      assert.ok(battled.deck.indexOf("Kuriboh") >= 0);

      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "main1";
        window.keepDeck(st.ai, []);
        window.putDeck(st.ai, "Beaver Warrior");
        st.ai.monsters[0] = window.asMon(window.grab("Giant Rat"), "atk", true);
        st.ai.hand = [window.grab("Curse of Dragon")];
        st.ai.normalSummoned = false;
      });
      await page.evaluate(() => window.ClassicDuel.placeMonster("ai", 0, "atk", true, [0]));
      const tributed = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          field: st.ai.monsters.map((m) => (m ? m.name : "")),
          deck: st.ai.deck.map((c) => c.name),
          gy: st.ai.gy.map((c) => c.name),
        };
      });
      assert.ok(tributed.field.indexOf("Curse of Dragon") >= 0);
      assert.equal(tributed.field.indexOf("Beaver Warrior"), -1);
      assert.ok(tributed.deck.indexOf("Beaver Warrior") >= 0);
      assert.ok(tributed.gy.indexOf("Giant Rat") >= 0);

      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        window.keepDeck(st.player, ["Beaver Warrior", "Silver Fang"]);
        window.putDeck(st.player, "Beaver Warrior");
        st.player.monsters[0] = window.asMon(window.grab("Giant Rat"), "atk", true);
        st.player.hand = [];
      });
      const cast = await page.evaluate(() => window.ClassicDuel.cast("ai", "Raigeki"));
      assert.equal(cast, true);
      const wiped = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          field: st.player.monsters.map((m) => (m ? m.name : "")),
          deck: st.player.deck.map((c) => c.name),
          open: document.getElementById("choiceOverlay").classList.contains("open"),
        };
      });
      assert.equal(wiped.field.indexOf("Beaver Warrior"), -1);
      assert.ok(wiped.deck.indexOf("Beaver Warrior") >= 0);
      assert.equal(wiped.open, false);
    });

    await t.test("Man-Eater Bug still flips", async () => {
      const why = await page.evaluate(async () => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "main1";
        st.turn = "player";
        st.busy = false;
        st.prompt = false;
        st.player.monsters[0] = window.asMon(window.grab("Man-Eater Bug"), "def", false);
        st.ai.monsters[0] = window.asMon(window.grab("Dark Magician"), "atk", true);
        st.player.summonedThisTurn = new Set();
        st.player.positionChanged = new Set();
        st.player.attackedThisTurn = new Set();
        const ok = await window.ClassicDuel.changePos("player", 0);
        const bug = st.player.monsters[0];
        return {
          ok: ok,
          bug: bug && bug.name,
          pos: bug && bug.position,
          faceup: bug && bug.faceup,
          ai: st.ai.monsters.map((m) => (m ? m.name : "")),
          gy: st.ai.gy.map((c) => c.name),
        };
      });
      assert.equal(why.ok, true);
      assert.equal(why.bug, "Man-Eater Bug");
      assert.equal(why.pos, "atk");
      assert.equal(why.faceup, true);
      assert.ok(why.gy.indexOf("Dark Magician") >= 0);
      assert.equal(why.ai[0], "");
    });

    await t.test("The Unhappy Maiden ends the Battle Phase", async () => {
      const after = await page.evaluate(async () => {
        window.prepDuel("city");
        const st = window.duel;
        st.phase = "battle";
        st.ai.monsters[0] = window.asMon(window.grab("The Unhappy Maiden"), "def", true);
        st.player.monsters[0] = window.asMon(window.grab("Dark Magician"), "atk", true);
        st.player.hand = [];
        await window.fight("player", 0, "ai", 0);
        const phase = st.phase;
        const halted = st.battleOver;
        const again = window.fight("player", 0, "ai", 1);
        return { phase: phase, halted: halted, gy: st.ai.gy.map((c) => c.name), again: !!again };
      });
      assert.equal(after.phase, "main2");
      assert.equal(after.halted, true);
      assert.ok(after.gy.indexOf("The Unhappy Maiden") >= 0);
    });

    await t.test("Big Eye lets the player order the top of their Deck and the AI puts the best card on top", async () => {
      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "main1";
        window.keepDeck(st.player, []);
        window.keepDeck(st.ai, []);
        ["Silver Fang", "Kuriboh", "Pot of Greed", "Dark Magician", "Raigeki"].forEach((name) => window.putDeck(st.player, name));
        st.player.monsters[0] = window.asMon(window.grab("Big Eye"), "def", false);
        st.player.summonedThisTurn = new Set();
        st.player.positionChanged = new Set();
      });
      const pending = page.evaluate(() => window.ClassicDuel.changePos("player", 0));
      const shown = await labels(page);
      await page.screenshot({ path: "/opt/cursor/artifacts/big_eye_order.png" });
      assert.equal(shown[0].indexOf("Raigeki"), 0, shown.join(" | "));
      assert.ok(shown.some((text) => text.indexOf("Pot of Greed") === 0), shown.join(" | "));
      assert.ok(shown.some((text) => text.indexOf("Dark Magician") === 0), shown.join(" | "));
      assert.equal(shown.indexOf("Cancel"), -1);
      for (const name of ["Pot of Greed", "Raigeki", "Kuriboh", "Silver Fang", "Dark Magician"]) {
        await clickLabel(page, name);
      }
      assert.equal(await pending, true);
      const top = await page.evaluate(() => window.ClassicDuel.getState().player.deck.slice(-5).map((c) => c.name));
      assert.deepEqual(top, ["Dark Magician", "Silver Fang", "Kuriboh", "Raigeki", "Pot of Greed"]);

      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        window.keepDeck(st.ai, []);
        window.keepDeck(st.player, []);
        ["Silver Fang", "Kuriboh", "Pot of Greed", "Dark Magician", "Raigeki"].forEach((name) => window.putDeck(st.ai, name));
        st.ai.monsters[0] = window.asMon(window.grab("Big Eye"), "def", false);
        st.ai.summonedThisTurn = new Set();
        st.ai.positionChanged = new Set();
      });
      await page.evaluate(() => window.ClassicDuel.changePos("ai", 0));
      const aiTop = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          top: st.ai.deck[st.ai.deck.length - 1].name,
          open: document.getElementById("choiceOverlay").classList.contains("open"),
          face: st.ai.monsters[0] && st.ai.monsters[0].faceup,
        };
      });
      assert.equal(aiTop.top, "Raigeki");
      assert.equal(aiTop.open, false);
      assert.equal(aiTop.face, true);
    });

    await t.test("Bombardment Beetle destroys a checked Effect Monster and leaves a Normal Monster", async () => {
      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "main1";
        st.player.monsters[0] = window.asMon(window.grab("Bombardment Beetle"), "def", false);
        st.player.monsters[1] = window.asMon(window.grab("Celtic Guardian"), "atk", true);
        st.ai.monsters[0] = window.asMon(window.grab("Man-Eater Bug"), "def", false);
        st.ai.monsters[1] = window.asMon(window.grab("Silver Fang"), "def", false);
        st.player.summonedThisTurn = new Set();
        st.player.positionChanged = new Set();
      });
      const pending = page.evaluate(() => window.ClassicDuel.changePos("player", 0));
      const shown = await labels(page);
      assert.ok(shown.some((text) => text === "Monster zone 1"), shown.join(" | "));
      assert.ok(shown.some((text) => text === "Monster zone 2"), shown.join(" | "));
      await clickLabel(page, "Monster zone 1");
      await pending;
      const checked = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          ai: st.ai.monsters.map((m) => (m ? m.name + ":" + m.faceup : "")),
          gy: st.ai.gy.map((c) => c.name),
          player: st.player.monsters.map((m) => (m ? m.name : "")),
        };
      });
      assert.equal(checked.ai[0], "");
      assert.equal(checked.ai[1], "Silver Fang:false");
      assert.ok(checked.gy.indexOf("Man-Eater Bug") >= 0);
      assert.ok(checked.player.indexOf("Celtic Guardian") >= 0);
      assert.ok(checked.player.indexOf("Bombardment Beetle") >= 0);

      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        st.ai.monsters[0] = window.asMon(window.grab("Bombardment Beetle"), "def", false);
        st.ai.monsters[1] = window.asMon(window.grab("Dark Magician"), "atk", true);
        st.player.monsters[0] = window.asMon(window.grab("Man-Eater Bug"), "def", false);
        st.player.monsters[1] = window.asMon(window.grab("Silver Fang"), "def", false);
        st.ai.summonedThisTurn = new Set();
        st.ai.positionChanged = new Set();
      });
      await page.evaluate(() => window.ClassicDuel.changePos("ai", 0));
      const aiPick = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          player: st.player.monsters.map((m) => (m ? m.name + ":" + m.faceup : "")),
          gy: st.player.gy.map((c) => c.name),
          ai: st.ai.monsters.map((m) => (m ? m.name : "")),
          open: document.getElementById("choiceOverlay").classList.contains("open"),
        };
      });
      assert.equal(aiPick.player[0], "");
      assert.equal(aiPick.player[1], "Silver Fang:false");
      assert.ok(aiPick.gy.indexOf("Man-Eater Bug") >= 0);
      assert.ok(aiPick.ai.indexOf("Dark Magician") >= 0);
      assert.equal(aiPick.open, false);
    });

    await t.test("Jigen Bakudan waits for the controller's next Standby and burns half ATK", async () => {
      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "main1";
        st.player.lp = 500;
        st.ai.monsters[0] = window.asMon(window.grab("Jigen Bakudan"), "def", false);
        st.ai.monsters[1] = window.asMon(window.grab("Celtic Guardian"), "atk", true);
        st.ai.summonedThisTurn = new Set();
        st.ai.positionChanged = new Set();
      });
      const armed = await page.evaluate(async () => {
        const ok = await window.ClassicDuel.changePos("ai", 0);
        const st = window.ClassicDuel.getState();
        const bomb = st.ai.monsters[0];
        return { ok: ok, lp: st.player.lp, armed: !!(bomb && bomb.jigenArmed && bomb.faceup), ally: st.ai.monsters[1] && st.ai.monsters[1].name };
      });
      assert.equal(armed.ok, true);
      assert.equal(armed.lp, 500);
      assert.equal(armed.armed, true);
      assert.equal(armed.ally, "Celtic Guardian");
      await page.evaluate(() => {
        window.duel.phase = "main2";
        document.getElementById("btnNext").click();
      });
      await page.waitForFunction(() => window.ClassicDuel.getState().winner === "ai", { timeout: 5000 });
      const blown = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          lp: st.player.lp,
          gy: st.ai.gy.map((c) => c.name),
          field: st.ai.monsters.map((m) => (m ? m.name : "")),
          log: st.log.slice(0, 6).join(" | "),
        };
      });
      assert.equal(blown.lp, 0);
      assert.ok(blown.gy.indexOf("Jigen Bakudan") >= 0, blown.log);
      assert.ok(blown.gy.indexOf("Celtic Guardian") >= 0, blown.log);
      assert.equal(blown.field[1], "");
    });

    await t.test("Morphing Jar #2 shuffles monsters home and excavates by level", async () => {
      const after = await page.evaluate(async () => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "main1";
        window.keepDeck(st.player, ["Silver Fang"]);
        st.player.deck = st.player.deck.filter((c) => c.name === "Silver Fang");
        st.player.hand = [];
        st.ai.deck = [];
        st.ai.hand = [];
        const before = st.player.deck.length;
        st.player.monsters[0] = window.asMon(window.grab("Morphing Jar #2"), "def", false);
        st.player.monsters[1] = window.asMon(window.grab("Obelisk the Tormentor"), "atk", true);
        st.ai.monsters[0] = window.asMon(window.grab("Dark Magician"), "atk", true);
        st.player.summonedThisTurn = new Set();
        st.player.positionChanged = new Set();
        await window.ClassicDuel.changePos("player", 0);
        const playerMon = st.player.monsters.filter(Boolean);
        return {
          before: before,
          deck: st.player.deck.length,
          god: st.player.monsters[1] && st.player.monsters[1].name,
          summoned: playerMon.filter((m) => m.name !== "Obelisk the Tormentor").map((m) => ({
            name: m.name, pos: m.position, face: m.faceup, level: m.ref.level,
          })),
          aiField: st.ai.monsters.map((m) => (m ? m.name : "")),
          aiGy: st.ai.gy.map((c) => c.name),
          aiDeck: st.ai.deck.length,
        };
      });
      assert.equal(after.deck, after.before);
      assert.equal(after.god, "Obelisk the Tormentor");
      assert.equal(after.summoned.length, 1);
      assert.equal(after.summoned[0].pos, "def");
      assert.equal(after.summoned[0].face, false);
      assert.ok(after.summoned[0].level <= 4);
      assert.deepEqual(after.aiField, ["", "", "", "", ""]);
      assert.ok(after.aiGy.indexOf("Dark Magician") >= 0);
      assert.equal(after.aiDeck, 0);
    });

    await t.test("Invader of the Throne swaps outside battle and stays with its owner in the Graveyard", async () => {
      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "main1";
        st.player.monsters[0] = window.asMon(window.grab("Invader of the Throne"), "def", false);
        st.ai.monsters[0] = window.asMon(window.grab("Celtic Guardian"), "atk", true);
        st.ai.monsters[1] = window.asMon(window.grab("Dark Magician"), "atk", true);
        st.player.summonedThisTurn = new Set();
        st.player.positionChanged = new Set();
      });
      const pending = page.evaluate(() => window.ClassicDuel.changePos("player", 0));
      const shown = await labels(page);
      assert.ok(shown.some((text) => text.indexOf("Celtic Guardian") === 0), shown.join(" | "));
      assert.ok(shown.some((text) => text.indexOf("Dark Magician") === 0), shown.join(" | "));
      await clickLabel(page, "Celtic Guardian");
      await pending;
      const swapped = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        const taken = st.player.monsters[0];
        const given = st.ai.monsters[0];
        return {
          taken: taken && taken.name,
          home: taken && taken.home,
          given: given && given.name,
          givenHome: given && given.home,
          dm: st.ai.monsters[1] && st.ai.monsters[1].name,
        };
      });
      assert.equal(swapped.taken, "Celtic Guardian");
      assert.equal(swapped.home, "ai");
      assert.equal(swapped.given, "Invader of the Throne");
      assert.equal(swapped.givenHome, "player");
      assert.equal(swapped.dm, "Dark Magician");
      const buried = await page.evaluate(async () => {
        await window.ClassicDuel.cast("ai", "Raigeki");
        const st = window.ClassicDuel.getState();
        return {
          playerGy: st.player.gy.map((c) => c.name),
          aiGy: st.ai.gy.map((c) => c.name),
          aiField: st.ai.monsters.map((m) => (m ? m.name : "")),
        };
      });
      assert.equal(buried.playerGy.indexOf("Celtic Guardian"), -1);
      assert.ok(buried.aiGy.indexOf("Celtic Guardian") >= 0);
      assert.ok(buried.aiField.indexOf("Invader of the Throne") >= 0);

      const battle = await page.evaluate(async () => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "battle";
        st.player.monsters[0] = window.asMon(window.grab("Invader of the Throne"), "def", false);
        st.ai.monsters[0] = window.asMon(window.grab("Kuriboh"), "atk", true);
        st.ai.monsters[1] = window.asMon(window.grab("Dark Magician"), "atk", true);
        await window.fight("ai", 0, "player", 0);
        return {
          player: st.player.monsters.map((m) => (m ? m.name + ":" + m.faceup : "")),
          ai: st.ai.monsters.map((m) => (m ? m.name : "")),
          log: st.log.slice(0, 4).join(" | "),
        };
      });
      assert.equal(battle.player[0], "Invader of the Throne:true");
      assert.equal(battle.ai[1], "Dark Magician");
      assert.match(battle.log, /Battle Phase/);
    });

    await t.test("Parasite Paracide hatches on the draw and does not burrow if battle destroys it", async () => {
      const hatched = await page.evaluate(async () => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "main1";
        st.ai.lp = 4000;
        st.player.monsters[0] = window.asMon(window.grab("Parasite Paracide"), "def", false);
        st.player.summonedThisTurn = new Set();
        st.player.positionChanged = new Set();
        await window.ClassicDuel.changePos("player", 0);
        const buried = st.ai.deck.findIndex((c) => c && c.parasite);
        const card = st.ai.deck.splice(buried, 1)[0];
        st.ai.deck.push(card);
        st.ai.monsters[0] = window.asMon(window.grab("Celtic Guardian"), "atk", true);
        const barrier = window.grab("Insect Barrier");
        st.player.spells[0] = Object.assign(barrier, { faceup: true });
        await window.ClassicDuel.cast("ai", "Pot of Greed");
        const host = st.ai.monsters.findIndex((m) => m && m.parasite);
        const guard = st.ai.monsters.findIndex((m) => m && m.name === "Celtic Guardian");
        return {
          field: st.player.monsters.map((m) => (m ? m.name : "")),
          host: host >= 0 ? { pos: st.ai.monsters[host].position, face: st.ai.monsters[host].faceup } : null,
          hand: st.ai.hand.map((c) => c.name),
          lp: st.ai.lp,
          lock: guard >= 0 ? window.ClassicDuel.attackLock("ai", guard) : "",
        };
      });
      assert.equal(hatched.field[0], "");
      assert.deepEqual(hatched.host, { pos: "def", face: true });
      assert.equal(hatched.hand.indexOf("Parasite Paracide"), -1);
      assert.equal(hatched.lp, 3000);
      assert.equal(hatched.lock, "Insect Barrier");

      const crushed = await page.evaluate(async () => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "battle";
        st.player.monsters[0] = window.asMon(window.grab("Parasite Paracide"), "def", false);
        st.ai.monsters[0] = window.asMon(window.grab("Dark Magician"), "atk", true);
        await window.fight("ai", 0, "player", 0);
        return {
          gy: st.player.gy.map((c) => c.name),
          planted: st.ai.deck.some((c) => c && c.parasite),
          field: st.player.monsters.map((m) => (m ? m.name : "")),
        };
      });
      assert.ok(crushed.gy.indexOf("Parasite Paracide") >= 0);
      assert.equal(crushed.planted, false);
      assert.equal(crushed.field[0], "");

      const lived = await page.evaluate(async () => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "battle";
        st.player.monsters[0] = window.asMon(window.grab("Parasite Paracide"), "def", false);
        st.ai.monsters[0] = window.asMon(window.grab("Kuriboh"), "atk", true);
        await window.fight("ai", 0, "player", 0);
        return {
          field: st.player.monsters.map((m) => (m ? m.name : "")),
          kuriboh: st.ai.monsters[0] && st.ai.monsters[0].name,
          planted: st.ai.deck.some((c) => c && c.parasite),
        };
      });
      assert.equal(lived.field[0], "");
      assert.equal(lived.kuriboh, "Kuriboh");
      assert.equal(lived.planted, true);
    });

    await t.test("Summoner of Illusions tributes, summons a fusion, and loses it at the End Phase", async () => {
      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "main1";
        st.player.monsters[0] = window.asMon(window.grab("Summoner of Illusions"), "def", false);
        st.player.monsters[1] = window.asMon(window.grab("Kuriboh"), "atk", true);
        st.player.monsters[2] = window.asMon(window.grab("Silver Fang"), "atk", true);
        st.player.summonedThisTurn = new Set();
        st.player.positionChanged = new Set();
      });
      const pending = page.evaluate(() => window.ClassicDuel.changePos("player", 0));
      const tributes = await labels(page);
      assert.ok(tributes.some((text) => text.indexOf("Kuriboh") === 0), tributes.join(" | "));
      assert.ok(tributes.some((text) => text.indexOf("Silver Fang") === 0), tributes.join(" | "));
      await clickLabel(page, "Kuriboh");
      const fusions = await labels(page);
      assert.ok(fusions.some((text) => text.indexOf("Thousand Dragon") === 0), fusions.join(" | "));
      assert.ok(fusions.some((text) => text.indexOf("Gaia the Dragon Champion") === 0), fusions.join(" | "));
      await clickLabel(page, "Thousand Dragon");
      assert.equal(await pending, true);
      const summoned = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        const dragon = st.player.monsters.find((m) => m && m.name === "Thousand Dragon");
        return {
          dragon: !!(dragon && dragon.illusion && dragon.faceup),
          gy: st.player.gy.map((c) => c.name),
          extra: st.player.extra.map((c) => c.name),
          fang: st.player.monsters.some((m) => m && m.name === "Silver Fang"),
        };
      });
      assert.equal(summoned.dragon, true);
      assert.ok(summoned.gy.indexOf("Kuriboh") >= 0);
      assert.equal(summoned.extra.indexOf("Thousand Dragon"), -1);
      assert.equal(summoned.fang, true);
      await page.evaluate(() => {
        window.duel.phase = "main2";
        document.getElementById("btnNext").click();
      });
      const faded = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          field: st.player.monsters.map((m) => (m ? m.name : "")),
          gy: st.player.gy.map((c) => c.name),
        };
      });
      assert.equal(faded.field.indexOf("Thousand Dragon"), -1);
      assert.ok(faded.gy.indexOf("Thousand Dragon") >= 0);

      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        st.ai.monsters[0] = window.asMon(window.grab("Summoner of Illusions"), "def", false);
        st.ai.monsters[1] = window.asMon(window.grab("Kuriboh"), "atk", true);
        st.ai.monsters[2] = window.asMon(window.grab("Beaver Warrior"), "atk", true);
        st.ai.extra = st.player.extra.splice(0, st.player.extra.length);
        st.ai.summonedThisTurn = new Set();
        st.ai.positionChanged = new Set();
      });
      await page.evaluate(() => window.ClassicDuel.changePos("ai", 0));
      const aiSummon = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          field: st.ai.monsters.map((m) => (m ? m.name : "")),
          gy: st.ai.gy.map((c) => c.name),
          open: document.getElementById("choiceOverlay").classList.contains("open"),
        };
      });
      assert.ok(aiSummon.field.indexOf("Gaia the Dragon Champion") >= 0, aiSummon.field.join(","));
      assert.ok(aiSummon.gy.indexOf("Kuriboh") >= 0);
      assert.ok(aiSummon.field.indexOf("Beaver Warrior") >= 0);
      assert.equal(aiSummon.open, false);
    });

    await t.test("Supply returns two Fusion Materials and lets the player pick when there are more", async () => {
      const fuse = async (side) => page.evaluate(async (side) => {
        const st = window.ClassicDuel.getState();
        const owner = side === "ai" ? st.ai : st.player;
        const other = side === "ai" ? st.player : st.ai;
        ["Gaia the Dragon Champion", "Flame Swordsman"].forEach((name) => {
          if (owner.extra.some((c) => c && c.name === name)) return;
          const i = other.extra.findIndex((c) => c && c.name === name);
          if (i >= 0) owner.extra.push(other.extra.splice(i, 1)[0]);
        });
        owner.hand = [window.grab("Polymerization"), window.grab("Polymerization"), window.grab("Flame Manipulator"), window.grab("Masaki the Legendary Swordsman")];
        owner.monsters[0] = window.asMon(window.grab("Gaia The Fierce Knight"), "atk", true);
        owner.monsters[1] = window.asMon(window.grab("Curse of Dragon"), "atk", true);
        const first = window.ClassicDuel.possibleFusions(side)[0];
        const poly = owner.hand.find((c) => c.name === "Polymerization");
        const ok = window.ClassicDuel.performFusion(owner, poly.uid, first);
        const second = window.ClassicDuel.possibleFusions(side)[0];
        const poly2 = owner.hand.find((c) => c.name === "Polymerization");
        const ok2 = window.ClassicDuel.performFusion(owner, poly2.uid, second);
        return { ok: ok, ok2: ok2, gy: owner.gy.map((c) => c.name), mats: owner.gy.filter((c) => c.fusionMaterial).map((c) => c.name) };
      }, side);

      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "main1";
        st.turn = "player";
        st.busy = false;
        st.prompt = false;
      });
      const fused = await fuse("player");
      assert.equal(fused.ok, true, JSON.stringify(fused));
      assert.equal(fused.ok2, true, JSON.stringify(fused));
      assert.ok(fused.mats.indexOf("Gaia The Fierce Knight") >= 0, fused.mats.join(","));
      assert.ok(fused.mats.indexOf("Curse of Dragon") >= 0, fused.mats.join(","));
      await page.evaluate(() => {
        const st = window.duel;
        st.player.monsters[4] = window.asMon(window.grab("Supply"), "def", false);
        st.player.gy.push(window.grab("Silver Fang"));
        st.player.summonedThisTurn = new Set();
        st.player.positionChanged = new Set();
        st.phase = "main1";
        st.busy = false;
        st.prompt = false;
      });
      const pending = page.evaluate(() => window.ClassicDuel.changePos("player", 4));
      const shown = await labels(page);
      await page.screenshot({ path: "/opt/cursor/artifacts/supply_picker.png" });
      assert.ok(shown.some((text) => text.indexOf("Gaia The Fierce Knight") === 0), shown.join(" | "));
      assert.ok(shown.some((text) => text.indexOf("Flame Manipulator") === 0), shown.join(" | "));
      assert.equal(shown.some((text) => text.indexOf("Silver Fang") === 0), false, shown.join(" | "));
      await clickLabel(page, "Flame Manipulator");
      const second = await labels(page);
      assert.equal(second.some((text) => text.indexOf("Flame Manipulator") === 0), false);
      await clickLabel(page, "Masaki the Legendary Swordsman");
      assert.equal(await pending, true);
      const returned = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          hand: st.player.hand.map((c) => c.name),
          gy: st.player.gy.map((c) => c.name),
        };
      });
      assert.ok(returned.hand.indexOf("Flame Manipulator") >= 0);
      assert.ok(returned.hand.indexOf("Masaki the Legendary Swordsman") >= 0);
      assert.ok(returned.gy.indexOf("Gaia The Fierce Knight") >= 0);
      assert.ok(returned.gy.indexOf("Silver Fang") >= 0);
      assert.equal(returned.hand.indexOf("Silver Fang"), -1);

      await page.evaluate(() => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "main1";
        st.turn = "player";
        st.busy = false;
        st.prompt = false;
      });
      const aiFused = await fuse("ai");
      assert.equal(aiFused.ok, true, JSON.stringify(aiFused));
      assert.equal(aiFused.ok2, true, JSON.stringify(aiFused));
      await page.evaluate(() => {
        const st = window.duel;
        st.ai.monsters[4] = window.asMon(window.grab("Supply"), "def", false);
        st.ai.summonedThisTurn = new Set();
        st.ai.positionChanged = new Set();
      });
      await page.evaluate(() => window.ClassicDuel.changePos("ai", 4));
      const aiBack = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          hand: st.ai.hand.map((c) => c.name),
          gy: st.ai.gy.map((c) => c.name),
          open: document.getElementById("choiceOverlay").classList.contains("open"),
        };
      });
      assert.ok(aiBack.hand.indexOf("Gaia The Fierce Knight") >= 0, aiBack.hand.join(","));
      assert.ok(aiBack.hand.indexOf("Curse of Dragon") >= 0, aiBack.hand.join(","));
      assert.equal(aiBack.hand.indexOf("Flame Manipulator"), -1);
      assert.ok(aiBack.gy.indexOf("Flame Manipulator") >= 0);
      assert.equal(aiBack.open, false);

      const miss = await page.evaluate(async () => {
        window.prepDuel("classic");
        const st = window.duel;
        st.phase = "main1";
        st.player.monsters[0] = window.asMon(window.grab("Supply"), "def", false);
        st.player.gy = [window.grab("Kuriboh")];
        st.player.summonedThisTurn = new Set();
        st.player.positionChanged = new Set();
        await window.ClassicDuel.changePos("player", 0);
        return {
          hand: st.player.hand.map((c) => c.name),
          gy: st.player.gy.map((c) => c.name),
          open: document.getElementById("choiceOverlay").classList.contains("open"),
          log: st.log[0] || "",
        };
      });
      assert.equal(miss.hand.indexOf("Kuriboh"), -1);
      assert.ok(miss.gy.indexOf("Kuriboh") >= 0);
      assert.equal(miss.open, false);
      assert.match(miss.log, /not 2 Fusion Material/);
    });

    await t.test("the suite raised no page errors", () => {
      assert.deepEqual(errors, []);
    });
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
