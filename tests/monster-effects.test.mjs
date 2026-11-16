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
      ];
      window.ClassicDuel.begin(
        { id: "t", name: "You", main: names.concat(filler), extra: [] },
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

test("graveyard monster effects", { timeout: 120000 }, async (t) => {
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
      const why = await page.evaluate(() => {
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
        const ok = window.ClassicDuel.changePos("player", 0);
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

    await t.test("the suite raised no page errors", () => {
      assert.deepEqual(errors, []);
    });
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
