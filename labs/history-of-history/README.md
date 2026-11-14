# History of history

## The question

The brief asks for "tracing how the story of a historical event has been
rewritten". Can plain SQL over the system-versioned `revision` table show how
Finnish Wikipedia's telling of Finnish history changed between 2003 and 2026?

Three measurements, each taken on the articles **as they stood** at 23 dates
(every year-end from 2004 to 2025, plus 1 October 2026) with
`FOR SYSTEM_TIME AS OF`:

1. Which name the 1918 war goes by: sisällissota (civil war), vapaussota (war
   of liberation, the White name), kansalaissota (citizens' war), luokkasota
   (class war), veljessota (war of brothers), punakapina (red rebellion).
2. Which years of history the articles talk about.
3. How many articles mention Russia, the Soviet Union, Sweden, Germany and Nato.

## What we found

Yes. Unless a line says otherwise, every number below comes from a
`FOR SYSTEM_TIME` query on MariaDB. DuckDB on the Parquet files reproduced the
snapshot counts, the per-version counts, the swaps, the year matrix and the
word counts without a single difference (see "How it was measured").

### 1. The name of the 1918 war

Running-text mentions of each name, in all articles as they stood on the date
(`uv run report.py` prints all 23 dates):

| As of       | Articles | sisällissota | vapaussota | kansalaissota | luokkasota | veljessota | punakapina | sisällissota share | vapaussota share |
| ----------- | -------: | -----------: | ---------: | ------------: | ---------: | ---------: | ---------: | -----------------: | ---------------: |
| 2004-12-31  |      706 |           48 |          6 |             8 |          2 |          2 |          3 |             69.6 % |            8.7 % |
| 2005-12-31  |    2,193 |          127 |         22 |            20 |          7 |          2 |          3 |             70.2 % |           12.2 % |
| 2007-12-31  |    5,815 |          545 |        168 |            51 |         13 |          4 |          4 |             69.4 % |           21.4 % |
| 2008-12-31  |    7,464 |        2,070 |        233 |            81 |         25 |          5 |         10 |             85.4 % |            9.6 % |
| 2011-12-31  |   10,392 |        3,912 |        304 |            93 |         25 |         11 |          9 |             89.8 % |            7.0 % |
| 2016-12-31  |   14,681 |        4,657 |        447 |           115 |         45 |         16 |         10 |             88.0 % |            8.5 % |
| 2021-12-31  |   17,860 |        5,601 |        623 |           146 |         85 |         20 |         20 |             86.2 % |            9.6 % |
| 2022-12-31  |   18,426 |        5,798 |        719 |           148 |         92 |         21 |         19 |             85.3 % |           10.6 % |
| 2026-10-01  |   19,742 |        6,381 |        800 |           175 |         93 |         23 |         19 |             85.2 % |           10.7 % |

- **No crossover at the top.** "Sisällissota" led at all 23 dates: 69.6 % of
  running-text mentions at the end of 2004 (48 of 69), a peak of 89.8 % at the
  end of 2011, 85.2 % on 1 October 2026 (6,381 of 7,491).
- **One crossover, for second place, in 2005.** At the end of 2004
  "kansalaissota" was second (8 mentions against 6 for "vapaussota"). A year
  later "vapaussota" had passed it (22 against 20) and never gave the place
  back: 800 against 175 today.
- **The White name has been gaining since 2011.** Its share of running text
  fell to 7.0 % at the end of 2011 and stands at 10.7 % in 2026. Mentions grew
  2.6 times (304 to 800) while "sisällissota" grew 1.6 times (3,912 to 6,381).
  The biggest step is 2022: +96 mentions in one year.
- **A plain `LIKE '%vapaussod%'` tells the wrong story.** Of the 3,126
  "vapaussota" strings in the 2026 wikitext, 1,840 (59 %) are the medal
  "Vapaussodan muistomitali", 423 are other countries' wars (Viron vapaussota),
  44 are hidden link targets, 19 sit in category or file links, and 800 are
  running text. Counted raw, "vapaussota" holds 24.7 % of all name mentions,
  and held 33.6 % at the end of 2010. In running text it never passed 21.4 %.
- **The main article never changed its title, but it changed its opening
  name.** The article (page 1150, 3,357 versions) opened as "Suomen
  sisällissota" from 26 August 2003, as **"Suomen vuoden 1918 sota"** (Finland's
  war of 1918) from 4 April 2004 for 505 days, and as "Suomen sisällissota"
  again since 22 August 2005. At the end of 2004 its first sentence listed
  eight names and called "vuoden 1918 tapahtumat" (the events of 1918) the most
  neutral. "Suomen vapaussota" opened the article in 13 versions between 2006
  and 2026, which together stood for 0.2 days.

**The edit war over the name.** In the whole history (862,076 versions), 542
edits in 237 articles lowered the count of one name and raised the count of
another in the same article (570 name pairs):

| Swap                         | Edits | Articles | Not themselves reverts | Of those, later undone |
| ---------------------------- | ----: | -------: | ---------------------: | ---------------------: |
| vapaussota → sisällissota    |   221 |      134 |                    138 |                9 (7 %) |
| sisällissota → vapaussota    |   157 |       74 |                    146 |             102 (70 %) |
| kansalaissota → sisällissota |   116 |      101 |                    110 |                6 (5 %) |
| sisällissota → kansalaissota |    24 |       17 |                     16 |               4 (25 %) |
| 18 other pairs               |    52 |          |                        |                        |

- **Replacing "sisällissota" with "vapaussota" is undone 70 % of the time, the
  opposite edit 7 %.** Of 146 fresh attempts, 102 were undone, half of them
  within 35 minutes and 60 within the hour.
- Anonymous editors made 90 of the 146 attempts and 80 of those were undone
  (89 %). Named editors made 56, and 22 were undone (39 %).
