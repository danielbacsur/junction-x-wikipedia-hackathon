# Numbers that moved

## The question

Which figures changed while the words around them stayed the same? This lab measures strict, single-number replacements in prose in the Finnish history sample. It does not decide which number is true.

## What we found

- **6,840 strict substitutions** across **3,011 articles**. **5,110** have neither endpoint's introducing edit marked `reverted_by`. **5,896** have an unflagged new endpoint alone.
- The conservative unflagged set contains **1,918 quantities**, **1,752 year-shaped tokens**, **725 dates**, and **715 changes between categories**. Year-shaped means an ungrouped integer from 1000 through 2099 without a recognized following quantity unit; it is not a semantic guarantee.
- **373 positions** qualify for the unsettled queue: at least two strict unflagged substitutions and either three distinct unflagged values or a return to an earlier value. **138 positions** have a return and at least two strict unflagged substitutions.
- The Winter War example is detected: **26 600 → 26662**, **2009-08-22 10:30:30 UTC**, revision **7215959**, editor **84.251.13.236**. Neither endpoint is flagged. Its exact-context preceding stay is **290.798125 days** and the successor's observed stay is **1829.256863 days**. These are not the total ages of the death-toll claim through every rewrite.

These are within-sample observations. “Standing” always means the dataset cutoff, **2026-10-01 10:59:12 UTC**, not the present calendar date.

### Size of quantity changes

Percent bins are disjoint. The tenfold row overlaps them. Digit patterns are separate descriptive classes, not proof of a typo. Dates and year-shaped tokens are excluded.

| Population | Classification | Band | Count | Share |
|---|---|---|---:|---:|
| all | relative change | 1–10% | 765 | 30.48% |
| all | relative change | at least tenfold (overlapping) | 211 | 8.41% |
| all | relative change | over 10% | 1,131 | 45.06% |
| all | relative change | under 1% | 611 | 24.34% |
| all | relative change | zero baseline | 3 | 0.12% |
| all | digit pattern (not inferred intent) | digit transposition shape | 11 | 0.44% |
| all | digit pattern (not inferred intent) | other | 1,046 | 41.67% |
| all | digit pattern (not inferred intent) | single digit insertion/deletion shape | 138 | 5.50% |
| all | digit pattern (not inferred intent) | single digit replacement shape | 1,315 | 52.39% |
| clean | relative change | 1–10% | 629 | 32.79% |
| clean | relative change | at least tenfold (overlapping) | 57 | 2.97% |
| clean | relative change | over 10% | 725 | 37.80% |
| clean | relative change | under 1% | 561 | 29.25% |
| clean | relative change | zero baseline | 3 | 0.16% |
| clean | digit pattern (not inferred intent) | digit transposition shape | 11 | 0.57% |
| clean | digit pattern (not inferred intent) | other | 773 | 40.30% |
| clean | digit pattern (not inferred intent) | single digit insertion/deletion shape | 71 | 3.70% |
| clean | digit pattern (not inferred intent) | single digit replacement shape | 1,063 | 55.42% |

### How long the figures stood

These are observed stay lengths, not Kaplan–Meier estimates. A censored new stay has only a lower bound on its eventual duration. Changes are the unit of analysis, so recurrent positions can contribute repeatedly.

| Population | Side | n | Median observed days | Right-censored |
|---|---|---:|---:|---:|
| all | old | 6,840 | 32.14 | 0 |
| all | new | 6,840 | 103.93 | 1,023 |
| clean | old | 5,110 | 60.09 | 0 |
| clean | new | 5,110 | 225.23 | 903 |

Full duration bins are in [durations.json](data/durations.json).

### Who changes numbers

“Value standing” allows a later return of the same value in the same slot and exact nonnumeric text skeleton. “Unbroken” requires the new continuous stay to reach cutoff. These measures undercount semantic survival through prose rewrites. Account type is not a quality judgment; no adjustment for edit year or topic is made.

| Population | Editor | Changes | Value standing | Unbroken | Standing share |
|---|---|---:|---:|---:|---:|
| all | named | 4,288 | 950 | 841 | 22.15% |
| all | ip | 2,508 | 195 | 161 | 7.78% |
| all | temp | 44 | 21 | 21 | 47.73% |
| all | hidden | 0 | 0 | 0 | — |
| clean | named | 3,423 | 781 | 736 | 22.82% |
| clean | ip | 1,660 | 161 | 146 | 9.70% |
| clean | temp | 27 | 21 | 21 | 77.78% |
| clean | hidden | 0 | 0 | 0 | — |

