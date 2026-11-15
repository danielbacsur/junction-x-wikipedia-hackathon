# Three Wikipedias

## The question

Where do the Finnish, Swedish and English Wikipedias disagree about the same
fact in the history of Finland, and can the Finnish edit history say who moved?

This lab compares what the leads say. It does not decide which language is
right. "The Finnish lead says 9 November 1918 and the Swedish one 9 March 1918"
is what it can show. No outside source was read.

## What we found

The texts are the August 2025 snapshot in `wtt.article`. 7,256 topics exist in
Finnish and at least one more language (2,919 in all three, 2,335 Finnish and
English, 2,002 Finnish and Swedish).

### Births and deaths

- **3,305 topics** open with a birth or death date in Finnish and in at least
  one other language. **2,992 agree everywhere (90.5 %). 313 disagree on a
  birth or a death (9.5 %)**: 185 on the birth, 158 on the death, 30 on both.
- In 31 of the 313 a date in the disagreement is hedged ("noin", "c.",
  "omkring"). In **282** the dates are given as exact.
- Counted as pairs of languages: 10,097 comparisons, **518 disagree (5.1 %)**.
  English against Finnish disagree on 3.7 % of births and 4.0 % of deaths.
  Every pair with Swedish in it is near 6 % (5.8 % to 6.4 %).

How far apart, for the 518 disagreeing pairs
([size-of-difference.json](data/size-of-difference.json)):

| Size | Birth | Death | Both | Share | Note |
|---|---:|---:|---:|---:|---|
| 1 day | 38 | 40 | 78 | 15.1 % | |
| 2 to 31 days | 109 | 79 | 188 | 36.3 % | 43 are exactly the Julian gap for their century |
| up to a year | 57 | 52 | 109 | 21.0 % | |
| one calendar year, only years given | 19 | 20 | 39 | 7.5 % | 16 hedged |
| more than a year | 62 | 42 | 104 | 20.1 % | 41 hedged |

Which part of a full date differs, for the 407 pairs where both sides give a
day ([shape-of-difference.json](data/shape-of-difference.json)):

| Shape | Pairs |
|---|---:|
| same month and year, other day | 211 |
| same day number and year, other month (17 January against 17 June) | 85 |
| more than one part differs | 70 |
| same day and month, other year | 41 |

A side list: 63 topics where one language gives a death and another opens with
a birth only, behind "s.", "född" or "born". This list is mostly my own
misses, see the audit. The part that held: **7 people whose Finnish lead
gives a death between 2011 and 2025 while the English lead gives none and
writes in the present tense** (for example Johannes Bäckström, Finnish: died
9 February 2025, English: "(born. 1939) Is a Finnish diplomat").

### Wider: other dates, then quantities

Articles that are not lifespans, opening paragraph only
([wider-net.json](data/wider-net.json)):

| What | Topics that can be compared | Pairs | Pairs sharing a value exactly | Pairs with a near miss | Read by hand |
|---|---:|---:|---:|---:|---|
| full dates | 541 | 915 | 823 (89.9 %) | 73 (8.0 %) | 10: 5 real, 3 calendar, 1 my error, 1 unclear |
| quantities of 100 or more | 462 | 648 | 301 (46.5 %) | 233 (36.0 %) | 10: 1 real, 6 rounding, 2 other year, 1 unclear |

A near miss means each language gives a value the other lacks, within 31 days
or within 10 %. Dates stay usable: about half of what the rule finds is a real
difference between the leads, and most of the rest is the calendar (Sweden's
own calendar in 1700 to 1712, Julian against Gregorian). Quantities do not:
one in ten was a real difference about the same thing. The rest is "about
19 000" against "19,215", or a population counted in another year. Without
knowing what a number counts and when, numbers cannot be aligned.

### Does the article vector say anything?

Cosine distance between the bge-m3 vectors of the same topic, computed in
MariaDB ([distance-distribution.json](data/distance-distribution.json)):

| Pair | Topics | 10th percentile | Median | 90th | 99th | Largest |
|---|---:|---:|---:|---:|---:|---:|
| English, Finnish | 5,254 | 0.158 | 0.231 | 0.335 | 0.454 | 0.605 |
| English, Swedish | 2,919 | 0.130 | 0.204 | 0.310 | 0.407 | 0.603 |
| Finnish, Swedish | 4,921 | 0.161 | 0.244 | 0.360 | 0.459 | 0.585 |

- Length explains part of it. The correlation between distance and the log of
  the length ratio is 0.45 to 0.53. A fit on length ratio and shorter length
  explains 21 % to 28 % of the variance.