- On the main article itself: 27 attempts between 2006 and 2026, 27 undone.
  The article has 68 swaps in all, the first on 20 October 2005 and the last
  on 12 September 2026.
- 2019 is the peak year with 23 attempts. The two years with the most fresh
  edits in the other direction are 2009 (23) and 2008 (19).

The cases with the most mentions moved, and the ones whose edit summaries argue
about the name (times are UTC, all 570 are in `data/war-name-swaps.json`):

| When (UTC)       | Rev id   | Article                   | User            | Change                                          | What happened next                                              | Edit summary                                                                                                                              |
| ---------------- | -------- | ------------------------- | --------------- | ----------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 2010-06-27 18:27 | 8696000  | Suomen sisällissota       | 80.186.192.126  | sisällissota 70 → 55, vapaussota 13 → 27        | undone after 18 min by Mikko Paananen (rev 8696085)             | none                                                                                                                                      |
| 2019-04-19 19:56 | 18091848 | Suomen sisällissota       | 37.98.135.150   | sisällissota 100 → 86, vapaussota 19 → 33       | undone after 160 s by Superkissan (rev 18091856)                | none                                                                                                                                      |
| 2012-05-07 20:19 | 11596801 | Suomen sisällissota       | Myllhei66       | sisällissota 63 → 54, vapaussota 33 → 40        | undone after 12 min by Haltiamieli (rev 11596847, 7 edits back) | none                                                                                                                                      |
| 2009-06-30 19:49 | 6964540  | Suomen sisällissota       | 88.193.136.25   | sisällissota 65 → 57, vapaussota 13 → 21        | undone after 27 s by Kallerna (rev 6964543)                     | none                                                                                                                                      |
| 2019-11-05 18:22 | 18517752 | Suomen sisällissota       | BekanntUser     | sisällissota 103 → 95, vapaussota 21 → 28       | undone after 54 s by Paranaja (rev 18517756)                    | "Sodan nimi korjattu alkuperäiseen muotoonsa." (The war's name corrected to its original form.)                                           |
| 2017-12-25 18:41 | 16982122 | Suomen sisällissota       | 85.76.105.243   | sisällissota 87 → 83, vapaussota 19 → 23        | undone after 15 min by Stryn (rev 16982133)                     | "Kyseessä oli vapaussota." (It was a war of liberation.) The revert: "ei näin ainakaan, keskustele ensin" (not like this, discuss first)  |
| 2019-04-20 14:42 | 18093553 | Matti Laurila             | 37.98.135.150   | sisällissota 8 → 4, vapaussota 10 → 14          | undone after 20 s by Superkissan (rev 18093558)                 | "Sisällissota nimike lapualaisten kohdalla on halventava" (the label civil war is demeaning for the people of Lapua)                      |
| 2013-01-08 20:37 | 12554338 | Kosti Pollari             | Htm             | vapaussota 8 → 3, sisällissota 0 → 5            | stands (it is a revert of 5 edits by 85.157.160.70)             | 'Wikipediassa on päädytty käyttämään nimeä "sisällissota"' (Wikipedia has settled on the name "sisällissota")                             |
| 2021-06-19 01:38 | 19839144 | Martti Eklund             | Risukarhi       | vapaussota 5 → 0, sisällissota 5 → 10           | stands (it is a revert of rev 19837584 by 80.220.251.226)       | "Wikipedian linjauksen vastainen nimityksen muutos" (a change of name against Wikipedia's policy)                                         |
| 2009-10-08 12:13 | 7427842  | Vapaussodan Perinneliitto | 134.93.52.128   | vapaussota 12 → 4, sisällissota 0 → 8           | stands                                                          | "Siistitty hieman neutraalimmaksi" (tidied to be a little more neutral)                                                                   |

Two more things the same queries showed:

- **One editor shaped the curve.** 1,186 of the 1,525 running-text
  "sisällissota" mentions gained in 2008 (net), and 1,392 of the 1,538 medal
  mentions gained in 2008 and 2009, came from one account, in 507 and 1,172
  articles (`uv run duck_explore.py`, DuckDB only).
  In 2022, 72 of the net +96 "vapaussota" mentions came from one account
  editing 188 articles.
- **The infobox changed sides once.** From 24 December 2005, when the article
  got its infobox, belligerent 1 was the Reds ("Punaiset", later "Punainen
  Suomi") in 1,576 versions over 2,353 days. Since rev 11715096 on 3 June 2012
  it is the Whites ("Suomen hallituksen joukot (valkoiset)", today
  "valkoiset"): 964 versions, 5,233 days, never switched back.

### 2. History of history: which years the articles talk about

Every four-digit year from 1000 to 2026 mentioned outside footnotes, in all
articles as they stood on the date. Each column is one reading of Wikipedia and
adds up to 100 %. The full matrix (103 decades by 23 dates, and 1,027 years by
23 dates) is in `data/year-heatmap.json` and `data/year-heatmap-years.json`.

| Decade mentioned  |   2006 |    2009 |    2011 |    2017 |    2021 |    2026 | Mentions 2026 |
| ----------------- | -----: | ------: | ------: | ------: | ------: | ------: | ------------: |
| before 1800       |  12.22 |    7.77 |    8.16 |    8.41 |    8.23 |    7.80 |        39,873 |
| 1800s             |   0.99 |    0.69 |    0.74 |    0.79 |    0.82 |    0.99 |         5,069 |
| 1810s             |   0.59 |    0.45 |    0.51 |    0.62 |    0.63 |    0.66 |         3,387 |
| 1820s             |   0.62 |    0.46 |    0.53 |    0.60 |    0.63 |    0.62 |         3,151 |
| 1830s             |   0.66 |    0.48 |    0.60 |    0.72 |    0.76 |    0.72 |         3,683 |
| 1840s             |   0.65 |    0.50 |    0.65 |    0.80 |    0.85 |    0.83 |         4,246 |
| 1850s             |   0.88 |    0.78 |    0.98 |    1.15 |    1.20 |    1.16 |         5,933 |
| 1860s             |   1.28 |    1.13 |    1.36 |    1.60 |    1.73 |    1.61 |         8,236 |
| 1870s             |   1.09 |    1.26 |    1.48 |    1.61 |    1.75 |    1.68 |         8,604 |
| 1880s             |   1.31 |    1.69 |    2.11 |    2.24 |    2.32 |    2.21 |        11,316 |
| 1890s             |   1.67 |    2.52 |    2.99 |    2.98 |    3.11 |    2.94 |        15,012 |
| 1900s             |   3.00 |    4.38 |    4.40 |    4.80 |    4.93 |    4.78 |        24,411 |
| 1910s             |   6.05 |   11.15 |   10.50 |    8.92 |    8.35 |    8.34 |        42,621 |
| 1920s             |   5.10 |    8.88 |    8.50 |    7.37 |    7.17 |    7.26 |        37,099 |
| 1930s             |   6.20 |    8.05 |    7.77 |    7.19 |    6.97 |    7.28 |        37,238 |
| 1940s             |   8.32 |    8.74 |    8.61 |    7.65 |    7.33 |    7.23 |        36,974 |
| 1950s             |   5.82 |    5.61 |    5.50 |    5.27 |    5.17 |    5.37 |        27,470 |
| 1960s             |   5.43 |    5.02 |    4.87 |    4.81 |    4.83 |    4.86 |        24,838 |
| 1970s             |   7.52 |    6.45 |    6.10 |    5.70 |    5.57 |    5.55 |        28,362 |
| 1980s             |   7.58 |    5.42 |    5.01 |    4.96 |    5.02 |    4.93 |        25,178 |
| 1990s             |  10.76 |    6.89 |    6.30 |    5.87 |    5.76 |    5.70 |        29,140 |
| 2000s             |  12.18 |   11.25 |    9.90 |    8.34 |    7.33 |    6.61 |        33,794 |
| 2010s             |   0.08 |    0.41 |    2.40 |    7.56 |    8.48 |    7.73 |        39,501 |
| 2020s             |   0.01 |    0.01 |    0.02 |    0.04 |    1.06 |    3.14 |        16,048 |
| all year mentions | 44,422 | 149,119 | 194,388 | 327,624 | 411,486 | 511,184 |               |

- **In 2008 the history of Finland stopped being about the present.** At the
  end of 2004 to 2007 the most mentioned year was one Wikipedia had lived
  through (2003, 2003, 2006, 2007). From the end of 2008 it is 1918 at every date: 4,282 mentions
  then, 11,052 in 2026, ahead of 1917 (6,991) and 1930 (6,905).
- **2006 to 2026: the recent past lost, 1890 to 1939 gained.** The 1990s fell
  from 10.76 % to 5.70 % (−5.06 points), the 1980s by 2.66, the 1970s by 1.97,
  and the 2000s from 12.18 % to 6.61 %. The 1910s gained 2.29 points (6.05 %
  to 8.34 %), the 1920s 2.16, the 1900s 1.78, the 1890s 1.27, the 1930s 1.09.
- **The 1910s peaked in 2009, not at the centenary.** 11.15 % at the end of
  2009, 8.92 % at the end of 2017, 8.34 % in 2026. From the end of 2016 to the
  end of 2018, across the centenaries of independence and of the war, the
  1910s lost more share than any other decade before 2000 (−0.34 points).
- **After 2017 the winner is 1808 and 1809.** All year mentions grew 1.56 times
  between the end of 2017 and October 2026. The decade 1800 to 1809 grew 1.95
  times (2,598 to 5,069) and gained the most share of any decade before 2000
  (+0.20 points). The two fastest-growing years with at least 300 mentions are
  1809 (2.44 times, 774 to 1,889) and 1808 (2.04 times, 581 to 1,184), the
  years of the Finnish War. The slowest is 1918 (1.27 times, 8,699 to 11,052),
  and the 1910s lost the most share (−0.58 points).
- **After 2022 it is the 1930s.** From the end of 2021 to October 2026 all
  year mentions grew 1.24 times. The 1930s gained the most share (+0.31
  points, 28,689 to 37,238), then the 1950s (+0.20) and 1800 to 1809 (+0.17).
  The 1890s (−0.17), 1900s (−0.15) and 1860s (−0.12) lost the most. 1809
  (1.78 times) and 1808 (1.61 times) are again the fastest-growing years.

### 3. Russia, the Soviet Union, Sweden, Germany and Nato

Share of the articles that existed on the date in which the word occurs at
least once (all 23 dates and two more words are in `data/term-shares.json`):

| As of                | Articles |  Ruotsi |  Venäjä |   Saksa | Neuvostoliitto | jatkosota | talvisota |   Nato | suomettu- |
| -------------------- | -------: | ------: | ------: | ------: | -------------: | --------: | --------: | -----: | --------: |
| 2004-12-31           |      706 | 21.67 % | 14.87 % |  7.65 % |         9.49 % |    5.81 % |    5.67 % | 0.28 % |    0.57 % |
| 2008-12-31           |    7,464 | 17.52 % | 18.92 % | 16.08 % |        11.25 % |   10.70 % |    9.51 % | 0.36 % |    0.27 % |
| 2012-12-31           |   11,137 | 19.84 % | 19.65 % | 16.94 % |        12.21 % |   12.04 % |   11.04 % | 0.44 % |    0.27 % |
| 2016-12-31           |   14,681 | 20.75 % | 19.49 % | 15.90 % |        11.62 % |   10.97 % |   10.47 % | 0.50 % |    0.27 % |
| 2021-12-31           |   17,860 | 21.72 % | 20.02 % | 15.86 % |        11.52 % |   10.49 % |    9.87 % | 0.54 % |    0.33 % |
| 2023-12-31           |   18,853 | 22.24 % | 20.49 % | 15.72 % |        11.57 % |   10.53 % |    9.90 % | 0.83 % |    0.39 % |
| 2026-10-01           |   19,742 | 23.22 % | 21.19 % | 16.06 % |        11.88 % |   11.05 % |   10.19 % | 0.96 % |    0.48 % |
| articles, 2026-10-01 |          |   4,584 |   4,183 |   3,170 |          2,346 |     2,182 |     2,012 |    189 |        94 |

- **Nato nearly doubled after 2021.** 96 articles (0.54 %) at the end of 2021,
  189 (0.96 %) on 1 October 2026. At every year-end from 2007 to 2021 it was
  between 0.36 % and 0.54 %.
- **"Suomettuminen" (Finlandization) came back.** Between 0.26 % and 0.28 % at
  every year-end from 2008 to 2019, then 59 articles (0.33 %) in 2021 and 94
  (0.48 %) in 2026.
- **"Venäjä" is in nearly twice as many articles as "Neuvostoliitto".** 4,183
  against 2,346 in 2026. "Neuvostoliitto" has stayed between 11.25 % and
  12.28 % since 2006, "Venäjä" went from 20.02 % to 21.19 % after 2021.
- **Sweden and Russia traded places twice.** "Ruotsi" led through 2006,
  "Venäjä" from 2007 to 2011, "Ruotsi" again since 2012, and the gap is now
  2 points (23.22 % against 21.19 %).

MariaDB ran all 23 dates and DuckDB reproduced all 253 numbers.

## How it was measured

**Snapshots.** 23 dates: `YYYY-12-31 23:59:59` UTC for 2004 to 2025 and
`2026-10-01 23:59:59` (the last edit in the dump is from 10:59 that day). Each
measurement is one `SELECT ... FROM wtt.revision FOR SYSTEM_TIME AS OF
TIMESTAMP '<date>'`, so it sees exactly the 706 to 19,742 articles that existed
on that date, each in the version that stood then.

**Names.** Matching is case-insensitive on the wikitext. A name is its stem
followed by an inflected form of "sota" (sota, sodan, sotaa, sodassa, sotien,
sodissa: `so[dt][ai]`):

| Name          | Pattern               | Matches                                         | Does not match        |
| ------------- | --------------------- | ----------------------------------------------- | --------------------- |
| sisällissota  | `sisällisso[dt][ai]`  | sisällissota, sisällissodan, sisällissotien     |                       |
| vapaussota    | `vapausso[dt][ai]`    | vapaussota, vapaussodassa, vapaussotaa          | vapaussoturi          |
| kansalaissota | `kansalaisso[dt][ai]` | kansalaissota, kansalaissodan                   |                       |
| luokkasota    | `luokkaso[dt][ai]`    | luokkasota, luokkasodan                         |                       |
| veljessota    | `veljesso[dt][ai]`    | veljessota, veljessodan                         |                       |
| punakapina    | `punakapin`           | punakapina, punakapinan, punakapinalliset       |                       |

Every mention is put in exactly one of five places, by removing one layer at a
time and counting what disappears:

1. `other_countries`: the name right after another country's genitive (Viron,
   Venäjän, Espanjan, Yhdysvaltain, Latvian, Ruotsin and 17 more, the full list
   is in `war-names.sql`).
2. `medal`: inside "Vapaussodan muistomitali".
3. `category_or_file`: inside `[[Luokka:...]]`, `[[Kuva:...]]`, `[[Tiedosto:...]]`.
4. `link_target`: the hidden target of a piped link, `[[Suomen sisällissota|...`.
5. `running_text`: the rest, which is what a reader sees. All shares above use
   this.

An unqualified "sisällissota" in an article about Spain still counts as running
text, and so does a book title in a source list. The counts are of words, not
of meanings.

**Swaps.** `name-count.sql` counts the six names in every one of the 862,076
versions (`FOR SYSTEM_TIME ALL`) into `lab_history_of_history.name_count`.
`war-name-swaps.sql` joins that to `wtt.edit` and keeps the edits after which
one name occurs fewer times and another more times than in the version before
(`LAG() OVER (PARTITION BY page_id ORDER BY seq)`). `edit.restores` tells
whether the swap is itself a revert and `edit.undone_by` whether it was undone.
Swaps count all mentions, not only running text.

**Years.** A year is a run of exactly four digits from 1000 to 2026. Before
counting, `year-heatmap.sql` removes footnotes (`<ref>...</ref>`, `<ref .../>`),
citation templates (`{{Kirjaviite}}`, `{{Verkkoviite}}`, `{{Lehtiviite}}`) and
century phrases ("1800-luvulla" means the 19th century, not the year 1800).
The cleaned text becomes a JSON array of its digit runs, and `JSON_TABLE`
unnests it into one row per number. Share is a year's (or decade's) mentions
divided by all year mentions on that date.

**Words.** `term-shares.sql` counts the articles in which a stem occurs at
least once (`text REGEXP 'neuvostoliit'`), divided by the articles that existed.

**Cross-check.** DuckDB ran the same definitions on `data/m/versions-*.parquet`
(`duck_names.py`, `duck_swaps.py`, `duck_years.py`, `duck_terms.py`):

| What                                 | Numbers compared                           | Differences |
| ------------------------------------ | ------------------------------------------ | ----------: |
| Names per snapshot (`war-names.sql`) | 23 dates × 6 names × 9 numbers = 1,242     |           0 |
| Names per version (`name-count.sql`) | 118,936 versions × 6 counts                |           0 |
| Swap edits (`war-name-swaps.sql`)    | 570 rows, all six numbers each             |           0 |
| Years (`year-heatmap.sql`)           | 23 dates × 1,027 years, mentions, articles |           0 |
| Words (`term-shares.sql`)            | 23 dates × 11 numbers = 253                |           0 |

**Timings** (MariaDB 12.3.3 in Docker on a laptop that other labs and a loader
were using at the same time, one query at a time):

| Query                                                    | Runs | Fastest | Median | Slowest |   Total |
| -------------------------------------------------------- | ---: | ------: | -----: | ------: | ------: |
| `war-names.sql`, all articles at one date                |   23 |  14.9 s | 32.2 s |  92.8 s |   814 s |
| `year-heatmap.sql`, all articles at one date             |   23 |  26.7 s | 39.5 s | 176.7 s | 1,024 s |
| `term-shares.sql`, all articles at one date              |   23 |  30.3 s | 40.9 s | 709.4 s | 1,963 s |
| `name-count.sql`, all 862,076 versions                   |    1 |         |        |         |   337 s |
| `war-name-swaps.sql`, the swap table                     |    1 |         |        |         |   2.3 s |
| only `COUNT(*)` of the articles at one date              |    2 |  24.4 s |        |  26.6 s |         |
| `lead-sentence.sql`, seven `AS OF` lookups of one page   |    2 |   0.3 s |        |   0.8 s |         |

The slowest runs are the ones that overlapped with other work on the laptop,
not the ones with the most text. DuckDB, for comparison, counted the names in
all 862,076 versions in 36 s and extracted the years of all 23 snapshots in 5 s.

## The exact SQL

All of it is in this folder. The scripts only substitute the date
`2010-12-31 23:59:59` and run the statement once per snapshot.

### Names at one date (`war-names.sql`)

```sql
-- Part 1: how many articles use each name of the 1918 war, as they stood on one date.
-- Run once per snapshot date, war_names.py substitutes the timestamp.
-- All matching is done on LOWER(text). A name is its stem plus an inflected form of
-- "sota" (sota, sodan, sotaa, sodassa, sotien, sodissa ...): so[dt][ai].
SET SESSION optimizer_switch = 'derived_merge=off';

WITH name AS (
  SELECT 'sisällissota' AS name, 'sisällisso[dt][ai]' AS re, 12 AS len UNION ALL
  SELECT 'vapaussota',    'vapausso[dt][ai]',    10 UNION ALL
  SELECT 'kansalaissota', 'kansalaisso[dt][ai]', 13 UNION ALL
  SELECT 'luokkasota',    'luokkaso[dt][ai]',    10 UNION ALL
  SELECT 'veljessota',    'veljesso[dt][ai]',    10 UNION ALL
  SELECT 'punakapina',    'punakapin',            9
),
a AS (  -- every article as of the date, text kept only where a name occurs
  SELECT page_id,
         IF(text REGEXP 'sisällisso[dt]|vapausso[dt]|kansalaisso[dt]|luokkaso[dt]|veljesso[dt]|punakapin',
            LOWER(text), '') AS t0
  FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59'
),
b AS (  -- t1: other countries' wars removed (Viron vapaussota, Venäjän sisällissota ...)
  SELECT page_id, t0, REGEXP_REPLACE(t0,
    '(?:venäjän|espanjan|yhdysvaltain|yhdysvaltojen|amerikan|ruotsin|viron|eestin|latvian|liettuan|aunuksen|karjalan|inkerin|kreikan|irlannin|englannin|kiinan|algerian|afganistanin|puolan|unkarin|turkin|rooman) (?:sisällis|vapaus|kansalais)so[dt][ai]',
    ' ') AS t1 FROM a
),
c AS (  -- t2: the medal "Vapaussodan muistomitali" removed, a proper noun nobody can rename
  SELECT page_id, t0, t1, REPLACE(t1, 'vapaussodan muistomital', ' ') AS t2 FROM b
),
d AS (  -- t3: category links and file embeds removed
  SELECT page_id, t0, t1, t2, REGEXP_REPLACE(t2,
    '\\[\\[(?:luokka|category|kuva|tiedosto|file|image):[^\\]]*\\]\\]', ' ') AS t3 FROM c
),
e AS (  -- t4: hidden targets of piped links removed: [[Suomen sisällissota|...  what is left is running text
  SELECT page_id, t0, t1, t2, t3, REGEXP_REPLACE(t3, '\\[\\[[^\\]|]*\\|', ' ') AS t4 FROM d
),
n AS (
  SELECT name.name, e.page_id,
    (CHAR_LENGTH(t0) - CHAR_LENGTH(REGEXP_REPLACE(t0, name.re, ''))) DIV name.len AS c0,
    (CHAR_LENGTH(t1) - CHAR_LENGTH(REGEXP_REPLACE(t1, name.re, ''))) DIV name.len AS c1,
    (CHAR_LENGTH(t2) - CHAR_LENGTH(REGEXP_REPLACE(t2, name.re, ''))) DIV name.len AS c2,
    (CHAR_LENGTH(t3) - CHAR_LENGTH(REGEXP_REPLACE(t3, name.re, ''))) DIV name.len AS c3,
    (CHAR_LENGTH(t4) - CHAR_LENGTH(REGEXP_REPLACE(t4, name.re, ''))) DIV name.len AS c4
  FROM e JOIN name
)
SELECT name,
       COUNT(*)        AS articles_total,
       SUM(c0 > 0)     AS articles,           -- articles with any mention
       SUM(c0)         AS mentions,           -- all mentions
       SUM(c0 - c1)    AS other_countries,    -- Viron vapaussota, Venäjän sisällissota ...
       SUM(c1 - c2)    AS medal,              -- Vapaussodan muistomitali
       SUM(c2 - c3)    AS category_or_file,   -- [[Luokka:...]] and [[Kuva:...]]
       SUM(c3 - c4)    AS link_target,        -- hidden target of [[target|label]]
       SUM(c4)         AS running_text,       -- what the reader sees
       SUM(c4 > 0)     AS articles_running
FROM n GROUP BY name ORDER BY mentions DESC;
```

`derived_merge=off` makes MariaDB compute each cleaning step once and keep it,
instead of repeating the nested `REGEXP_REPLACE` for every count that uses it.
MariaDB has no `REGEXP_COUNT`. The count is the number of characters that
disappear when the matches are deleted, divided by the length of one match,
which is exact because every pattern matches a fixed number of characters.

### Every version, and the swaps (`name-count.sql`, `war-name-swaps.sql`)

```sql
INSERT INTO lab_history_of_history.name_count
SELECT page_id, rev_id,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)sisällisso[dt][ai]',  ''))) DIV 12,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)vapausso[dt][ai]',    ''))) DIV 10,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)kansalaisso[dt][ai]', ''))) DIV 13,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)luokkaso[dt][ai]',    ''))) DIV 10,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)veljesso[dt][ai]',    ''))) DIV 10,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)punakapin',           ''))) DIV 9
FROM wtt.revision FOR SYSTEM_TIME ALL
WHERE text REGEXP 'sisällisso[dt]|vapausso[dt]|kansalaisso[dt]|luokkaso[dt]|veljesso[dt]|punakapin';
```

```sql
-- Part 1b, step 2: edits that swap one name for another inside an existing article.
-- A swap is an edit after which name A occurs fewer times and name B more times
-- than in the version just before it (wtt.edit gives the order, seq - 1 is the
-- version before, a version without a row in name_count mentions no name at all).
CREATE OR REPLACE TABLE lab_history_of_history.swap AS
WITH nm AS (
  SELECT 1 AS i, 'sisällissota' AS name UNION ALL SELECT 2, 'vapaussota' UNION ALL SELECT 3, 'kansalaissota' UNION ALL
  SELECT 4, 'luokkasota' UNION ALL SELECT 5, 'veljessota' UNION ALL SELECT 6, 'punakapina'
),
v AS (  -- every version of every article that ever mentioned a name, with its counts
  SELECT e.page_id, e.seq, e.rev_id,
         COALESCE(c.sisallis, 0) AS n1, COALESCE(c.vapaus, 0) AS n2, COALESCE(c.kansalais, 0) AS n3,
         COALESCE(c.luokka, 0)   AS n4, COALESCE(c.veljes, 0) AS n5, COALESCE(c.punakapina, 0) AS n6
  FROM wtt.edit e
  LEFT JOIN lab_history_of_history.name_count c ON c.rev_id = e.rev_id
  WHERE e.page_id IN (SELECT page_id FROM lab_history_of_history.name_count)
),
w AS (  -- the same, next to the version before it
  SELECT v.*, LAG(n1) OVER p AS p1, LAG(n2) OVER p AS p2, LAG(n3) OVER p AS p3,
              LAG(n4) OVER p AS p4, LAG(n5) OVER p AS p5, LAG(n6) OVER p AS p6
  FROM v WINDOW p AS (PARTITION BY page_id ORDER BY seq)
),
x AS (  -- one row per version and name whose count changed
  SELECT w.page_id, w.seq, w.rev_id, nm.name,
         CASE nm.i WHEN 1 THEN p1 WHEN 2 THEN p2 WHEN 3 THEN p3 WHEN 4 THEN p4 WHEN 5 THEN p5 ELSE p6 END AS n_before,
         CASE nm.i WHEN 1 THEN n1 WHEN 2 THEN n2 WHEN 3 THEN n3 WHEN 4 THEN n4 WHEN 5 THEN n5 ELSE n6 END AS n_after
  FROM w JOIN nm
  WHERE p1 IS NOT NULL AND (n1 <> p1 OR n2 <> p2 OR n3 <> p3 OR n4 <> p4 OR n5 <> p5 OR n6 <> p6)
)
SELECT f.page_id, f.seq, f.rev_id,
       f.name AS name_from, t.name AS name_to,
       f.n_before AS from_before, f.n_after AS from_after,
       t.n_before AS to_before,   t.n_after AS to_after,
       LEAST(f.n_before - f.n_after, t.n_after - t.n_before) AS moved
FROM x f JOIN x t ON t.rev_id = f.rev_id
WHERE f.n_after < f.n_before AND t.n_after > t.n_before;

-- the edit war in one table: direction, how many, by whom, how many were undone and how fast
SELECT s.name_from, s.name_to, COUNT(*) AS swaps, COUNT(DISTINCT s.page_id) AS articles, SUM(s.moved) AS mentions_moved,
       SUM(e.editor <> 'named') AS by_anonymous,
       SUM(e.restores IS NOT NULL) AS are_reverts,
       SUM(e.restores IS NULL) AS fresh,
       SUM(e.restores IS NULL AND e.undone_by IS NOT NULL) AS fresh_undone,
       ROUND(AVG(CASE WHEN e.restores IS NULL AND e.undone_by IS NOT NULL
                      THEN TIMESTAMPDIFF(SECOND, e.saved_at, u.saved_at) END) / 3600, 1) AS mean_hours_to_undo
FROM lab_history_of_history.swap s
JOIN wtt.edit e ON e.rev_id = s.rev_id
LEFT JOIN wtt.edit u ON u.page_id = e.page_id AND u.seq = e.undone_by
GROUP BY s.name_from, s.name_to ORDER BY swaps DESC;
```

### The opening sentence and the infobox of one article (`lead-sentence.sql`, `lead-name-history.sql`)

With `page_id` in the `WHERE` clause the primary key does the work. One
`AS OF` lookup of the main article takes 0.1 s from the shell and the seven in
`lead-sentence.sql` 0.3 to 0.8 s together. The three passes over all 3,357
versions in `lead-name-history.sql` take 12 s together. Late in the session,
with the laptop's load average near 50, the same two files took 12.8 s and
139 s (`main_article.py` writes their results to `data/main-article.json`).

```sql
SELECT '2004-12-31' AS as_of, rev_id, REGEXP_SUBSTR(text, "'''[^']*(?:sota|kapina)'''[^\n]{0,420}") AS lead_text
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2004-12-31 23:59:59' WHERE page_id = 1150;
```

returns rev 111753:

```
'''Suomen vuoden 1918 sota''' - joka tunnetaan myös nimillä '''kansalaissota''',
'''sisällissota''', '''vapaussota''', '''veljessota''', '''punakapina''',
'''torpparikapina''', '''luokkasota''' ja neutraaleimmillaan vain '''vuoden 1918
tapahtumat''' - käytiin [[punakaarti|punaisten]] ja [[suojeluskunta|valkoisten]]
välillä keväällä [[1918]].
```

A year earlier (rev 6298, as of 2003-12-31) it began "'''Suomen sisällissota''' -
jota myös '''Vapaussodaksi''' ja '''Kansalaissodaksi''' kutsutaan", and a year
later (rev 657107, as of 2005-12-31) "'''Suomen sisällissota''' käytiin ..." with
no other name in the sentence.

```sql
-- Part 1c: under which name the main article (page_id 1150) opens, over its whole life.
-- The dump keeps one title per page, so the title column cannot show renames. The
-- first bold phrase ending in -sota, -kapina or tapahtumat is the name the article
-- gives the war. Summed per name: how many versions opened with it and for how long.
WITH v AS (
  SELECT row_start, LEAST(row_end, TIMESTAMP '2026-10-01 23:59:59') AS row_end,
         REGEXP_SUBSTR(text, "'''[^'\n]*(?:sota|kapina|tapahtumat)'''") AS opening_name
  FROM wtt.revision FOR SYSTEM_TIME ALL WHERE page_id = 1150
)
SELECT opening_name, COUNT(*) AS versions, MIN(row_start) AS first_seen, MAX(row_end) AS last_seen,
       ROUND(SUM(TIMESTAMPDIFF(SECOND, row_start, row_end)) / 86400, 1) AS days
FROM v GROUP BY opening_name ORDER BY days DESC LIMIT 12;

-- Which side the infobox lists first: the "taistelija1" (belligerent 1) parameter
-- of the article's infobox, classified by the words it contains, summed per side.
WITH v AS (
  SELECT row_start, LEAST(row_end, TIMESTAMP '2026-10-01 23:59:59') AS row_end,
         REGEXP_SUBSTR(text, '(?i)taistelija1\\s*=[^\n]*') AS side1
  FROM wtt.revision FOR SYSTEM_TIME ALL WHERE page_id = 1150
)
SELECT CASE WHEN side1 = '' THEN 'no infobox'
            WHEN side1 REGEXP 'puna' AND NOT side1 REGEXP 'valko|hallitu|senaat|tasavalla' THEN 'Reds'
            WHEN side1 REGEXP 'valko|hallitu|senaat|tasavalla' AND NOT side1 REGEXP 'puna' THEN 'Whites'
            ELSE 'other' END AS belligerent_1,
       COUNT(*) AS versions, MIN(row_start) AS first_seen, MAX(row_end) AS last_seen,
       ROUND(SUM(TIMESTAMPDIFF(SECOND, row_start, row_end)) / 86400) AS days
FROM v GROUP BY belligerent_1 ORDER BY first_seen;
```

`title-history.sql` holds the four small queries behind "the title never
changed".

### Years at one date (`year-heatmap.sql`)

```sql
-- Part 2: which years of history the articles mention, as they stood on one date.
-- A year is a run of exactly four digits between 1000 and 2026. Footnotes
-- (<ref>...</ref>, <ref ... />) and citation templates ({{Kirjaviite ...}},
-- {{Verkkoviite ...}}, {{Lehtiviite ...}}) are removed first, because their
-- access and publication dates say when a source was read or printed, not which
-- year the article is about. Century phrases (1800-luvulla = in the 19th century)
-- are removed too, they would all land on the round year. The cleaned text is turned
-- into a JSON array of its digit runs and JSON_TABLE unnests it into one row per number.
SELECT j.tok + 0                 AS year_mentioned,
       COUNT(*)                  AS mentions,
       COUNT(DISTINCT r.page_id) AS articles
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59' AS r,
     JSON_TABLE(
       CONCAT('["',
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  REGEXP_REPLACE(r.text, '(?is)<ref[^>/]*>.*?</ref>|<ref[^>]*>|[0-9]{2}00-lu[kv]u', ' '),
                  '(?i)\\{\\{[a-zåäö]*viite[^{}]*\\}\\}', ' '),
                '[^0-9]+', '","'),
              '"]'),
       '$[*]' COLUMNS (tok VARCHAR(32) PATH '$')) AS j
WHERE j.tok REGEXP '^(1[0-9]{3}|20[01][0-9]|202[0-6])$'
GROUP BY year_mentioned;
```

### Words at one date (`term-shares.sql`)

```sql
-- Part 3: how many articles mention each word, as they stood on one date.
-- REGEXP is case-insensitive under the table's collation. Each pattern is a stem,
-- so inflected forms count (Neuvostoliiton, Venäjällä, talvisodassa ...).
SELECT COUNT(*)                              AS articles_total,
       SUM(text REGEXP 'neuvostoliit')       AS neuvostoliitto,   -- Soviet Union
       SUM(text REGEXP 'venäjä')             AS venaja,           -- Russia
       SUM(text REGEXP 'ruotsi')             AS ruotsi,           -- Sweden
       SUM(text REGEXP 'saksa')              AS saksa,            -- Germany, German
       SUM(text REGEXP '[^a-zåäö]nato')      AS nato,             -- Nato, Naton, Natoon
       SUM(text REGEXP 'suomettu')           AS suomettuminen,    -- Finlandization
       SUM(text REGEXP 'talviso[dt]')        AS talvisota,        -- Winter War
       SUM(text REGEXP 'jatkoso[dt]')        AS jatkosota,        -- Continuation War
       SUM(text REGEXP 'saamelai')           AS saamelainen,      -- Sámi, the name they use
       SUM(text REGEXP 'lappalai')           AS lappalainen       -- Lapp, the old outsiders' name
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59';
```

## What did not work

- **The `title` column cannot show a rename.** `title-history.sql`: none of the
  19,742 articles carries more than one title anywhere in its 862,076
  versions. The dump writes the page's current title on every version. Page
  moves survive only as edit summaries ("siirsi sivun X uudelle nimelle Y"):
  13 of them name the war, none is on the main article. The opening sentence
  turned out to be the better witness.
- **`FOR SYSTEM_TIME AS OF` over all articles is a full scan.** `EXPLAIN` shows
  `type: ALL`, about 1.57 million rows estimated. A query that only counts the
  articles of one date took 24.4 s and 26.6 s, so every all-article snapshot
  costs that before it does any work. The same clause with `page_id = 1150`
  answers at once.
- **Counting the string.** The first try, `text LIKE '%vapaussod%'`, found 651
  articles at the end of 2010. At that date 1,729 of the 2,360 "vapaussota"
  mentions were one medal. Nothing about the naming of the war can be read
  from raw counts.
- **"Lappalainen" against "saamelainen".** The pair was meant to follow the
  old outsiders' name for the Sámi against their own. "Lappalai" is in 416
  articles in 2026 and "saamelai" in 303, but Lappalainen is also a common
  Finnish surname and a case-insensitive pattern cannot tell the two apart.
  Both are in the JSON and neither should be charted as it is.
- **The first bold phrase as "the name of the article".** It works until
  24 December 2005. After that the first bold phrase is the first belligerent
  in the infobox, which is how the Reds-first, Whites-first finding turned up.
- **Years from raw wikitext.** On the 2026 articles 33.4 % of the 799,244
  four-digit years are 2000 or later, mostly access dates of footnotes. With
  footnotes, citation templates and century phrases removed it is 17.5 % of
  511,184. What is left is still not clean: 4,445 mentions of 1975 include
  1,358 that are the publication line of one book, "Suomen jääkärien
  elämäkerrasto 1975, Vaasa 1975" (`uv run duck_explore.py`). Populations,
  page numbers and street numbers between 1000 and 2026 count as years too.
- **Share is not interest.** A decade's share falls when other decades grow
  faster. The 1910s more than doubled their mentions after 2010 and still lost
  share.
- **A swap is not always a rename.** The rule (one name down, another up in
  the same edit) also catches a large rewrite: rev 16264937 added 18 KB to
  "Vilppulan rintama" and moved 6 mentions. The edit summaries in the JSON let
  a reader tell them apart.
- **The whole-history pass is slow in MariaDB.** Counting six patterns in all
  862,076 versions took 337 s. DuckDB did it on the Parquet files, with all
  five places per name, in 36 s on four threads.

## What the product should do with it

- **Draw the naming chart from running text, never from raw strings**, with
  the medal and other countries' wars shown as what they are
  (`data/war-names.json` has every layer).
- **Put the swap edits on the chart as dots**: red for "sisällissota →
  vapaussota", sized by mentions moved, hollow when undone. Each row of
  `data/war-name-swaps.json` has the `rev_id`, so a click can open
  `https://fi.wikipedia.org/w/index.php?diff=<rev_id>`. The 70 % against 7 %
  undo rate is the headline number.
- **An opening-sentence time machine.** A date slider that reruns
  `lead-sentence.sql` for any article. It is a primary-key lookup, fast enough
  to run live, and for the 1918 article it shows the name changing in front of
  the user (`data/main-article.json` has seven dates of it, the opening names
  and the infobox sides).
- **The heat map** from `data/year-heatmap.json` (decades) or
  `data/year-heatmap-years.json` (single years), with 1918 as the ridge that
  appears in 2008.
- **Precompute anything that looks at all articles.** A snapshot of all
  articles cost 15 s on a quiet laptop and 12 min on a busy one, so the
  product should ship the JSON, or keep a per-version side table like
  `name_count` (one 337 s pass, after which the swap query takes 2.3 s).

## Reproduce

```sh
cd labs/history-of-history
uv run war_names.py        # part 1, 23 snapshots, about 14 min -> data/war-names.json
uv run war_name_swaps.py   # part 1b and 1c, about 6 min, as root -> data/war-name-swaps.json
uv run main_article.py     # part 1c, the main article          -> data/main-article.json
uv run year_heatmap.py     # part 2, 23 snapshots              -> cache/maria-years.json
uv run term_shares.py      # part 3, 23 snapshots              -> data/term-shares.json
uv run duck_names.py       # DuckDB: same counts from Parquet, compares part 1 (the other duck_* scripts need its cache)
uv run duck_swaps.py       # DuckDB: compares the per-version counts and the swaps
uv run duck_years.py       # DuckDB: years
uv run build_heatmap.py    # compares years, writes data/year-heatmap*.json
uv run duck_terms.py       # DuckDB: compares part 3
uv run duck_explore.py     # DuckDB only: who added the mentions, what the year cleaning removes
uv run report.py           # prints every table and number in this file
```

The `.sql` files also run as they are:
`docker exec -i wikipedia-through-time-mariadb-1 mariadb -uwtt -pwtt wtt < lead-sentence.sql`.
`cache/` holds intermediate files and can be deleted. The lab's tables are in
the database `lab_history_of_history` (`name_count`, `swap`).