### The 25 least settled positions

Ranked by distinct unflagged values, then strict unflagged substitutions. Other simultaneous numeric changes can appear in the value history but are not counted as strict substitutions. Returns can span intervening prose rewrites or gaps; they are not necessarily consecutive edit wars. The quantity-only counterpart is [unsettled-quantities.json](data/unsettled-quantities.json). Each value interval, date, editor and revision is in [unsettled.json](data/unsettled.json). “Flips” below means strict substitutions, not every transition in that broader timeline.

| Rank | Article | Kind | Distinct values | Flips | Returns |
|---|---|---|---:|---:|---:|
| 1 | Koronaviruspandemia Suomessa | quantity | 66 | 3 | 0 |
| 2 | Koronaviruspandemia Suomessa | date | 56 | 4 | 0 |
| 3 | Koronaviruspandemia Suomessa | date | 23 | 2 | 0 |
| 4 | Koronaviruspandemia Suomessa | date | 20 | 4 | 0 |
| 5 | Koronaviruspandemia Suomessa | quantity | 17 | 2 | 0 |
| 6 | Metso (entinen yritys) | date | 15 | 14 | 0 |
| 7 | Uuden maailman käännös | quantity | 15 | 9 | 0 |
| 8 | Koronaviruspandemia Suomessa | date | 14 | 2 | 0 |
| 9 | Lassila & Tikanoja | date | 12 | 11 | 0 |
| 10 | Kolari | quantity | 11 | 8 | 0 |
| 11 | Nilsiä | quantity | 11 | 8 | 0 |
| 12 | Ristiina | quantity | 11 | 7 | 0 |
| 13 | Punkaharju | quantity | 11 | 5 | 0 |
| 14 | Jämsänkoski | quantity | 11 | 3 | 0 |
| 15 | Piippola | quantity | 10 | 7 | 0 |
| 16 | Ylihärmä | quantity | 10 | 6 | 0 |
| 17 | Karttula | quantity | 10 | 5 | 0 |
| 18 | Kerimäki | quantity | 10 | 5 | 0 |
| 19 | Jurva | quantity | 10 | 4 | 1 |
| 20 | Pertunmaa | quantity | 9 | 9 | 2 |
| 21 | Metso (entinen yritys) | quantity | 9 | 8 | 0 |
| 22 | Enontekiö | quantity | 9 | 8 | 1 |
| 23 | Hämeenkoski | quantity | 9 | 6 | 1 |
| 24 | Savonranta | quantity | 9 | 5 | 0 |
| 25 | Maaninka | quantity | 9 | 4 | 1 |

### Manual audit

I read the earliest strict unflagged substitution in each of the top 20 figures: the before and after sentences, both edit summaries, and the paragraph wikitext. These are research-agent judgments, not an independent human audit. I did not read outside sources or all transitions in each timeline. A source present in wikitext does not verify its contents. Labels apply only to the displayed change. No other cases are manually classified.

Audit labels: 1 correction with a source, 8 unclear, 11 update to newer data. No reviewed change is classified as a source dispute or surviving vandalism. This is not a random sample.

#### 1. Koronaviruspandemia Suomessa: 105 149 → 105 242

Before: Samaan aikaan pandemian lähtömaassa Kiinassa oli virallisten tietojen mukaan 105 149 tartuntaa.

After: Samaan aikaan pandemian lähtömaassa Kiinassa oli virallisten tietojen mukaan 105 242 tartuntaa.

Old summary: päivitys

New summary: päivitys

**update to newer data** — The China infection count rises while the Finnish count and date remain fixed. Both summaries say update; the same named reference remains. This looks like a staged statistical refresh, not a documented disagreement. The reference definition was not resolved.