- After taking length out, the topics told most differently are not disputed
  facts. They are topics where the languages write about different things
  under one Wikidata id: *Renki* against *Farmworker* (0.605, expected 0.278),
  *Koulukoti* against *Approved school*, *Harkkohytti* against *Bloomery*,
  *Lääninhallitus* against *County administrative boards of Sweden*. The
  Finnish article is about the Finnish institution, the English one about the
  general or another country's. The top 30 are in
  [told-most-differently.json](data/told-most-differently.json).
- **Distance does not go with disagreeing dates.** Over 5,758 language pairs
  of lifespan topics, the median distance is 0.2035 where the dates agree and
  0.2065 where they disagree. By quarter of distance, nearest first, the share
  that disagrees is 7.7 %, 8.3 %, 7.9 %, 9.2 %
  ([distance-and-facts.json](data/distance-and-facts.json)). A vector of a
  whole article does not notice one digit.

### Time travel on the Finnish side

391 of the 518 disagreeing pairs have Finnish on one side. They rest on 333
Finnish facts (a birth or a death of one topic) in 309 articles. For each, the
lead's history was rebuilt from `passage FOR SYSTEM_TIME ALL`. The rebuilt
value on the snapshot day matched the snapshot text for 384 of 391 pairs
(98.2 %). The 7 that did not are left out below
([finnish-history.json](data/finnish-history.json)).

| Of 333 Finnish facts that another language gives differently | Count | Share |
|---|---:|---:|
| the current value is the first value the lead ever stated | 164 | 49.2 % |
| the current value has stood since the article's first 30 days | 163 | 48.9 % |
| the current value replaced an earlier one | 169 | 50.8 % |
| … and the earlier one was as precise (a change, not "1878" becoming "10 September 1878") | 75 | 22.5 % |
| Finnish once stated the other language's value and left it | 63 | 18.9 % |
| standing only since 1 August 2023 or later | 22 | 6.6 % |
| changed again between the snapshot and 1 October 2026 | 5 | 1.5 % |
| agrees with the other language on 1 October 2026 | 2 | 0.6 % |

Standing since: 2003 to 2009: 120. 2010 to 2014: 89. 2015 to 2019: 74.
2020 to 2022: 27. 2023 to 2026: 23. The value was set by a named account in
310 cases and by an IP address in 23.

So about half of the Finnish values in dispute are as old as the article, and
most are old: 209 of 333 have stood since before 2015. Few are recent.

**Who moved.** Where all three languages give a full date and two agree
against the third (94 facts, rule below), the odd one out is Swedish 47 times,
English 31 times, Finnish 16 times. For 92 of them the Finnish history is
known:

| Reading | Facts |
|---|---:|
| Swedish is the odd one out, Finnish never had its value | 38 |
| Swedish is the odd one out, Finnish used to have its value and left it | 9 |
| English is the odd one out, Finnish never had its value | 23 |
| English is the odd one out, Finnish used to have its value and left it | 6 |
| Finnish is the odd one out and never had the value the other two share | 11 |
| Finnish is the odd one out and left the value the other two share | 5 |

Only Finnish can be read this way. The lab has no history for Swedish or
English, so "Swedish is the odd one out" does not say Swedish moved.

Four Finnish timelines, as rebuilt (dates are when the version was saved;
full data with revision numbers in [editors-list.json](data/editors-list.json)):

