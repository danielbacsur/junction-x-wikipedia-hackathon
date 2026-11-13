import { describe, expect, it } from "vitest";

import {
  clean,
  joinBlocks,
  similarity,
  splitBlocks,
  stems,
  words,
} from "./index.ts";

const article = [
  "{{Taistelu",
  "| nimi = Talvisota",
  "| tappiot1 = 25 904 kaatunutta<ref>Leskinen 2005.</ref>",
  "}}",
  "",
  "",
  "'''Talvisota''' käytiin [[Suomi|Suomen]] ja [[Neuvostoliitto|Neuvostoliiton]] välillä.<ref>{{Kirjaviite",
  " | Tekijä = Juutilainen",
  "}}</ref> Sota päättyi [[Moskovan rauhansopimus (1940)|Moskovan rauhaan]].",
  "",
  "== Tausta ==",
  "* [[1939]] – neuvottelut alkoivat",
  '{| class="wikitable"',
  "|-",
  "| solu",
  "|}",
  "[[Luokka:Talvisota]]",
  "",
].join("\n");

describe("splitBlocks", () => {
  it("gives the exact text back", () => {
    for (const text of [
      article,
      "",
      "\n",
      "a",
      "a\n",
      "\n\na\n\n\nb",
      "{{auki\n\nei kiinni",
    ]) {
      expect(joinBlocks(splitBlocks(text))).toBe(text);
    }
  });

  it("keeps a template or a reference that spans lines in one block", () => {
    const { blocks } = splitBlocks(article);

    expect(blocks[0].text.startsWith("{{Taistelu")).toBe(true);
    expect(blocks[0].text.endsWith("}}")).toBe(true);
    expect(blocks[1].text).toContain("Sota päättyi");
    expect(blocks[1].gap).toBe(2);
  });

  it("names what each block is", () => {
    const kinds = splitBlocks(article).blocks.map((block) => block.kind);

    expect(kinds).toEqual([
      "template",
      "prose",
      "heading",
      "list",
      "table",
      "table",
      "table",
      "table",
      "meta",
    ]);
  });

  it("starts a new block at a heading even when markup was left open", () => {
    const { blocks } = splitBlocks("{{auki\ntekstiä\n== Otsikko ==\nlisää");

    expect(blocks.map((block) => block.text)).toEqual([
      "{{auki\ntekstiä",
      "== Otsikko ==",
      "lisää",
    ]);
  });
});

describe("clean", () => {
  it("leaves the words a reader sees", () => {
    const { blocks } = splitBlocks(article);

    expect(clean(blocks[1].text)).toBe(
      "Talvisota käytiin Suomen ja Neuvostoliiton välillä. Sota päättyi Moskovan rauhaan.",
    );
    expect(clean(blocks[2].text)).toBe("Tausta");
    expect(clean(blocks[3].text)).toBe("1939 – neuvottelut alkoivat");
  });

  it("drops files with links inside their captions", () => {
    expect(
      clean(
        "[[Tiedosto:A.jpg|thumb|Kuva [[Helsinki|Helsingistä]] 1918]]Teksti jatkuu.",
      ),
    ).toBe("Teksti jatkuu.");
  });

  it("reads entities and external links", () => {
    expect(
      clean("337&nbsp;000 miestä [https://example.org lähteen] mukaan"),
    ).toBe("337 000 miestä lähteen mukaan");
  });
});

describe("stems", () => {
  it("makes inflected Finnish forms the same word", () => {
    const forms = ["Mannerheim", "Mannerheimin", "Mannerheimille"].map(stems);

    expect(new Set(forms).size).toBe(1);
  });

  it("measures shared words", () => {
    const a = new Set(words("sota päättyi Moskovan rauhaan"));
    const b = new Set(words("sota päättyi Moskovan rauhansopimukseen"));

    expect(similarity(a, b)).toBe(0.75);
    expect(similarity(a, new Set())).toBe(0);
  });
});
