import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chrome = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const shots = "/opt/cursor/artifacts";

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
      const type = file.endsWith(".js") ? "text/javascript" : file.endsWith(".jpg") ? "image/jpeg" : "text/html";
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

test("battle city blimp finals", { timeout: 180000 }, async (t) => {
  const server = await serve();
  const address = server.address();
  const url = "http://127.0.0.1:" + address.port + "/index.html";
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err && err.stack || err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.ClassicDuel && window.ClassicDuel.card("The Winged Dragon of Ra"));

  try {
    await t.test("stories, bracket order, and a save that skips ahead", async () => {
      const story = await page.evaluate(() => ({
        welcome: window.ClassicDuel.story("blimp-intro"),
        marik: window.ClassicDuel.story("marik-pre"),
        champion: window.ClassicDuel.story("blimp-champion"),
        early: window.ClassicDuel.recordFinals("blimp-marik"),
        open: window.ClassicDuel.finals().open,
      }));
      assert.equal(story.welcome.kicker, "The Blimp");
      assert.equal(story.welcome.lines.length, 3);
      assert.match(story.welcome.lines[1].text, /Egyptian Gods/);
      assert.equal(story.marik.lines[0].name, "Marik");
      assert.match(story.marik.lines[0].text, /Winged Dragon of Ra/);
      assert.equal(story.champion.lines.length, 3);
      assert.equal(story.early.ok, false);
      assert.equal(story.open, false);

      const migrated = await page.evaluate(() => {
        localStorage.setItem("classicDuel_battlecity_v1", JSON.stringify({
          place: "pier", seenRules: true, quiet: 3, deck: null,
          beaten: ["blimp-kaiba", "blimp-mai"], champion: true,
        }));
        const city = window.ClassicDuel.reloadCity();
        const place = window.ClassicDuel.city();
        localStorage.setItem("classicDuel_battlecity_v1", JSON.stringify({
          version: 1, place: "clock", seenRules: true, quiet: 0, deck: null, beaten: [], champion: false,
        }));
        window.ClassicDuel.reloadCity();
        return { beaten: city.beaten, champion: city.champion, next: city.next, place: place.place, quiet: place.quiet };
      });
      assert.deepEqual(migrated.beaten, ["blimp-mai"]);
      assert.equal(migrated.champion, false);
      assert.equal(migrated.next, "blimp-joey");
      assert.equal(migrated.place, "pier");
      assert.equal(migrated.quiet, 3);
    });

    await t.test("gods follow the bracket and a custom deck can use them", async () => {
      const result = await page.evaluate(() => {
        const api = window.ClassicDuel;
        const districts = ["clock", "corp", "park", "pier", "works", "market"];
        districts.forEach((id) => api.awardLocator(id));
        const before = {
          slifer: api.owned("Slifer the Sky Dragon"),
          obelisk: api.owned("Obelisk the Tormentor"),
          ra: api.owned("The Winged Dragon of Ra"),
          blocked: api.issuesFor(Array(40).fill("Slifer the Sky Dragon"), []).some((line) => line.indexOf("You own 0") >= 0),
        };
        const skip = api.recordFinals("blimp-kaiba");
        const steps = ["blimp-mai", "blimp-joey", "blimp-odion", "blimp-kaiba", "blimp-marik"].map((id) => {
          const rec = api.recordFinals(id);
          return { id: id, ok: rec.ok, god: rec.god, granted: rec.granted, line: rec.line, access: api.finalsAccess(id) };
        });
        const again = api.recordFinals("blimp-odion");
        const finals = api.finals();
        const profile = api.profile();
        const afterIssues = api.issuesFor(Array(40).fill("The Winged Dragon of Ra"), []);
        const one = api.issuesFor(["The Winged Dragon of Ra"].concat(Array(39).fill("Silver Fang")), []);
        return {
          before: before,
          skip: skip.ok,
          steps: steps,
          again: again.ok,
          owned: {
            slifer: api.owned("Slifer the Sky Dragon"),
            obelisk: api.owned("Obelisk the Tormentor"),
            ra: api.owned("The Winged Dragon of Ra"),
          },
          champion: finals.champion,
          next: finals.next,
          rematch: api.finalsAccess("blimp-marik"),
          title: profile && profile.announced && profile.announced.citychamp,
          equipped: profile && profile.title,
          raIssues: afterIssues,
          silver: one.filter((line) => line.indexOf("The Winged Dragon of Ra") >= 0 || line.indexOf("Silver Fang") >= 0),
        };
      });
      assert.equal(result.before.slifer, 0);
      assert.equal(result.before.blocked, true);
      assert.equal(result.skip, false);
      assert.deepEqual(result.steps.map((step) => step.ok), [true, true, true, true, true]);
      assert.equal(result.steps[2].god, "Slifer the Sky Dragon");
      assert.equal(result.steps[2].granted, true);
      assert.equal(result.steps[3].god, "Obelisk the Tormentor");
      assert.equal(result.steps[3].granted, true);
      assert.equal(result.steps[4].god, "The Winged Dragon of Ra");
      assert.equal(result.steps[4].granted, true);
      assert.match(result.steps[4].line, /Battle City Champion/);
      assert.equal(result.again, false);
      assert.deepEqual(result.owned, { slifer: 1, obelisk: 1, ra: 1 });
      assert.equal(result.champion, true);
      assert.equal(result.next, "");
      assert.equal(result.rematch, "rematch");
      assert.equal(result.title, true);
      assert.ok(result.raIssues.some((line) => line.indexOf("You own 1") >= 0), result.raIssues.join(" | "));
      assert.ok(result.raIssues.some((line) => line.indexOf("max 3") >= 0), result.raIssues.join(" | "));
    });

    await t.test("god cards tribute, punish, and survive spells", async () => {
      const stats = await page.evaluate(() => {
        const api = window.ClassicDuel;
        const filler = [];
        for (let i = 0; i < 30; i++) filler.push("Silver Fang");
        api.begin(
          { id: "t", name: "You", main: ["Celtic Guardian", "Pot of Greed", "Raigeki", "Dark Hole", "Fissure"].concat(filler), extra: [] },
          "yugi",
          { rules: "city" }
        );
        const st = api.getState();
        st.firstTurn = false;
        st.turnCount = 4;
        st.phase = "main1";
        st.turn = "player";
        st.busy = false;
        const take = (name) => {
          const piles = [st.player.hand, st.player.deck, st.player.gy, st.ai.hand, st.ai.deck, st.ai.gy];
          for (let p = 0; p < piles.length; p++) {
            const i = piles[p].findIndex((c) => c && c.name === name);
            if (i >= 0) return piles[p].splice(i, 1)[0];
          }
          return { uid: "made-" + name, name: name, ref: api.card(name) };
        };
        const asMon = (card, pos) => ({ uid: card.uid, name: card.name, ref: card.ref, position: pos || "atk", faceup: true });
        st.player.hand = [take("Pot of Greed"), take("Raigeki"), take("Dark Hole"), take("Fissure")];
        st.player.monsters = [asMon(take("Slifer the Sky Dragon")), null, null, null, null];
        st.ai.monsters = [asMon(take("Celtic Guardian")), asMon(take("Obelisk the Tormentor")), null, null, null];
        api.render();
        const slifer = api.getStats(st.player.monsters[0]);
        const raCard = asMon(take("The Winged Dragon of Ra"));
        raCard.raPower = 2200;
        st.player.monsters[1] = raCard;
        const ra = api.getStats(raCard);
        st.ai.monsters[1].obeliskSpent = st.turnCount;
        const locked = api.attackLock("ai", 1);
        const cityTributes = api.tributesFor("The Winged Dragon of Ra");
        st.rules = "dk";
        const dkTributes = api.tributesFor("Obelisk the Tormentor");
        st.rules = "classic";
        const classicTributes = api.tributesFor("Slifer the Sky Dragon");
        const field = {
          celtic: st.ai.monsters[0] && st.ai.monsters[0].name,
          obelisk: st.ai.monsters[1] && st.ai.monsters[1].name,
        };
        return { slifer: slifer, ra: ra, locked: locked, cityTributes: cityTributes, dkTributes: dkTributes, classicTributes: classicTributes, field: field };
      });
      assert.equal(stats.slifer.atk, 4000);
      assert.equal(stats.slifer.def, 4000);
      assert.equal(stats.field.celtic || "", "");
      assert.equal(stats.field.obelisk, "Obelisk the Tormentor");
      assert.equal(stats.ra.atk, 2200);
      assert.equal(stats.ra.def, 2200);
      assert.equal(stats.locked, "Obelisk cannot attack");
      assert.equal(stats.cityTributes, 3);
      assert.equal(stats.dkTributes, 0);
      assert.equal(stats.classicTributes, 3);
    });

    await t.test("a lost finals duel does not advance the bracket", async () => {
      const lost = await page.evaluate(() => {
        const api = window.ClassicDuel;
        const before = api.finals().beaten.slice();
        const deck = api.decks.yugi;
        api.begin(deck, "blimp-mai", {
          rules: "city", mode: "city", cityFinals: true, cityDuelist: "blimp-mai", tourneyKey: "blimp-mai", rematch: true,
        });
        api.endMatch("ai", "The blimp test ends the duel.");
        const end = document.getElementById("end");
        return {
          beaten: api.finals().beaten,
          before: before,
          title: document.getElementById("endTitle").textContent,
          chips: document.getElementById("endChips").textContent,
          again: document.getElementById("btnAgain").textContent,
          visible: !!(end && end.classList.contains("active")),
        };
      });
      assert.deepEqual(lost.beaten, lost.before);
      assert.equal(lost.title, "Defeat");
      assert.match(lost.chips, /bracket is waiting/);
      assert.equal(lost.again, "Back to the Blimp");
      assert.equal(lost.visible, true);
    });

    await t.test("the phone bracket opens from the blimp and starts Mai", async () => {
      await page.evaluate(() => {
        const deck = window.ClassicDuel.decks.yugi;
        localStorage.setItem("classicDuel_settings_v1", JSON.stringify({
          anim: "on", cinematics: true, skipStory: false, muted: true, sound: false, volume: 0, music: 0,
        }));
        localStorage.setItem("classicDuel_wallet_v1", JSON.stringify({
          coins: 20, sets: [], cleared: ["pegasus"], rivalId: "kaiba",
        }));
        localStorage.setItem("classicDuel_profile_v1", JSON.stringify({
          name: "Darryl", avatar: "yugi", title: "citychamp",
          wins: 5, losses: 1, tournaments: 1, pegasusWins: 1, rematchWins: 0, cleanWins: 0,
          shadowWins: 0, trades: 0, challengeStreak: 0, bestStreak: 0,
          announced: {
            champion: true, slayer: true, foil: true, puzzle: true, deck: true,
            rematch: true, island: true, seasoned: true, binder: true, set: true,
            heir: true, steady: true, shadow: true, trader: true, weekstreak: true,
            locator: true, citychamp: true,
          },
          locators: ["clock", "corp", "park", "pier", "works", "market"],
        }));
        localStorage.setItem("classicDuel_battlecity_v1", JSON.stringify({
          version: 1, place: "clock", seenRules: true, quiet: 1, blimpSeen: false, marikSeen: false,
          beaten: [], champion: false,
          deck: { id: deck.id, name: deck.name, ace: deck.ace, main: deck.main.slice(), extra: (deck.extra || []).slice() },
        }));
        // A reload fires pagehide, which writes the live save back over these keys.
        const keep = new Set([
          "classicDuel_settings_v1", "classicDuel_wallet_v1",
          "classicDuel_profile_v1", "classicDuel_battlecity_v1",
        ]);
        const raw = localStorage.setItem.bind(localStorage);
        localStorage.setItem = (key, value) => {
          if (keep.has(key)) return;
          raw(key, value);
        };
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => window.ClassicDuel && window.ClassicDuel.finals && window.ClassicDuel.finals().open);
      await page.click("#btnCity");
      await page.waitForSelector("#city.active .city-blimp.revealed");
      const blimpLabel = await page.$eval(".city-blimp", (node) => node.getAttribute("aria-label"));
      assert.match(blimpLabel, /finals/i);
      await page.click(".city-blimp");
      await page.waitForSelector("#story.active #storyName");
      const speaker = await page.$eval("#storyName", (node) => node.textContent);
      assert.equal(speaker, "Kaiba");
      await page.click("#btnStorySkip");
      await page.waitForSelector("#blimp.active .blimp-row");
      const rows = await page.$$eval(".blimp-row", (nodes) => nodes.map((node) => ({
        name: node.querySelector(".nm").textContent,
        round: node.querySelector(".round").textContent,
        disabled: node.disabled,
        height: node.getBoundingClientRect().height,
        next: node.classList.contains("next"),
      })));
      assert.deepEqual(rows.map((row) => row.name), ["Mai", "Joey", "Odion", "Kaiba", "Marik"]);
      assert.deepEqual(rows.map((row) => row.round), ["Quarterfinal", "Quarterfinal", "Semifinal", "Semifinal", "Final"]);
      assert.equal(rows[0].disabled, false);
      assert.equal(rows[0].next, true);
      assert.ok(rows.every((row) => row.height >= 48), JSON.stringify(rows));
      assert.ok(rows.slice(1).every((row) => row.disabled));
      await mkdir(shots, { recursive: true });
      await page.screenshot({ path: path.join(shots, "blimp-finals.png") });
      await page.click(".blimp-row.next");
      await page.waitForFunction(() => {
        const vs = document.getElementById("vs").classList.contains("active");
        const duel = document.getElementById("duel").classList.contains("active");
        return vs || duel;
      });
      const vs = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        return {
          vs: document.getElementById("vs").classList.contains("active"),
          duel: document.getElementById("duel").classList.contains("active"),
          match: document.getElementById("vsMatch").textContent,
          taunt: document.getElementById("vsTaunt").textContent,
          ai: st && st.aiName,
          finals: !!(st && st.cityFinals),
          rules: st && st.rules,
        };
      });
      assert.ok(vs.vs || vs.duel);
      assert.equal(vs.ai, "Mai");
      assert.equal(vs.finals, true);
      assert.equal(vs.rules, "city");
      if (vs.vs) {
        assert.match(vs.match, /Mai/);
        assert.match(vs.taunt, /Harpies/);
      }
    });

    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
