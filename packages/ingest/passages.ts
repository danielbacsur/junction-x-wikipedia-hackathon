/**
 * Breaks every version of every article into blocks and writes the life of
 * each wording into the system-versioned passage table: when it entered the
 * article, when it left, and where it stood. Safe to run again: articles
 * already written are skipped.
 *
 *   node passages.ts                  every article, six processes
 *   node passages.ts --shard 0/6      one share of the articles
 *   node passages.ts --pages 1,2,3    only these page ids
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";

import { db } from "@wtt/package-db";
import {
  type Kind,
  clean,
  joinBlocks,
  similarity,
  splitBlocks,
  stems,
  words,
} from "@wtt/package-wikitext";
import { generateNKeysBetween } from "fractional-indexing";

import { progress } from "./parquet.ts";

const SHARDS = 6;
const FLUSH_ROWS = 20_000;
const SEARCHABLE = new Set<Kind | "end">(["prose", "list", "heading"]);
const LINEAGE = new Set<Kind | "end">(["prose", "list"]);

/** Two wordings count as one paragraph rewritten above this similarity. */
const SAME_SLOT = 0.4;

// A key this long means one gap was split hundreds of times, so the whole
// article gets fresh keys instead of ever longer ones.
const LONGEST_ORD = 200;

/** A wording stands in for the empty lines that end an article. */
const END = Buffer.alloc(8);

type Wording = {
  id: number;
  hash: Buffer;
  kind: Kind | "end";
  text: string;
  tokens?: Set<string>;
  lastSlot?: number;
};

type Live = {
  wording: Wording;
  dup: number;
  ord: string;
  gap: number;
  revId: number;
  bornRev: number;
  slot: number;
  prevHash: Buffer | null;
  sim: number | null;
  since: string;
};

type Placed = { key: number; wording: Wording; dup: number; gap: number };

type Version = { rev_id: number; row_start: string; text: string };

const hashOf = (text: string) =>
  createHash("sha1").update(text).digest().subarray(0, 8);

/** The positions of a longest run of entries whose order keys already rise. */
const longestRising = (ords: string[]): Set<number> => {
  const tails: number[] = [];
  const before = new Array<number>(ords.length).fill(-1);

  ords.forEach((ord, i) => {
    let low = 0;
    let high = tails.length;

    while (low < high) {
      const middle = (low + high) >> 1;
      if (ords[tails[middle]] < ord) low = middle + 1;
      else high = middle;
    }

    if (low > 0) before[i] = tails[low - 1];
    tails[low] = i;
  });

  const kept = new Set<number>();
  for (let i = tails.at(-1) ?? -1; i !== -1; i = before[i]) kept.add(i);

  return kept;
};