- **Jakob Näs, death.** Swedish and English: 9 March 1918.
  Finnish: from 2 Sep 2008, 9 March 1918 → from 7 Nov 2023, 9 November 1918
  ([revision 21971200](https://fi.wikipedia.org/?oldid=21971200)), still
  standing on 1 October 2026. One reverted IP edit in 2014 did not touch the date.
- **Keijo Korhonen, death.** Swedish and English: 6 June 2022. Finnish: no
  death until 7 Jun 2022 → June 2022 without a day → from 12 Jun 2022,
  6 June 2022 → from 25 Feb 2025, 4 June 2022
  ([revision 23049853](https://fi.wikipedia.org/?oldid=23049853)).
- **Georg Magnus Sprengtporten, birth.** English: 16 December 1740. Finnish
  and Swedish: 16 August 1740. Finnish: from 2004, the year 1740 only → from 7 Feb 2009,
  16 December 1740 (set by an IP address) → from 9 May 2019, 16 August 1740
  ([revision 18141511](https://fi.wikipedia.org/?oldid=18141511)).
- **Oskari Tokoi, birth.** English: 15 April 1873. Finnish and Swedish:
  15 May 1873. Finnish: from 13 Nov 2004, 15 April 1873 → from 16 Aug 2005,
  15 May 1873 (set by an IP address), unchanged for 21 years through two
  reverted edits.

### Manual read

I read 30 randomly drawn lifespan disagreements (seed 2026), three leads side
by side ([manual-audit.json](data/manual-audit.json), with links and my note
for each). These are a research agent's labels, not an independent audit.

| Label | Of 30 |
|---|---:|
| real: the leads state different values for the same fact | 25 |
| calendar: one lead leads with the Julian date, the other with the Gregorian | 2 |
| convention: both hedge ("after 1491" against "about 1493") | 2 |
| different topic behind the same Wikidata id | 1 |
| my extraction error | 0 |
| unclear | 0 |

- **Extraction precision in this read: 30 of 30.** Every value was the value
  the lead states. With 30 cases, an error rate up to about 10 % cannot be
  ruled out.
- **25 of 30 (83 %) are real differences between the leads.** Applied to 343
  disagreeing facts, that would be about 285. This is an estimate from 30.
- The one "different topic" is Nils Wallerius: the Finnish article is about a
  physician in Turku (1666 to 1704), the Swedish and English about a
  philosopher (1706 to 1764).
- Other sets read: 10 date near misses, 10 quantity near misses (table above),
  8 random "still living" cases (1 real, 5 my errors, 1 convention, 1 unclear)
  and all 12 "still living" topics with a death from 2000 on (7 real, 5 my
  errors). 70 cases read in all. Nothing else is classified.

### The list an editor would want

Rule: every language gives a full date, none is hedged, no lead mentions an
old-style calendar, the gap is not the Julian offset, and the manual read did
not throw it out. **210 facts qualify.** Score: 3 if two languages agree
against the third, 2 if read by hand, 1 if Finnish once stated the other
value. Ties by size of the gap. Rows 1 to 9 were read by hand. The top 60 with
full Finnish timelines are in [editors-list.json](data/editors-list.json).

| # | Who, what | Finnish | Swedish | English | Odd one out | Finnish has said this since | Before that |
|---|---|---|---|---|---|---|---|
| 1 | Mikael Soininen, birth | [3. marraskuuta 1860](https://fi.wikipedia.org/wiki/Mikael_Soininen) | [3 november 1869](https://sv.wikipedia.org/wiki/Mikael_Soininen) | [3 November 1860](https://en.wikipedia.org/wiki/Mikael_Soininen) | sv | [2009-06-04](https://fi.wikipedia.org/?oldid=6830819) | 1907 |
| 2 | Tyyne Leivo-Larsson, death | [1. elokuuta 1977](https://fi.wikipedia.org/wiki/Tyyne_Leivo-Larsson) | [1 augusti 1979](https://sv.wikipedia.org/wiki/Tyyne_Leivo-Larsson) | [1 August 1977](https://en.wikipedia.org/wiki/Tyyne_Leivo-Larsson) | sv | [2007-01-16](https://fi.wikipedia.org/?oldid=2204889) | nothing: first value |
| 3 | Nikolaus von Falkenhorst, birth | [17. tammikuuta 1885](https://fi.wikipedia.org/wiki/Nikolaus_von_Falkenhorst) | [17 juni 1885](https://sv.wikipedia.org/wiki/Nikolaus_von_Falkenhorst) | [17 January 1885](https://en.wikipedia.org/wiki/Nikolaus_von_Falkenhorst) | sv | [2008-09-10](https://fi.wikipedia.org/?oldid=5435034) | 1885 |
| 4 | Axel Kurck, death | [30. toukokuuta 1630](https://fi.wikipedia.org/wiki/Axel_Kurck) | [30 maj 1630](https://sv.wikipedia.org/wiki/Axel_Kurck) | [30 March 1630](https://en.wikipedia.org/wiki/Axel_Kurck) | en | [2009-05-08](https://fi.wikipedia.org/?oldid=6687050) | nothing: first value |
| 5 | K. E. F. Ignatius, birth | [27. syyskuuta 1837](https://fi.wikipedia.org/wiki/K._E._F._Ignatius) | [27 oktober 1837](https://sv.wikipedia.org/wiki/Karl_Ferdinand_Ignatius) | [27 September 1837](https://en.wikipedia.org/wiki/Karl_Ferdinand_Ignatius) | sv | [2008-09-09](https://fi.wikipedia.org/?oldid=5427050) | nothing: first value |
| 6 | Anders Henrik Falck, birth | [25. marraskuuta 1772](https://fi.wikipedia.org/wiki/Anders_Henrik_Falck) | [15 november 1772](https://sv.wikipedia.org/wiki/Anders_Henrik_Falck) | [25 November 1772](https://en.wikipedia.org/wiki/Anders_Henrik_Falck) | sv | [2006-07-06](https://fi.wikipedia.org/?oldid=1340965) | 1772 |
| 7 | Bertel Gripenberg, birth | [10. syyskuuta 1878](https://fi.wikipedia.org/wiki/Bertel_Gripenberg) | [19 september 1878](https://sv.wikipedia.org/wiki/Bertel_Gripenberg) | [19 September 1878](https://en.wikipedia.org/wiki/Bertel_Gripenberg) | fi | [2007-06-25](https://fi.wikipedia.org/?oldid=3061927) | 1878 |
| 8 | Adolf Fredrik Munck, birth | [29. huhtikuuta 1749](https://fi.wikipedia.org/wiki/Adolf_Fredrik_Munck) | [29 april 1749](https://sv.wikipedia.org/wiki/Adolf_Fredrik_Munck) | [28 April 1749](https://en.wikipedia.org/wiki/Adolf_Fredrik_Munck) | en | [2009-01-29](https://fi.wikipedia.org/?oldid=6194480) | 1749 |
| 9 | Rudolf Holsti, death | [4. elokuuta 1945](https://fi.wikipedia.org/wiki/Rudolf_Holsti) | [4 augusti 1945](https://sv.wikipedia.org/wiki/Rudolf_Holsti) | [3 August 1945](https://en.wikipedia.org/wiki/Rudolf_Holsti) | en | [2008-03-16](https://fi.wikipedia.org/?oldid=4472014) | 1945 |
| 10 | Bruno Sarlin, death | [6. tammikuuta 1951](https://fi.wikipedia.org/wiki/Bruno_Sarlin) | [6 januari 1952](https://sv.wikipedia.org/wiki/Bruno_Sarlin) | [6 January 1951](https://en.wikipedia.org/wiki/Bruno_Sarlin) | sv | [2020-03-04](https://fi.wikipedia.org/?oldid=18770971) | 1952-01-06 |
| 11 | Sakari Ainali, birth | [3. joulukuuta 1874](https://fi.wikipedia.org/wiki/Sakari_Ainali) | [3 mars 1874](https://sv.wikipedia.org/wiki/Sakari_Ainali) | [3 December 1874](https://en.wikipedia.org/wiki/Sakari_Ainali) | sv | [2018-03-31](https://fi.wikipedia.org/?oldid=17193078) | 1874-03-03 |
| 12 | Jakob Näs, death | [9. marraskuuta 1918](https://fi.wikipedia.org/wiki/Jakob_N%C3%A4s) | [9 mars 1918](https://sv.wikipedia.org/wiki/Jakob_N%C3%A4s) | [9 March 1918](https://en.wikipedia.org/wiki/Jakob_N%C3%A4s) | fi | [2023-11-07](https://fi.wikipedia.org/?oldid=21971200) | 1918-03-09 |
| 13 | Kasten Antell, death | [20. marraskuuta 1906](https://fi.wikipedia.org/wiki/Kasten_Antell) | [20 juni 1906](https://sv.wikipedia.org/wiki/Kasten_Antell) | [20 November 1906](https://en.wikipedia.org/wiki/Kasten_Antell) | sv | [2019-09-16](https://fi.wikipedia.org/?oldid=18416251) | 1906-06-20 |
| 14 | Adelaïde Ehrnrooth, death | [13. tammikuuta 1905](https://fi.wikipedia.org/wiki/Adela%C3%AFde_Ehrnrooth) | [13 januari 1905](https://sv.wikipedia.org/wiki/Adela%C3%AFde_Ehrnrooth) | [31 May 1905](https://en.wikipedia.org/wiki/Adela%C3%AFde_Ehrnrooth) | en | [2017-01-26](https://fi.wikipedia.org/?oldid=16215492) | 1905-05-31 |
| 15 | Georg Magnus Sprengtporten, birth | [16. elokuuta 1740](https://fi.wikipedia.org/wiki/Georg_Magnus_Sprengtporten) | [16 augusti 1740](https://sv.wikipedia.org/wiki/G%C3%B6ran_Magnus_Sprengtporten) | [16 December 1740](https://en.wikipedia.org/wiki/Georg_Magnus_Sprengtporten) | en | [2019-05-09](https://fi.wikipedia.org/?oldid=18141511) | 1740-12-16 |
| 16 | Esa Timonen, birth | [28. toukokuuta 1925](https://fi.wikipedia.org/wiki/Esa_Timonen) | [28 augusti 1925](https://sv.wikipedia.org/wiki/Esa_Timonen) | [28 May 1925](https://en.wikipedia.org/wiki/Esa_Timonen) | sv | [2010-10-29](https://fi.wikipedia.org/?oldid=9263269) | 1925-08-28 |
| 17 | Erik Adolf von Willebrand, death | [12. syyskuuta 1949](https://fi.wikipedia.org/wiki/Erik_Adolf_von_Willebrand) | [12 december 1949](https://sv.wikipedia.org/wiki/Erik_Adolf_von_Willebrand) | [12 September 1949](https://en.wikipedia.org/wiki/Erik_Adolf_von_Willebrand) | sv | [2006-08-07](https://fi.wikipedia.org/?oldid=1465351) | 1949-12-12 |
| 18 | Lennart Gripenberg, birth | [15. marraskuuta 1852](https://fi.wikipedia.org/wiki/Lennart_Gripenberg) | [15 september 1852](https://sv.wikipedia.org/wiki/Lennart_Gripenberg) | [15 September 1852](https://en.wikipedia.org/wiki/Lennart_Gripenberg) | fi | [2017-02-12](https://fi.wikipedia.org/?oldid=16271310) | 1852-09-15 |
| 19 | Oskari Tokoi, birth | [15. toukokuuta 1873](https://fi.wikipedia.org/wiki/Oskari_Tokoi) | [15 maj 1873](https://sv.wikipedia.org/wiki/Oskari_Tokoi) | [15 April 1873](https://en.wikipedia.org/wiki/Oskari_Tokoi) | en | [2005-08-16](https://fi.wikipedia.org/?oldid=375338) | 1873-04-15 |
| 20 | Eino Rahja, birth | [7. heinäkuuta 1885](https://fi.wikipedia.org/wiki/Eino_Rahja) | [20 juni 1885](https://sv.wikipedia.org/wiki/Eino_Rahja) | [20 June 1885](https://en.wikipedia.org/wiki/Eino_Rahja) | fi | [2016-10-29](https://fi.wikipedia.org/?oldid=16033951) | 1885-06-20 |
| 21 | Axel Gabriel Sjöström, birth | [16. elokuuta 1794](https://fi.wikipedia.org/wiki/Axel_Gabriel_Sj%C3%B6str%C3%B6m) | [26 augusti 1794](https://sv.wikipedia.org/wiki/Axel_Gabriel_Sj%C3%B6str%C3%B6m) | [16 August 1794](https://en.wikipedia.org/wiki/Axel_Gabriel_Sj%C3%B6str%C3%B6m) | sv | [2008-08-27](https://fi.wikipedia.org/?oldid=5356717) | 1794-08-26 |
| 22 | Antti Isotalo, birth | [24. elokuuta 1831](https://fi.wikipedia.org/wiki/Antti_Isotalo) | [24 augusti 1831](https://sv.wikipedia.org/wiki/Antti_Isotalo) | [30 August 1831](https://en.wikipedia.org/wiki/Antti_Isotalo) | en | [2025-03-12](https://fi.wikipedia.org/?oldid=23105061) | 1831-08-30 |
| 23 | Matti Kurikka, death | [1. lokakuuta 1915](https://fi.wikipedia.org/wiki/Matti_Kurikka) | [1 oktober 1915](https://sv.wikipedia.org/wiki/Matti_Kurikka) | [October 4, 1915](https://en.wikipedia.org/wiki/Matti_Kurikka) | en | [2015-10-24](https://fi.wikipedia.org/?oldid=15293629) | 1915-10-04 |
| 24 | Keijo Korhonen, death | [4. kesäkuuta 2022](https://fi.wikipedia.org/wiki/Keijo_Korhonen) | [6 juni 2022](https://sv.wikipedia.org/wiki/Keijo_Korhonen_(politiker)) | [6 June 2022](https://en.wikipedia.org/wiki/Keijo_Korhonen_(politician)) | fi | [2025-02-25](https://fi.wikipedia.org/?oldid=23049853) | 2022-06-06 |
| 25 | Georg C. Ehrnrooth, death | [17. lokakuuta 2010](https://fi.wikipedia.org/wiki/Georg_C._Ehrnrooth) | [19 oktober 2010](https://sv.wikipedia.org/wiki/Georg_C._Ehrnrooth) | [17 October 2010](https://en.wikipedia.org/wiki/Georg_C._Ehrnrooth) | sv | [2014-05-29](https://fi.wikipedia.org/?oldid=14073722) | 2010-10-19 |

"Before that" is the Finnish lead's previous value. A bare year means the lead
first gave only the year. Rows 10 to 25 were not read by hand.

## How it was measured

1. **Leads once, then no more text from the database.** `pull.py` reads the
   first 6,000 characters of the 17,431 articles of the 7,256 shared topics,
   500 rows per query, one connection, into `cache/leads.json.gz`.
2. **Reading dates without understanding language** (`facts.py`). Month names
   in three languages, numeric Finnish dates, "June 4, 1867", ranges that give
   the year once ("25. kesäkuuta – 9. heinäkuuta 1944"). A lifespan is read
   from the first paragraph in two ways and the one that starts first wins:
   the first brackets that hold a date ("(4 June 1867 – 27 January 1951)",
   "(s. 1948)"), or markers in running text ("född … död …"). Brackets inside
   brackets are read through, so "22 April [O.S. 10 April] 1870" is one date
   and the lead is flagged as mentioning an old-style calendar. 19 test
   sentences are at the bottom of the file: `python3 facts.py`.
3. **A lifespan topic** is one where the Finnish lead and at least one other
   open with a birth or a death: 3,307 topics, 14,032 facts. The rule does
   not check that the topic is a person. All 30 read by hand were.
4. **Alignment in SQL.** The facts go into `lab_three_wikipedias.lead_fact`.
   The view `fact_pair` joins every two languages on topic and field and
   compares at the coarser precision: a full date against a bare year compares
   years. Sizes, shapes and counts are plain `GROUP BY` over that view.
5. **Wider net.** For the 3,949 other topics: every full date and every
   number of 100 or more (not a date, not year-shaped) in the opening
   paragraph, into `lead_date` and `lead_quantity`. Thousands written with
   spaces, dots or commas and "2,5 miljoonaa" are normalised. A near miss is
   found with a self-join and two `NOT EXISTS`.
6. **Distance** is `VEC_DISTANCE_COSINE` between two `article_vector` rows
   fetched by primary key, 13,094 pairs, stored in `topic_distance`. The
   length control is a least-squares fit per pair of languages in `report.py`.
7. **Time travel** (`history.py`). For each of the 309 Finnish articles, one
   query reads every prose paragraph the article ever had with the stretch it
   stood. A paragraph counts as the lead at a moment if it opens with a
   lifespan and at most one other prose paragraph alive at that moment stands
   before it (`ord`). Versions whose edit has `reverted_by` are kept in the
   timeline but not used for "since", "before" or "once agreed". "Once
   agreed" is tested at the precision of today's disagreement: an earlier
   Finnish "1885" does not agree with "17 June 1885". The 309 articles took
   under half a minute.
8. **Manual read** (`audit.py`). Seeded samples, three leads printed side by
   side with links, labels typed into `audit-labels.json`.

Run it, from the repository root:

```sh
uv run labs/three-wikipedias/pull.py            # cache/leads.json.gz
uv run labs/three-wikipedias/run.py             # lab database, facts, distances
uv run labs/three-wikipedias/history.py         # cache/history.json
uv run labs/three-wikipedias/audit.py write     # cache/audit-sample.json, prints the cases
uv run labs/three-wikipedias/report.py          # data/*.json, prints every number above
uv run labs/three-wikipedias/q.py people-summary    # any file in sql/ by name
```

Which command gives which number: `q.py people-summary` (3,305, 2,992, 313,
185, 158, 31, 282), `q.py people-size`, `q.py people-shape`,
`q.py people-by-pair`, `q.py date-summary`, `q.py date-near-miss`,
`q.py quantity-summary`, `q.py quantity-near-miss`, `q.py distance-summary`,
`q.py still-living`, `q.py still-living-recent`, `q.py topic-kinds`.
`report.py` prints the time-travel table, the distance percentiles and fits,
the who-moved table and the audit counts, and writes the pair and fact totals
(10,097, 518, 343, 30) to [summary.json](data/summary.json).

## The exact SQL

All of it is in `sql/`. The parts that carry the result:

The comparison ([schema.sql](sql/schema.sql)):

```sql
CREATE OR REPLACE VIEW lab_three_wikipedias.fact_pair AS
SELECT qid, field, lang_a, lang_b, shown_a, shown_b, grain, gap, approx, old_style, y,
       CASE WHEN gap = 0 THEN 'same'
            WHEN grain = 'day' AND gap = 1 THEN '1 day'
            WHEN grain = 'day' AND gap <= 31 THEN '2 to 31 days'
            WHEN grain = 'day' AND gap <= 366 THEN 'up to a year'
            WHEN grain = 'month' AND gap <= 12 THEN 'up to a year'
            WHEN grain = 'year' AND gap = 1 THEN 'one calendar year, only years given'
            ELSE 'more than a year' END AS size,
       (grain = 'day' AND gap = CASE WHEN y < 1700 THEN 10 WHEN y < 1800 THEN 11 WHEN y < 1900 THEN 12 ELSE 13 END) AS calendar_shaped
FROM (
  SELECT a.qid, a.field, a.lang AS lang_a, b.lang AS lang_b, a.shown AS shown_a, b.shown AS shown_b, a.y,
         CASE WHEN a.d IS NOT NULL AND b.d IS NOT NULL THEN 'day'
              WHEN a.m IS NOT NULL AND b.m IS NOT NULL THEN 'month'
              ELSE 'year' END AS grain,
         CASE WHEN a.d IS NOT NULL AND b.d IS NOT NULL THEN ABS(a.day_number - b.day_number)
              WHEN a.m IS NOT NULL AND b.m IS NOT NULL THEN ABS((a.y * 12 + a.m) - (b.y * 12 + b.m))
              ELSE ABS(a.y - b.y) END AS gap,
         (a.approx OR b.approx) AS approx,
         (a.old_style OR b.old_style) AS old_style
  FROM lab_three_wikipedias.lead_fact AS a
  JOIN lab_three_wikipedias.lead_fact AS b ON b.qid = a.qid AND b.field = a.field AND a.lang < b.lang
) AS p;
```

The headline counts ([people-summary.sql](sql/people-summary.sql)):

```sql
SELECT COUNT(*) AS topics_compared,
       SUM(worst = 0) AS agree_everywhere,
       SUM(worst > 0) AS disagree_somewhere,
       SUM(birth_gap > 0) AS disagree_on_birth,
       SUM(death_gap > 0) AS disagree_on_death,
       SUM(worst > 0 AND firm_gap = 0) AS only_where_a_date_is_marked_approximate,
       SUM(firm_gap > 0) AS disagree_on_a_date_given_as_exact
FROM (
  SELECT qid, MAX(gap) AS worst,
         MAX(IF(field = 'birth', gap, 0)) AS birth_gap,
         MAX(IF(field = 'death', gap, 0)) AS death_gap,
         MAX(IF(approx, 0, gap)) AS firm_gap
  FROM lab_three_wikipedias.fact_pair
  GROUP BY qid
) AS per_topic;
```

Distance between two languages of one topic ([distance.sql](sql/distance.sql)),
exact, by primary key, 500 topics per statement:

```sql
INSERT INTO lab_three_wikipedias.topic_distance
SELECT a.wikidata_id, a.lang, b.lang,
       VEC_DISTANCE_COSINE(va.embedding, vb.embedding),
       CHAR_LENGTH(a.text), CHAR_LENGTH(b.text),
       (va.truncated OR vb.truncated)
FROM lab_three_wikipedias.topic AS t
JOIN wtt.article AS a ON a.wikidata_id = t.qid AND a.history = 1
JOIN wtt.article AS b ON b.wikidata_id = t.qid AND b.history = 1 AND a.lang < b.lang
JOIN wtt.article_vector AS va ON va.lang = a.lang AND va.page_id = a.page_id
JOIN wtt.article_vector AS vb ON vb.lang = b.lang AND vb.page_id = b.page_id
WHERE t.qid BETWEEN ? AND ?;
```

Time travel, one article ([lead-history.sql](sql/lead-history.sql)):

```sql
SELECT HEX(p.ord) AS ord, p.born_rev, p.row_start, p.row_end, t.chars,
       LEFT(t.text, 420) AS head, LEFT(t.wikitext, 900) AS wikihead,
       e.user, e.editor, e.reverted_by
FROM wtt.passage FOR SYSTEM_TIME ALL AS p
JOIN wtt.passage_text AS t ON t.hash = p.hash
LEFT JOIN wtt.edit AS e ON e.rev_id = p.born_rev
WHERE p.page_id = ? AND t.kind = 'prose';
```

A date near miss ([date-near-miss.sql](sql/date-near-miss.sql)):

```sql
SELECT a.qid, a.lang AS lang_a, b.lang AS lang_b, a.shown AS shown_a, b.shown AS shown_b,
       ABS(a.day_number - b.day_number) AS gap_days, t.fi_title
FROM lab_three_wikipedias.lead_date AS a
JOIN lab_three_wikipedias.lead_date AS b
  ON b.qid = a.qid AND a.lang < b.lang
 AND a.day_number <> b.day_number AND ABS(a.day_number - b.day_number) <= 31
JOIN lab_three_wikipedias.topic AS t ON t.qid = a.qid
WHERE NOT EXISTS (SELECT 1 FROM lab_three_wikipedias.lead_date AS x
                  WHERE x.qid = a.qid AND x.lang = b.lang AND x.day_number = a.day_number)
  AND NOT EXISTS (SELECT 1 FROM lab_three_wikipedias.lead_date AS x
                  WHERE x.qid = a.qid AND x.lang = a.lang AND x.day_number = b.day_number);
```

The lab database holds six small tables and one view, under 7 MB together.

## What did not work

- **The first lifespan reader invented disagreements.** It took the first
  pair of years around a dash in brackets. That is often a name in use
  ("vuosina 1965–1973 Virkajärvi"), a term of office ("(2003–2019)") or a
  relative ("far till Fredrik Saltzman (1881–1972)"). Year-level
  disagreements fell from 216 pairs to 111 after the reader was changed to
  prefer markers, then a pair with a full date, and to take whichever reading
  starts first. The audit above is of the final reader. The 216 and the 377
  below were seen during the work. The final scripts do not reproduce them.
- **"s." also ends "o.s."** (née), and matched as a birth marker. Abbreviated
  markers now need a digit after them and no letter or full stop before.
- **The "still living" list is not good enough to show.** Of 8 random cases 5
  were deaths the reader missed: "mördad", "död (avrättad)", "born Källberg"
  for a birth name, and "(born 3 September 1838 … – 9 December 1929 …)" where
  it stops at "born". Of the 12 topics with a death from 2000 on, 7 were real
  and 5 were the same misses. The fixes are small. I did not make them,
  because they would change which disagreements exist and so the sample I had
  already read.
- **The clean text of a paragraph drops date templates.**
  `{{Syntymä- ja kuolinaika|2|1|1893|Vaasa|26|3|1918|Messukylä}}` leaves "()"
  in `passage_text.text`. The first time travel matched the snapshot for 377
  of 391 pairs. Reading `wikitext` and expanding those templates brought it to
  384. The last 7 (5 articles) are leads whose lifespan sits in a form the
  history reader does not follow.
- **`slot` alone does not follow the lead.** In the Mannerheim article the
  slot of today's lead held a different paragraph before 2016. The lead is
  found by position (`ord`) at each moment instead.
- **Quantities cannot be aligned without knowing what they count.** One real
  difference in ten read. Rounding and different census years are the rule.
- **Whole-article distance finds different topics, not different facts.**
- **Not done:** years outside lifespans ("founded in 1293"), abbreviated
  English months, dates before the year 1000 outside lifespans, BC dates, and
  any history for Swedish or English. The Swedish and English side of every
  claim is one snapshot.
- **The lifespan gap of 5 to 125 years** between birth and death is a guard
  against misreadings. A lead that states a wildly wrong year is dropped by
  it, not reported.

## What the product should do with it

1. **A mark beside the date.** In the article reader, when the Finnish lead
   gives a birth or death date that the Swedish or English lead gives
   differently, put a small mark beside it. On hover: both other values with
   links, and "Finnish has said this since 7 Nov 2023, before that 9 March
   1918". Wording stays neutral: "the Swedish article gives 9 mars 1918".
   The data is `editors-list.json` today. For all 343 facts it is `fact_pair`
   joined to the timeline.
2. **Show the calendar cases as such.** Where a lead mentions an old-style
   date or the gap is exactly the Julian offset (43 pairs), say "calendar
   difference" and do not raise it as a disagreement.
3. **A work list for editors**, sorted as above: two languages against one
   first. The 16 facts where Finnish is the odd one out, and the 5 where
   Finnish left the value the other two share, are the ones a Finnish editor
   can check fastest, because the revision that changed the date is one click
   away.
4. **"English still says is."** After fixing the reader as described, the
   list of people whose Finnish lead has a death and whose English lead has
   none is a ready errand for an English editor. Seven confirmed by reading.
5. **Do not ship quantities or a distance score.** Neither tells a reader
   anything true enough. The distance outliers could feed a different, small
   feature: "this article and its English counterpart are about different
   things".
6. **Keep it honest in the interface.** The lab knows what three leads said
   in August 2025 and what the Finnish lead said on every day since 2003. It
   does not know which date is right.
