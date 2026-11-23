import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chrome = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const pixel = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

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

test("opponent monsters stay visible, and Call of the Haunted can be activated", { timeout: 120000 }, async (t) => {
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
    if (msg.type() !== "error") return;
    if (/Failed to load resource|net::ERR/.test(msg.text())) return;
    errors.push(msg.text());
  });
  await page.setViewport({
    width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.ClassicDuel && window.ClassicDuel.card("Harpie Lady"));

  try {
    await page.evaluate((art) => {
      window.__FAST = true;
      window.__ART = art;
      const filler = [];
      for (let i = 0; i < 20; i++) filler.push("Silver Fang");
      window.ClassicDuel.begin(
        { id: "t", name: "You", main: ["Celtic Guardian", "Dark Magician", "Call of the Haunted", "Jar of Greed", "Mirror Force"].concat(filler), extra: [] },
        "mai",
        { rules: "city" }
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
      st.turnCount = 5;
      st.phase = "main1";
      st.turn = "player";
      st.busy = false;
      st.prompt = false;
      st.winner = null;
    }, pixel);

    await t.test("every opponent monster paints a full card, even face-down or missing art", async () => {
      const faces = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        const harpie = window.ClassicDuel.card("Harpie Lady");
        const cyber = window.ClassicDuel.card("Cyber Harpie Lady");
        st.ai.monsters = [null, null, null, null, null];
        st.ai.monsters[0] = {
          uid: "up", name: "Harpie Lady", ref: harpie, position: "atk", faceup: true,
        };
        st.ai.monsters[1] = {
          uid: "down", name: "Cyber Harpie Lady", ref: cyber, position: "def", faceup: false,
        };
        st.ai.monsters[2] = {
          uid: "tiny", name: "Skull Red Bird", ref: Object.assign({}, window.ClassicDuel.card("Skull Red Bird"), { image: window.__ART }),
          position: "atk", faceup: true,
        };
        st.ai.monsters[3] = {
          uid: "blank", name: "Mystery Bird", ref: { name: "Mystery Bird", image: "", isMonster: true, atk: 100, def: 100 },
          position: "def", faceup: true,
        };
        st.ai.monsters[4] = {
          uid: "noref", name: "No Card Data", position: "atk", faceup: true,
        };
        let threw = "";
        try { window.ClassicDuel.render(); } catch (err) { threw = String(err && err.message || err); }
        const read = (name) => {
          const zone = [...document.querySelectorAll("#aiMon .zone")].find((z) => z.dataset.name === name);
          const card = zone ? zone.querySelector(".card") : null;
          const style = card ? getComputedStyle(card) : null;
          return {
            zones: document.querySelectorAll("#aiMon .zone").length,
            tag: card ? card.tagName : "",
            className: card ? card.className : "",
            text: card ? card.textContent : "",
            src: card && card.getAttribute("src") ? card.getAttribute("src") : "",
            position: style ? style.position : "",
            background: style ? style.backgroundImage : "",
            offsetWidth: card ? card.offsetWidth : 0,
            offsetHeight: card ? card.offsetHeight : 0,
            clientWidth: zone ? zone.clientWidth : 0,
            clientHeight: zone ? zone.clientHeight : 0,
          };
        };
        return {
          threw: threw,
          harpie: read("Harpie Lady"),
          cyber: read("Cyber Harpie Lady"),
          tiny: read("Skull Red Bird"),
          blank: read("Mystery Bird"),
          noref: read("No Card Data"),
        };
      });

      assert.equal(faces.threw, "");
      for (const face of [faces.harpie, faces.cyber, faces.tiny, faces.blank, faces.noref]) {
        assert.equal(face.zones, 5);
        assert.ok(face.offsetWidth >= face.clientWidth * 0.9, face.className + " width");
        assert.ok(face.offsetHeight >= face.clientHeight * 0.9, face.className + " height");
        assert.equal(face.position, "absolute");
      }
      assert.equal(faces.harpie.tag, "IMG");
      assert.match(faces.harpie.src, /cards_small\/\d+\.jpg/);
      assert.equal(faces.harpie.className.includes("facedown"), false);
      assert.equal(faces.cyber.tag, "DIV");
      assert.match(faces.cyber.className, /facedown/);
      assert.match(faces.cyber.className, /\bdef\b/);
      assert.match(faces.cyber.background, /repeating-linear-gradient|linear-gradient/);
      assert.equal(faces.tiny.tag, "IMG");
      assert.equal(faces.tiny.src.startsWith("data:image"), true);
      assert.match(faces.blank.className, /named/);
      assert.equal(faces.blank.className.includes("facedown"), false);
      assert.match(faces.blank.text, /Mystery Bird/);
      assert.match(faces.noref.className, /named/);
      assert.match(faces.noref.text, /No Card Data/);
    });

    await t.test("a picture that fails to load still leaves a visible card", async () => {
      await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        st.ai.monsters = [null, null, null, null, null];
        st.ai.monsters[0] = {
          uid: "bad", name: "Broken Art", position: "atk", faceup: true,
          ref: { name: "Broken Art", image: "/no-such-card.jpg", isMonster: true, atk: 100, def: 100 },
        };
        window.ClassicDuel.render();
      });
      await page.waitForFunction(() => {
        const zone = [...document.querySelectorAll("#aiMon .zone")].find((z) => z.dataset.name === "Broken Art");
        return zone && zone.querySelector(".card.named");
      });
      const face = await page.evaluate(() => {
        const zone = [...document.querySelectorAll("#aiMon .zone")].find((z) => z.dataset.name === "Broken Art");
        const card = zone.querySelector(".card");
        return {
          zones: document.querySelectorAll("#aiMon .zone").length,
          className: card.className,
          text: card.textContent,
          offsetWidth: card.offsetWidth,
          clientWidth: zone.clientWidth,
        };
      });
      assert.equal(face.zones, 5);
      assert.match(face.className, /named/);
      assert.equal(face.className.includes("facedown"), false);
      assert.match(face.text, /Broken Art/);
      assert.ok(face.offsetWidth >= face.clientWidth * 0.9);
    });

    await t.test("the player activates Call of the Haunted on a later turn and Special Summons in Attack Position", async () => {
      const blocked = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        const bury = (name) => ({ uid: "gy-" + name, name: name, ref: window.ClassicDuel.card(name) });
        st.turn = "player";
        st.phase = "main1";
        st.busy = false;
        st.prompt = false;
        st.turnCount = 6;
        st.player.monsters = [null, null, null, null, null];
        st.player.spells = [null, null, null, null, null];
        st.player.gy = [bury("Celtic Guardian"), bury("Dark Magician"), bury("Obelisk the Tormentor")];
        st.player.spells[0] = Object.assign(bury("Call of the Haunted"), { faceup: false, setTurn: st.turnCount });
        window.ClassicDuel.render();
        document.querySelector('#plST .zone[data-index="0"]').click();
        return [...document.querySelectorAll("#sheetActions button")].map((b) => ({
          text: b.textContent, disabled: b.disabled,
        }));
      });
      assert.deepEqual(blocked.map((b) => b.text), ["Set this turn", "Close"]);
      assert.equal(blocked[0].disabled, true);

      await page.evaluate(() => document.querySelector("#sheetActions button.ghost").click());

      const choices = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        st.player.spells[0].setTurn = st.turnCount - 1;
        window.ClassicDuel.render();
        document.querySelector('#plST .zone[data-index="0"]').click();
        const buttons = [...document.querySelectorAll("#sheetActions button")].map((b) => b.textContent);
        document.querySelector("#sheetActions button").click();
        return {
          buttons: buttons,
          choices: [...document.querySelectorAll("#choiceBtns button")].map((b) => b.textContent),
          faceup: st.player.spells[0].faceup,
        };
      });
      assert.deepEqual(choices.buttons, ["Activate", "Close"]);
      assert.equal(choices.faceup, false);
      assert.ok(choices.choices.some((label) => label.indexOf("Celtic Guardian") >= 0));
      assert.ok(choices.choices.some((label) => label.indexOf("Dark Magician") >= 0));
      assert.equal(choices.choices.some((label) => label.indexOf("Obelisk") >= 0), false);
      assert.ok(choices.choices.indexOf("Cancel") >= 0);

      const summoned = await page.evaluate(async () => {
        const celtic = [...document.querySelectorAll("#choiceBtns button")].find((b) => b.textContent.indexOf("Celtic Guardian") >= 0);
        celtic.click();
        await new Promise((resolve) => setTimeout(resolve, 0));
        const st = window.ClassicDuel.getState();
        const mon = st.player.monsters.find((m) => m);
        const trap = st.player.spells[0];
        const zone = [...document.querySelectorAll("#plMon .zone")].find((z) => z.dataset.name === "Celtic Guardian");
        const card = zone ? zone.querySelector(".card") : null;
        return {
          name: mon && mon.name,
          position: mon && mon.position,
          faceup: mon && mon.faceup,
          way: mon && mon.summonWay,
          haunt: trap && trap.hauntUid,
          uid: mon && mon.uid,
          trapUp: trap && trap.faceup,
          gy: st.player.gy.map((c) => c.name),
          tag: card ? card.tagName : "",
          className: card ? card.className : "",
          offsetWidth: card ? card.offsetWidth : 0,
          clientWidth: zone ? zone.clientWidth : 0,
        };
      });
      assert.equal(summoned.name, "Celtic Guardian");
      assert.equal(summoned.position, "atk");
      assert.equal(summoned.faceup, true);
      assert.equal(summoned.way, "special");
      assert.equal(summoned.haunt, summoned.uid);
      assert.equal(summoned.trapUp, true);
      assert.equal(summoned.gy.indexOf("Celtic Guardian") >= 0, false);
      assert.ok(summoned.gy.indexOf("Obelisk the Tormentor") >= 0);
      assert.equal(summoned.tag, "IMG");
      assert.equal(summoned.className.includes("def"), false);
      assert.ok(summoned.offsetWidth >= summoned.clientWidth * 0.9);
    });

    await t.test("manual traps stay quiet on the opponent's turn, and reactive traps still answer a play", async () => {
      const quiet = await page.evaluate(() => {
        const st = window.ClassicDuel.getState();
        st.turn = "ai";
        st.busy = false;
        st.phase = "main1";
        st.player.spells[0] = Object.assign(
          { uid: "coth-set", name: "Call of the Haunted", ref: window.ClassicDuel.card("Call of the Haunted") },
          { faceup: false, setTurn: 0 }
        );
        st.player.spells[1] = Object.assign(
          { uid: "jar", name: "Jar of Greed", ref: window.ClassicDuel.card("Jar of Greed") },
          { faceup: false, setTurn: 0 }
        );
        st.player.spells[2] = Object.assign(
          { uid: "mirror", name: "Mirror Force", ref: window.ClassicDuel.card("Mirror Force") },
          { faceup: false, setTurn: 0 }
        );
        window.ClassicDuel.render();
        document.querySelector('#plST .zone[data-index="0"]').click();
        const haunted = [...document.querySelectorAll("#sheetActions button")].map((b) => b.textContent);
        document.querySelector("#sheetActions button.ghost").click();
        st.turn = "player";
        window.ClassicDuel.render();
        document.querySelector('#plST .zone[data-index="1"]').click();
        const jar = [...document.querySelectorAll("#sheetActions button")].map((b) => b.textContent);
        document.querySelector("#sheetActions button.ghost").click();
        document.querySelector('#plST .zone[data-index="2"]').click();
        const mirror = [...document.querySelectorAll("#sheetActions button")].map((b) => ({
          text: b.textContent, disabled: b.disabled,
        }));
        document.querySelector("#sheetActions button.ghost").click();
        return { haunted: haunted, jar: jar, mirror: mirror };
      });
      assert.equal(quiet.haunted.indexOf("Activate") >= 0, false);
      assert.deepEqual(quiet.jar, ["Activate", "Close"]);
      assert.equal(quiet.mirror[0].text, "Answers a play");
      assert.equal(quiet.mirror[0].disabled, true);
    });

    await t.test("the AI Special Summons from its Graveyard and will not revive a God", async () => {
      const result = await page.evaluate(async () => {
        const st = window.ClassicDuel.getState();
        const bury = (name, uid) => ({ uid: uid, name: name, ref: window.ClassicDuel.card(name) });
        st.turn = "ai";
        st.ai.monsters = [null, null, null, null, null];
        st.ai.spells = [null, null, null, null, null];
        st.ai.gy = [bury("Harpie Lady", "ai-lady"), bury("Obelisk the Tormentor", "ai-god"), bury("Niwatori", "ai-bird")];
        const ok = await window.ClassicDuel.playTrap("ai", "Call of the Haunted");
        window.ClassicDuel.render();
        const mon = st.ai.monsters.find((m) => m);
        const trap = st.ai.spells.find((s) => s && s.name === "Call of the Haunted");
        const zone = mon ? [...document.querySelectorAll("#aiMon .zone")].find((z) => z.dataset.name === mon.name) : null;
        const card = zone ? zone.querySelector(".card") : null;
        st.ai.monsters = [null, null, null, null, null];
        st.ai.spells = [null, null, null, null, null];
        st.ai.gy = [bury("Obelisk the Tormentor", "ai-god-2")];
        const godOnly = await window.ClassicDuel.playTrap("ai", "Call of the Haunted");
        window.ClassicDuel.render();
        const leftover = st.ai.spells.find((s) => s && s.name === "Call of the Haunted");
        return {
          ok: ok,
          name: mon && mon.name,
          position: mon && mon.position,
          faceup: mon && mon.faceup,
          haunt: trap && trap.hauntUid,
          uid: mon && mon.uid,
          tag: card ? card.tagName : "",
          className: card ? card.className : "",
          godOnly: godOnly,
          godOnField: st.ai.monsters.some((m) => m && m.name === "Obelisk the Tormentor"),
          trapStillSet: !!(leftover && leftover.faceup === false),
        };
      });
      assert.equal(result.ok, true);
      assert.equal(result.name, "Harpie Lady");
      assert.equal(result.position, "atk");
      assert.equal(result.faceup, true);
      assert.equal(result.haunt, result.uid);
      assert.equal(result.tag, "IMG");
      assert.equal(result.className.includes("facedown"), false);
      assert.equal(result.godOnly, false);
      assert.equal(result.godOnField, false);
      assert.equal(result.trapStillSet, true);
    });

    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