Evidence: [revision 19916662](https://fi.wikipedia.org/?oldid=19916662), 2021-08-03 20:34:28 UTC.

#### 2. Koronaviruspandemia Suomessa: 10. syyskuuta 2021 → 11. syyskuuta 2021

Before: 10. syyskuuta 2021 mennessä Suomessa oli 132 662 vahvistettua tartuntaa.

After: 11. syyskuuta 2021 mennessä Suomessa oli 132 662 vahvistettua tartuntaa.

Old summary: päivitys

New summary: päivitys

**update to newer data** — The as-of date advances one day with the infection count unchanged. The summary says update. This is a reporting-date refresh, not evidence that yesterday's count was disputed.

Evidence: [revision 19991409](https://fi.wikipedia.org/?oldid=19991409), 2021-09-11 12:24:19 UTC.

#### 3. Koronaviruspandemia Suomessa: 13. tammikuuta 2022 → 14. tammikuuta 2022

Before: Väestöstä oli 13. tammikuuta 2022 mennessä rokotettu koronavirusta vastaan 1. annoksella noin 88,1 prosenttia, 2. annoksella 84,4 prosenttia ja 3. annoksella 34,5 prosenttia.

After: Väestöstä oli 14. tammikuuta 2022 mennessä rokotettu koronavirusta vastaan 1. annoksella noin 88,1 prosenttia, 2. annoksella 84,4 prosenttia ja 3. annoksella 34,5 prosenttia.

Old summary: päivitys

New summary: päivitys

**update to newer data** — The vaccination snapshot advances one day; all dose percentages stay fixed. The summary says update and a THL reference remains. Its contents were not read.

Evidence: [revision 20232308](https://fi.wikipedia.org/?oldid=20232308), 2022-01-14 17:54:34 UTC.

#### 4. Koronaviruspandemia Suomessa: 14. helmikuuta 2022 → 15. helmikuuta 2022

Before: Aikuisväestöstä oli 14. helmikuuta 2022 mennessä rokotettu koronavirusta vastaan 1. annoksella noin 88,6 prosenttia, 2. annoksella 86,1 prosenttia ja 3. annoksella 59,4 prosenttia.

After: Aikuisväestöstä oli 15. helmikuuta 2022 mennessä rokotettu koronavirusta vastaan 1. annoksella noin 88,6 prosenttia, 2. annoksella 86,1 prosenttia ja 3. annoksella 59,4 prosenttia.

Old summary: Täsmennys

New summary: (empty)

**update to newer data** — Both the vaccination snapshot date and the citation access date advance one day. Percentages stay fixed. This supports a date refresh despite the empty new summary; it does not verify the stated percentages.

Evidence: [revision 20299451](https://fi.wikipedia.org/?oldid=20299451), 2022-02-15 18:45:24 UTC.

#### 5. Koronaviruspandemia Suomessa: 6 054 → 6 145

Before: 14. toukokuuta 2020 mennessä Suomessa oltiin vahvistettu 6 054 tartuntaa.

After: 14. toukokuuta 2020 mennessä Suomessa oltiin vahvistettu 6 145 tartuntaa.

Old summary: Kumottu muokkaus 18924069, jonka teki [[Special:Contributions/85.76.102.0|85.76.102.0]] ([[User talk:85.76.102.0|keskustelu]])

New summary: Päivitys

**update to newer data** — The infection count increases and the summary explicitly says update. The dated news citation and other hospital/death counts stay fixed. This is consistent with a staged update; the prior revert summary alone does not make the new edit vandalism.

Evidence: [revision 18924173](https://fi.wikipedia.org/?oldid=18924173), 2020-05-14 09:12:11 UTC.

#### 6. Metso (entinen yritys): 31.1.2008 → 31.10.2008

Before: Metson suurimmat rekisteröidyt osakkeenomistajat olivat 31.1.2008:

After: Metson suurimmat rekisteröidyt osakkeenomistajat olivat 31.10.2008:

Old summary: 2007 luvut

New summary: /* Omistus */ päivitys

**update to newer data** — The shareholder-list snapshot advances from January to October. The summary says update; the company reference URL and access date also change. This is a newer snapshot rather than competing historical estimates.

Evidence: [revision 5761729](https://fi.wikipedia.org/?oldid=5761729), 2008-11-04 10:27:24 UTC.

#### 7. Uuden maailman käännös: 58 → 83

Before: Koko Raamattu on käännetty 58 kielelle, kreikkalaiset tekstit (Uusi testamentti) on käännetty 33 kielelle ja kaksi laitosta on saatavilla sokeiden pistekirjoituksella.

After: Koko Raamattu on käännetty 83 kielelle, kreikkalaiset tekstit (Uusi testamentti) on käännetty 33 kielelle ja kaksi laitosta on saatavilla sokeiden pistekirjoituksella.

Old summary: /* Painosmäärä ja käännetyt kielet */ Update #

New summary: /* Painosmäärä ja käännetyt kielet */ [http://www.jw-media.org/aboutjw/article43.htm#publishing www.jw-media.org]

**update to newer data** — The number of complete Bible translations increases and a publisher reference is added, also named in the edit summary. This looks like an updated publication count; the external source was not read, so its accuracy and exact date are not verified.

Evidence: [revision 10098128](https://fi.wikipedia.org/?oldid=10098128), 2011-04-24 15:43:17 UTC.

#### 8. Koronaviruspandemia Suomessa: 13. toukokuuta 2020 → 14. toukokuuta 2020

Before: 13. toukokuuta 2020 mennessä Suomessa oltiin vahvistettu 6 054 tartuntaa.

After: 14. toukokuuta 2020 mennessä Suomessa oltiin vahvistettu 6 054 tartuntaa.

Old summary: Typoja

New summary: Typo

**correction with a source** — The summary explicitly calls the date change a typo. An existing dated Helsingin Sanomat citation remains attached. This records a claimed correction with a source present, not independent confirmation that the revised day is correct.

Evidence: [revision 18923997](https://fi.wikipedia.org/?oldid=18923997), 2020-05-14 08:01:43 UTC.

#### 9. Lassila & Tikanoja: 31. lokakuuta 2020 → 30. marraskuuta 2020

Before: 31. lokakuuta 2020 L&T:n kymmenen suurinta omistajaa olivat:

After: 30. marraskuuta 2020 L&T:n kymmenen suurinta omistajaa olivat:

Old summary: /* Omistajat */ päivitys

New summary: /* Omistajat */ päivitys

**update to newer data** — The shareholder-list date advances from October to November and both summaries say update. The same company citation remains, with an older access date. This is consistent with a periodic update; saved citation dates are not reliable evidence of when a source was checked.

Evidence: [revision 19411805](https://fi.wikipedia.org/?oldid=19411805), 2020-12-14 11:28:22 UTC.

#### 10. Kolari: 3 771 → 3 779

Before: Kunnassa asuu 3 771 ihmistä ja sen pinta-ala on 2 618 km², josta 60 km² on vesistöjä.

After: Kunnassa asuu 3 779 ihmistä ja sen pinta-ala on 2 618 km², josta 60 km² on vesistöjä.

Old summary: (empty)

New summary: (empty)

**unclear** — The municipal population increases slightly. Neither summary explains the change and no source appears in this paragraph. An update is plausible, but correction versus new census data cannot be distinguished from the inspected evidence.

Evidence: [revision 3331422](https://fi.wikipedia.org/?oldid=3331422), 2007-08-18 05:54:41 UTC.

#### 11. Nilsiä: 6743 → 6 598

Before: Kaupungissa asuu 6743 ihmistä ja sen pinta-ala on 847,69 km², josta 138,25 km² on vesistöjä.

After: Kaupungissa asuu 6 598 ihmistä ja sen pinta-ala on 847,69 km², josta 138,25 km² on vesistöjä.

Old summary: [[Luokka:Suomen kaupungit]], en

New summary: laatikko, as. luvun päivitys

**update to newer data** — The summary explicitly says population update. The population decreases while area and density remain fixed. The paragraph has no citation, so the new count is not independently verified.

Evidence: [revision 1314361](https://fi.wikipedia.org/?oldid=1314361), 2006-06-29 12:57:14 UTC.

#### 12. Ristiina: 5151 → 5 106

Before: Kunnassa asuu 5151 ihmistä ja sen pinta-ala on 742,49 km², josta 168,51 km² on vesistöjä.

After: Kunnassa asuu 5 106 ihmistä ja sen pinta-ala on 742,49 km², josta 168,51 km² on vesistöjä.

Old summary: (empty)

New summary: päivitys

**update to newer data** — The summary says update and only the population changes in the visible paragraph. Area and density stay fixed. No reference is supplied here; classification concerns the apparent operation, not its accuracy.

Evidence: [revision 1846321](https://fi.wikipedia.org/?oldid=1846321), 2006-11-04 12:27:19 UTC.

#### 13. Punkaharju: 4 226 → 4 035

Before: Kunnassa asuu 4 226 ihmistä ja sen pinta-ala on 748,71 km², josta 250,28 km² on vesistöjä.

After: Kunnassa asuu 4 035 ihmistä ja sen pinta-ala on 748,71 km², josta 250,28 km² on vesistöjä.

Old summary: w. kh.

New summary: päivitys

**update to newer data** — The population falls and the summary says update. The unchanged area and density show that this is a partial statistical refresh. No source is attached to the inspected paragraph.

Evidence: [revision 2357157](https://fi.wikipedia.org/?oldid=2357157), 2007-02-13 18:43:45 UTC.

#### 14. Jämsänkoski: 7525 → 7 490

Before: Kunnassa asuu 7525 ihmistä ja sen pinta-ala on 448,67 km², josta 48,02 km² on vesistöjä.

After: Kunnassa asuu 7 490 ihmistä ja sen pinta-ala on 448,67 km², josta 48,02 km² on vesistöjä.

Old summary: (empty)

New summary: laatikko

**unclear** — Population changes while the summary only says box. The number may have been synchronized with an infobox, but that is not established by the paragraph read. There is no cited source or dated estimate here.

Evidence: [revision 1312464](https://fi.wikipedia.org/?oldid=1312464), 2006-06-29 04:15:05 UTC.

#### 15. Piippola: 1384 → 1332

Before: Kunnassa asuu 1384 ihmistä ja sen pinta-ala on 465,02 km² josta 9,87 km² on vesistöjä.

After: Kunnassa asuu 1332 ihmistä ja sen pinta-ala on 465,02 km² josta 9,87 km² on vesistöjä.

Old summary: Luokka:Piippola

New summary: (empty)

**unclear** — The population falls from 1384 to 1332 with an empty summary and no paragraph reference. It is a quantity, despite looking like a year to a digit-only classifier. Update versus correction is unresolved.

Evidence: [revision 412100](https://fi.wikipedia.org/?oldid=412100), 2005-09-06 19:32:30 UTC.

#### 16. Ylihärmä: 3086 → 2990

Before: Kunnassa asuu 3086 ihmistä ja sen pinta-ala on 151,82 km² josta 0,35 km² on vesistöjä.

After: Kunnassa asuu 2990 ihmistä ja sen pinta-ala on 151,82 km² josta 0,35 km² on vesistöjä.

Old summary: (empty)

New summary: (empty)

**unclear** — The population decreases and an internal link target changes. There is no summary or source explaining the new count. Visible wording identity can conceal markup changes; no dispute is established.

Evidence: [revision 3060154](https://fi.wikipedia.org/?oldid=3060154), 2007-06-24 19:59:31 UTC.

#### 17. Karttula: 3453 → 3516

Before: Kunnassa asuu 3453 ihmistä ja sen pinta-ala on 589,21 km² josta 121 km² on vesistöjä.

After: Kunnassa asuu 3516 ihmistä ja sen pinta-ala on 589,21 km² josta 121 km² on vesistöjä.

Old summary: kopioitu sivulta Käyttäjä:Jniemenmaa/kunnat K

New summary: lisäys

**unclear** — The summary only says addition. Population rises, but there is no source or observation date in the inspected paragraph. This may be an ordinary update, but the evidence does not distinguish it from a correction.

Evidence: [revision 453855](https://fi.wikipedia.org/?oldid=453855), 2005-10-01 10:48:23 UTC.

#### 18. Kerimäki: 5 817 → 5 807

Before: Kunnassa asuu 5 817 ihmistä, ja sen pinta-ala on 875,39 km², josta 281,14 km² on vesistöjä.

After: Kunnassa asuu 5 807 ihmistä, ja sen pinta-ala on 875,39 km², josta 281,14 km² on vesistöjä.

Old summary: (empty)

New summary: (empty)

**unclear** — The population decreases by ten. Both summaries are empty and the paragraph contains no reference. The small magnitude and digit pattern do not prove a typo or a statistical update.

Evidence: [revision 3442847](https://fi.wikipedia.org/?oldid=3442847), 2007-09-08 12:34:26 UTC.

#### 19. Jurva: 4450 → 4434

Before: Kunnassa asuu 4450 ihmistä ja sen pinta-ala on 447,18 km², josta 3,11 km² on vesistöjä.

After: Kunnassa asuu 4434 ihmistä ja sen pinta-ala on 447,18 km², josta 3,11 km² on vesistöjä.

Old summary: (empty)

New summary: (empty)

**unclear** — The population decreases with no edit summary and no reference in the paragraph. A later population estimate is plausible but not demonstrated by the inspected text.

Evidence: [revision 2318296](https://fi.wikipedia.org/?oldid=2318296), 2007-02-05 21:48:42 UTC.

#### 20. Pertunmaa: 2203 → 2215

Before: Kunnassa asuu 2203 ihmistä ja sen pinta-ala on 454,57 km², josta 78 km² on vesistöjä.

After: Kunnassa asuu 2215 ihmistä ja sen pinta-ala on 454,57 km², josta 78 km² on vesistöjä.

Old summary: +en,ro

New summary: (empty)

**unclear** — The population increases. The new summary is empty and the old summary concerns language links. With no cited count or date here, the reason for the numerical change remains unresolved.

Evidence: [revision 641901](https://fi.wikipedia.org/?oldid=641901), 2005-12-25 20:27:57 UTC.

## How it was measured

Run from the repository root, sequentially:

```sh
uv run labs/numbers-that-moved/run.py
uv run labs/numbers-that-moved/audit.py
uv run labs/numbers-that-moved/core_audit.py
uv run labs/numbers-that-moved/validate.py
uv run labs/numbers-that-moved/publish.py
uv run labs/numbers-that-moved/report.py
```

`run.py` resumes completed compressed chunks. To repeat the extraction from source, remove only `labs/numbers-that-moved/cache/*.json.gz` and `labs/numbers-that-moved/cache/audit-input.json`, then run the commands again. To recompute outputs from the cache without database reads: `uv run labs/numbers-that-moved/run.py report`. Manual labels are retained in `audit-labels.json`; they must be reviewed if the selected cases change. The Winter War evidence can be reproduced with `uv run labs/numbers-that-moved/evidence.py`.

One connection reads 100 current page IDs per range, then their edit metadata and all historical prose rows. It streams the SQL result and holds only that chunk in Python. All prose lengths are eligible, but the nonnumeric surrounding text must contain at least one letter. Pure numeric map fragments are excluded. Slots equal to zero and nonpositive intervals are excluded. No giant history join, core writes, core indexes, external network requests or servers are used. The only database write is the tiny summary table in `lab_numbers_that_moved`. Extracted candidate evidence is cached locally; full revision text is never selected.

Number rules:

- Grouped thousands accept ordinary, no-break and narrow no-break spaces: `26 662`, `26 662`, `26 662`. Decimal comma is parsed as a decimal separator. Signs are retained. Formatting-only numeric equivalence does not count.
- Full numeric dates (`13.3.1940`) and Finnish day/month/year expressions (`13. maaliskuuta 1940`) are single date tokens, normalized to year-month-day. The twelve Finnish partitive month names are supported. A date change is not a percentage change.
- Standalone, ungrouped four-digit values in 1000–2099 are **year-shaped**, a transparent heuristic. Recognized following Finnish units (including people, inhabitants, soldiers, currency, distance and percent) override this to quantity. Other quantities of that shape can still be misclassified. Years outside that range, partial dates, clock times, identifiers and ranges need more contextual parsing. Spelled-out numbers are excluded. A token embedded after a letter is not recognized.
- Literal text outside numeric tokens must match exactly, including whitespace and punctuation. Exactly one numeric value and one surface-form token may differ. All other numbers must have identical written forms. This excludes a number correction accompanied by any prose rewrite, even a small one.

Within page and nonzero slot, identical visible wordings are unioned across overlapping and touching rows, regardless of hash, duplicate or ordinal position. Only adjacent, touching, nonoverlapping wording stays qualify as direct changes. Neighbour overlaps are rejected conservatively. This avoids counting a moved block as a new numerical assertion. The transition revision is looked up by page and start timestamp, falling back to `born_rev` only when missing. Merged stays keep their first introducing edit.

The conservative clean population requires both introducing edits to have `reverted_by IS NULL`. It removes a flagged number and the repair transition back out of it. It does not fabricate an A → C substitution across a discarded B. The additional new-endpoint-only count makes that choice visible. This is an origin-based filter; it does not infer the correctness of unflagged versions or remove every second of exposure in a reverted whole-page version.

A figure position is `(page_id, slot, nonnumeric literal skeleton, numeric index)`. Other numbers may change over its timeline. For each value in that position, overlapping and touching intervals are unioned again. The old duration runs from the start of its containing union interval to the substitution. The new duration runs from the substitution to the end of its containing interval; values reaching cutoff are right-censored. Disjoint returns are listed separately, never bridged into a continuous lifetime. These are exact-context figure durations; substantial surrounding rewrites end observation even when the historical claim persists.

Size is `abs(new-old)/abs(old)`. The bins are below 1%, 1% through 10% inclusive, and above 10%; an old zero has its own denominator category. Tenfold means the ratio of the larger absolute nonzero value to the smaller is at least ten. A transposition shape swaps exactly two digit positions; a single-digit replacement shape differs at one position with unchanged digit length. Signs and decimal punctuation are ignored by this digit-shape screen. One inserted or deleted digit is a third shape class. None of these classes proves intent.

## The exact SQL

Every query is saved under [sql/](sql/). The only scan join is bounded by page ID:

```sql
SELECT p.page_id,p.slot,HEX(p.hash),p.born_rev,p.row_start,
       LEAST(p.row_end,'2026-10-01 10:59:12'),t.text
FROM passage FOR SYSTEM_TIME ALL AS p
JOIN passage_text AS t ON t.hash=p.hash
WHERE p.page_id BETWEEN %s AND %s AND t.kind='prose'
  AND p.row_start < '2026-10-01 10:59:12';
```

[edits.sql](sql/edits.sql) supplies timestamps, authors, comments and revert flags. [titles.sql](sql/titles.sql) reads only current page IDs and titles. [audit.sql](sql/audit.sql) reads the selected paragraph wikitext by hash. [database.sql](sql/database.sql) and [summary-store.sql](sql/summary-store.sql) create and populate only the lab database. The session timezone is set with `SET time_zone='+00:00'`. Normalization, temporal unions and aggregation are in [run.py](run.py); manual decisions are in [audit-labels.json](audit-labels.json).

## What did not work

Strict identity trades recall for interpretable evidence. It misses simultaneous wording corrections, paragraph splits and merges, and lineages that the inferred slot system fails to join. The same number in rephrased prose can survive while this lab records an endpoint. Do not label these endpoints as factual retractions.

A missing revert flag is not evidence that a number was accepted. Surviving mistakes, partial reverts and disagreements can remain. Year-shaped quantities and partial dates need semantic review before presenting quantity-only percentages as exact. Many leading “unsettled” figures are evolving population or infection counts and dates of statistical snapshots; repeated changes alone do not establish disagreement.

The core parser labels bare coordinate fragments in Kyllikki Saaren murha as prose. Two inspected positions are reproduced in [core-data-audit.json](data/core-data-audit.json). The Finnish numeric parser splits their period decimals into separate integers, creating absurd changes. The final surrounding-letter gate excludes these fragments. Decimal points within actual prose remain a parser limitation. No core data was repaired.

The first development pass kept `born_rev` as transition attribution and did not normalize zero-padded dates. It was discarded and rerun with timestamp-based edit attribution and normalized dates. Formatting-only changes and multi-number changes remain outside the strict headline count. A later pass added the surrounding-letter gate and quantity-unit override after the manual audit. Counts of skipped cases and structural anomalies are in [summary.json](data/summary.json).

## What the product should do with it

Show a “Numbers that changed” page with a default filter for quantities and unflagged transitions. Let readers switch to dates and years. Put old and new sentences, edit summaries, authors and revision links beside each change. A timeline should show gaps and censoring explicitly.

A reader marker can say “this number changed N times in otherwise identical prose.” It should open the evidence, not call the figure disputed. Use the manually reviewed labels only for those reviewed changes. Separate ordinary updates from possible source disagreements. Avoid editor rankings: the unadjusted survival shares mix topic, cohort, account age and parser coverage.