/** Everything one article's history writes to the database. */
const walk = (pageId: number, versions: Version[]) => {
  const wordings = new Map<string, Wording>();
  const fresh: Wording[] = [];
  const live = new Map<number, Live>();
  const slotsInUse = new Set<number>();
  const history: unknown[][] = [];
  let nextSlot = 1;

  const end: Wording = { id: 0, hash: END, kind: "end", text: "" };
  let endSeen = false;

  const wordingOf = (text: string, kind: Kind) => {
    let wording = wordings.get(text);

    if (!wording) {
      wording = { id: wordings.size + 1, hash: hashOf(text), kind, text };
      wordings.set(text, wording);
      fresh.push(wording);
    }

    return wording;
  };

  const row = (entry: Live) => [
    pageId,
    entry.wording.hash,
    entry.dup,
    entry.ord,
    entry.gap,
    entry.revId,
    entry.bornRev,
    entry.slot,
    entry.prevHash,
    entry.sim,
    entry.since,
  ];

  for (const version of versions) {
    const split = splitBlocks(version.text);

    if (joinBlocks(split) !== version.text) {
      throw new Error(`blocks of ${version.rev_id} do not rebuild its text`);
    }

    // Where every block of this version stands, copies numbered in order.
    const placed: Placed[] = [];
    const copies = new Map<number, number>();

    for (const block of split.blocks) {
      const wording = wordingOf(block.text, block.kind);
      const dup = copies.get(wording.id) ?? 0;
      copies.set(wording.id, dup + 1);
      placed.push({
        key: wording.id * 65_536 + dup,
        wording,
        dup,
        gap: block.gap,
      });
    }

    if (split.tail > 0) {
      placed.push({ key: 0, wording: end, dup: 0, gap: split.tail - 1 });
      endSeen = true;
    }

    const now = new Set(placed.map((place) => place.key));

    // Wordings that left the article: their row ends here.
    const left: Live[] = [];

    for (const [key, entry] of live) {
      if (now.has(key)) continue;

      history.push([...row(entry), version.row_start]);
      live.delete(key);
      left.push(entry);

      if (entry.slot > 0) {
        slotsInUse.delete(entry.slot);
        entry.wording.lastSlot = entry.slot;
      }
    }

    // Wordings that stayed keep their order key unless they moved. The
    // longest run still in order stays put, and the rest are placed again.
    const stayed = placed.filter((place) => live.has(place.key));
    const ords = stayed.map((place) => live.get(place.key)!.ord);

    let renumber = ords.some((ord) => ord.length > LONGEST_ORD);
    let inOrder: Set<number> | undefined;

    for (let i = 1; i < ords.length && !renumber; i++) {
      if (ords[i - 1] >= ords[i]) {
        inOrder = longestRising(ords);
        break;
      }
    }

    const settled = new Set<number>();

    if (!renumber) {
      stayed.forEach((place, i) => {
        if (!inOrder || inOrder.has(i)) settled.add(place.key);
      });
    }

    // Hand out order keys to every run of blocks that is new or has moved,
    // between the settled blocks on either side of it.
    const newOrd = new Map<number, string>();

    for (let i = 0; i < placed.length;) {
      if (settled.has(placed[i].key)) {
        i++;
        continue;
      }

      let j = i;
      while (j < placed.length && !settled.has(placed[j].key)) j++;

      const before =
        i > 0
          ? (live.get(placed[i - 1].key)?.ord ?? newOrd.get(placed[i - 1].key))
          : undefined;
      const after =
        j < placed.length ? live.get(placed[j].key)!.ord : undefined;
      const keys = generateNKeysBetween(before ?? null, after ?? null, j - i);

      for (let k = i; k < j; k++) newOrd.set(placed[k].key, keys[k - i]);
      i = j;
    }

    const leftForPairing = left.filter((entry) =>
      LINEAGE.has(entry.wording.kind),
    );
    const claimed = new Set<Live>();

    for (const place of placed) {
      const entry = live.get(place.key);

      if (entry) {
        const ord = newOrd.get(place.key) ?? entry.ord;
        if (ord === entry.ord && place.gap === entry.gap) continue;

        // Same wording, new place: the old row ends and a new one starts,
        // but the wording was born when it was born.
        history.push([...row(entry), version.row_start]);
        entry.ord = ord;
        entry.gap = place.gap;
        entry.revId = version.rev_id;
        entry.since = version.row_start;
        continue;
      }

      let slot = 0;
      let prevHash: Buffer | null = null;
      let sim: number | null = null;

      if (LINEAGE.has(place.wording.kind)) {
        const revived = place.wording.lastSlot;

        if (revived !== undefined && !slotsInUse.has(revived)) {
          // This exact wording stood here before: it takes its place back.
          slot = revived;
          const replaced = leftForPairing.find(
            (entry) => entry.slot === slot && !claimed.has(entry),
          );

          if (replaced) {
            claimed.add(replaced);
            prevHash = replaced.wording.hash;
          }
        } else {
          const tokens = (place.wording.tokens ??= new Set(
            words(place.wording.text),
          ));
          let best: Live | undefined;

          for (const candidate of leftForPairing) {
            if (claimed.has(candidate) || slotsInUse.has(candidate.slot))
              continue;

            const theirs = (candidate.wording.tokens ??= new Set(
              words(candidate.wording.text),
            ));
            const score = similarity(tokens, theirs);

            if (score >= SAME_SLOT && score > (sim ?? 0)) {
              best = candidate;
              sim = score;
            }
          }

          if (best) {
            claimed.add(best);
            slot = best.slot;
            prevHash = best.wording.hash;
          } else {
            slot = nextSlot++;
            sim = null;
          }
        }

        slotsInUse.add(slot);
      }

      live.set(place.key, {
        wording: place.wording,
        dup: place.dup,
        ord: newOrd.get(place.key)!,
        gap: place.gap,
        revId: version.rev_id,
        bornRev: version.rev_id,
        slot,
        prevHash,
        sim,
        since: version.row_start,
      });
    }

    // The proof that the table can rebuild this version: exactly these
    // blocks are live, and sorting by order key gives exactly this order.
    if (live.size !== placed.length) {
      throw new Error(
        `${version.rev_id}: ${live.size} live, ${placed.length} placed`,
      );
    }

    for (let i = 1; i < placed.length; i++) {
      if (live.get(placed[i - 1].key)!.ord >= live.get(placed[i].key)!.ord) {
        throw new Error(
          `${version.rev_id}: order keys do not rise at block ${i}`,
        );
      }
    }
  }

  const texts = fresh.map((wording) => {
    const text = SEARCHABLE.has(wording.kind) ? clean(wording.text) : "";

    return [
      wording.hash,
      wording.kind,
      text.length,
      wording.text,
      text,
      stems(text),
    ];
  });

  if (endSeen) texts.push([END, "end", 0, "", "", ""]);

  return { history, current: [...live.values()].map(row), texts };
};

const columns = `page_id, hash, dup, ord, gap, rev_id, born_rev, slot, prev_hash, sim`;

const loadShard = async (pages: number[], label: string) => {
  const tick = progress(label);
  let versionsDone = 0;

  await db().session(async (session) => {
    await session.query("SET system_versioning_insert_history = 1");

    let history: unknown[][] = [];
    let current: unknown[][] = [];
    let texts: unknown[][] = [];

    // Shards write the same wordings at the same time, and InnoDB settles
    // a clash by rolling one of them back, so that one simply goes again.
    const retrying = async (work: () => Promise<void>) => {
      for (let attempt = 1; ; attempt++) {
        try {
          return await work();
        } catch (error) {
          const deadlock = (error as { errno?: number }).errno === 1213;
          if (!deadlock || attempt === 10) throw error;
        }
      }
    };

    const flush = async () => {
      // Wordings go first and on their own: they are shared between
      // articles, and sorting them makes every shard lock in the same order.
      texts.sort((a, b) => Buffer.compare(a[0] as Buffer, b[0] as Buffer));

      for (let i = 0; i < texts.length; i += 2_000) {
        await retrying(() =>
          session.batch(
            `INSERT IGNORE INTO passage_text (hash, kind, chars, wikitext, text, stems)
             VALUES (?, ?, ?, ?, ?, ?)`,
            texts.slice(i, i + 2_000),
          ),
        );
      }

      await retrying(async () => {
        await session.query("START TRANSACTION");

        for (let i = 0; i < history.length; i += 10_000) {
          await session.batch(
            `INSERT INTO passage (${columns}, row_start, row_end)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            history.slice(i, i + 10_000),
          );
        }

        for (let i = 0; i < current.length; i += 10_000) {
          await session.batch(
            `INSERT INTO passage (${columns}, row_start)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            current.slice(i, i + 10_000),
          );
        }

        await session.query("COMMIT");
      });

      history = [];
      current = [];
      texts = [];
    };

    for (const pageId of pages) {
      const versions = await db().query<Version>(
        `SELECT rev_id, row_start, text
         FROM revision FOR SYSTEM_TIME ALL
         WHERE page_id = ?
         ORDER BY row_start`,
        [pageId],
      );

      const written = walk(pageId, versions);

      history.push(...written.history);
      current.push(...written.current);
      texts.push(...written.texts);

      if (history.length + current.length + texts.length > FLUSH_ROWS) {
        await flush();
      }

      tick((versionsDone += versions.length));
    }

    await flush();
  });

  tick(versionsDone, true);
};

const argument = (name: string) => {
  const at = process.argv.indexOf(name);
  return at === -1 ? undefined : process.argv[at + 1];
};

const shard = argument("--shard");
const only = argument("--pages");

if (shard || only) {
  const done = new Set(
    (
      await db().query<{ page_id: number }>(
        "SELECT DISTINCT page_id FROM passage FOR SYSTEM_TIME ALL",
      )
    ).map((row) => row.page_id),
  );

  const [index, of] = (shard ?? "0/1").split("/").map(Number);

  const pages = only
    ? only.split(",").map(Number)
    : (
        await db().query<{ page_id: number }>(
          "SELECT page_id FROM revision WHERE page_id % ? = ? ORDER BY page_id",
          [of, index],
        )
      ).map((row) => row.page_id);

  await loadShard(
    pages.filter((page) => !done.has(page)),
    shard ? `shard ${shard}` : "pages",
  );
} else {
  // One process per share of the articles: the work is splitting and
  // hashing text, which a single JavaScript thread does one at a time.
  await Promise.all(
    Array.from(
      { length: SHARDS },
      (_, index) =>
        new Promise<void>((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [process.argv[1], "--shard", `${index}/${SHARDS}`],
            { stdio: "inherit" },
          );

          child.on("exit", (code) =>
            code === 0 ? resolve() : reject(new Error(`shard ${index} failed`)),
          );
        }),
    ),
  );

  const [counts] = await db().query<Record<string, number>>(
    `SELECT (SELECT COUNT(*) FROM passage FOR SYSTEM_TIME ALL) AS lifetimes,
            (SELECT COUNT(*) FROM passage) AS live,
            (SELECT COUNT(*) FROM passage_text) AS wordings`,
  );

  console.log(counts);
}

await db().end();
