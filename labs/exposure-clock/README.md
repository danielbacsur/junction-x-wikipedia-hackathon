# Exposure clock

## The question

How long do edits later labeled undone remain exposed in these Finnish Wikipedia histories, how did recorded durations change from 2004 to 2026, and what changed around temporary accounts? Can metadata distinguish patrol-like corrections from long-range restores and named-user revert clusters?

## What we found

- **15.23 minutes** is the median among 64,822 undone versions whose recorded restoring revision has a known hash; **24.68 minutes** using all 70,176 supplied undo labels. The distinction matters: 5,354 labels point to restores with missing hashes.
- **24.81% → 31.91%**: anonymous edits undone by someone else within seven days before versus after the first temporary account. The increase is **7.11 percentage points**, article-cluster bootstrap 95% interval **1.49–12.65**. This supports an observed association, not a causal effect of the switch.
- **2,350 → 1,573 anonymous edits** in the selected six-month windows, a **33.1%** fall. Named edits fell **36.1%**. Conditional seven-day median exposure moved **640 → 974.5 seconds**, but its difference interval **-479 to 1090 seconds** includes zero: no clear evidence of changed exposure time.
- **5,117 versions exceed one year** in the supplied labels. The longest is **5,557.91 days**, an empty-page restore spanning 1,106 edits, not evidence of persistent vandalism.
- **10,930 known-hash named-versus-named revert events** across **8,020 article-months**. The largest cluster has **30 events**, Axel Olof Freudenthal in 2006-07.

### Yearly exposure

The following table deliberately reproduces the supplied `undone_by` population. Units for quantiles are minutes; hours are overlapping **version-hours attributed to the edit's year**. The separate union column is **article-hours allocated to the calendar year in which the interval occurs**; those columns are not the same quantity. All threshold shares are percentages and inclusive. 2003 is in JSON but omitted here because the question begins in 2004. 2026 is partial, ending 2026-10-01 10:59:12 UTC, and especially vulnerable to right censoring.

| Year | n | Median min | p75 min | p90 min | p99 min | ≤1m % | ≤1h % | ≤1d % | ≤1w % | Version-hours | Union article-hours |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2004 | 222 | 13.21 | 1,519.94 | 428,797.11 | 5,760,627.81 | 12.61 | 65.32 | 74.77 | 79.73 | 1,546,924 | 22,127 |
| 2005 | 1,524 | 14.27 | 3,456.50 | 600,271.06 | 4,031,150.84 | 10.43 | 61.15 | 72.31 | 78.28 | 3,931,262 | 51,269 |
| 2006 | 4,453 | 19.98 | 71,689.53 | 477,408.62 | 7,904,076.59 | 19.22 | 55.54 | 67.93 | 71.14 | 25,838,316 | 148,520 |
| 2007 | 6,116 | 17.73 | 1,587.29 | 270,217.09 | 7,397,272.52 | 20.29 | 57.10 | 74.62 | 79.97 | 29,399,985 | 175,026 |
| 2008 | 4,889 | 4.92 | 288.40 | 36,028.48 | 6,702,890.05 | 29.94 | 67.93 | 82.72 | 87.75 | 16,382,320 | 228,865 |
| 2009 | 3,758 | 5.90 | 495.32 | 34,242.70 | 6,262,443.20 | 26.98 | 65.97 | 79.83 | 87.57 | 12,536,833 | 383,071 |
| 2010 | 3,311 | 8.80 | 1,353.58 | 215,162.88 | 5,586,794.75 | 23.59 | 61.07 | 75.51 | 83.99 | 10,277,491 | 495,215 |
| 2011 | 3,151 | 10.92 | 742.38 | 37,633.97 | 2,025,673.03 | 18.95 | 61.41 | 80.04 | 86.77 | 4,205,499 | 650,034 |
| 2012 | 3,702 | 52.70 | 20,346.88 | 301,308.68 | 4,620,069.28 | 14.40 | 50.86 | 69.02 | 73.74 | 20,374,531 | 1,290,667 |
| 2013 | 2,824 | 30.23 | 743.16 | 83,765.74 | 4,240,780.84 | 14.77 | 55.28 | 79.21 | 84.49 | 6,510,679 | 757,068 |
| 2014 | 2,551 | 40.73 | 1,003.58 | 127,781.45 | 3,570,427.52 | 11.05 | 52.45 | 77.50 | 84.28 | 7,092,993 | 374,003 |
| 2015 | 3,159 | 24.17 | 823.23 | 108,346.08 | 2,514,574.44 | 15.83 | 56.28 | 79.36 | 86.45 | 7,872,337 | 324,872 |
| 2016 | 3,243 | 54.73 | 4,400.90 | 1,589,546.34 | 5,189,280.18 | 13.20 | 50.48 | 68.36 | 80.60 | 25,986,199 | 409,444 |
| 2017 | 3,066 | 32.08 | 1,367.24 | 912,345.68 | 4,519,038.70 | 13.21 | 54.73 | 75.18 | 81.80 | 15,446,143 | 481,206 |
| 2018 | 3,055 | 28.07 | 1,376.92 | 367,622.19 | 3,855,914.05 | 15.65 | 54.53 | 75.45 | 82.98 | 8,521,607 | 480,491 |
| 2019 | 3,713 | 42.13 | 4,084.20 | 347,546.25 | 3,586,147.23 | 13.60 | 53.35 | 71.88 | 79.53 | 11,723,459 | 659,951 |
| 2020 | 3,420 | 102.12 | 9,138.89 | 54,417.74 | 2,888,182.06 | 12.13 | 45.94 | 67.22 | 75.38 | 5,841,673 | 707,546 |
| 2021 | 2,451 | 13.98 | 1,275.47 | 205,960.58 | 2,563,501.77 | 21.58 | 60.26 | 75.28 | 81.35 | 6,152,493 | 425,472 |
| 2022 | 2,354 | 22.88 | 1,464.68 | 52,980.37 | 2,052,999.80 | 16.19 | 56.37 | 74.81 | 83.09 | 4,556,254 | 300,097 |
| 2023 | 3,130 | 35.42 | 2,104.46 | 555,222.50 | 1,551,676.94 | 13.71 | 53.90 | 74.19 | 78.21 | 7,506,640 | 334,233 |
| 2024 | 2,755 | 168.55 | 17,565.13 | 694,074.31 | 1,060,343.48 | 11.51 | 44.21 | 65.70 | 72.56 | 5,655,616 | 330,381 |
| 2025 | 2,383 | 94.98 | 6,816.98 | 59,250.39 | 476,150.35 | 11.58 | 45.70 | 65.59 | 82.08 | 1,016,662 | 199,121 |
| 2026 | 944 | 57.77 | 750.89 | 11,579.94 | 68,046.92 | 8.69 | 50.21 | 79.34 | 89.19 | 78,353 | 84,342 |

The yearly medians do not show a steady improvement. Known-hash results and the narrower anonymous short-local population are shown below; population composition and follow-up duration still differ. The local proxy selects on restore-target age, so its seven-day upper bound is built into its definition.

| Year | Known-hash n | Known-hash median min | Anonymous short-local n | Short-local median min |
|---|---|---|---|---|
| 2004 | 222 | 13.21 | 67 | 9.25 |
| 2005 | 1,524 | 14.27 | 381 | 5.37 |
| 2006 | 4,453 | 19.98 | 1,128 | 1.96 |
| 2007 | 6,116 | 17.73 | 1,786 | 2.46 |
| 2008 | 4,874 | 4.83 | 1,437 | 1.08 |
| 2009 | 3,690 | 5.33 | 967 | 1.37 |
| 2010 | 3,172 | 7.20 | 826 | 1.32 |
| 2011 | 3,027 | 8.97 | 899 | 2.50 |
| 2012 | 3,230 | 20.48 | 904 | 3.41 |
| 2013 | 2,593 | 19.02 | 671 | 3.75 |
| 2014 | 2,284 | 21.23 | 512 | 6.16 |
| 2015 | 2,812 | 12.43 | 762 | 3.47 |
| 2016 | 2,796 | 20.61 | 606 | 4.03 |
| 2017 | 2,672 | 14.94 | 733 | 7.15 |
| 2018 | 2,663 | 13.45 | 687 | 5.02 |
| 2019 | 3,230 | 18.62 | 860 | 5.71 |
| 2020 | 3,123 | 59.90 | 614 | 6.12 |
| 2021 | 2,178 | 6.99 | 396 | 1.63 |
| 2022 | 2,157 | 15.77 | 429 | 4.57 |
| 2023 | 2,680 | 16.46 | 631 | 3.98 |
| 2024 | 2,216 | 33.50 | 545 | 5.20 |
| 2025 | 2,174 | 62.35 | 304 | 2.77 |
| 2026 | 934 | 55.93 | 143 | 12.33 |

### What “exposure” does and does not mean

The supplied labels sum to **238,455,491 version-hours**, versus **9,313,731 article-hours** after merging overlapping undo-to-revert intervals on each article. Neither is reader exposure or proven survival of particular inserted text. **23,842** versions were replaced before their recorded revert. The sum of their exact saved-version lifetimes (including all undone versions) is **9,313,731 hours**. Subsequent versions may preserve or remove any part of the text; metadata cannot tell.

Long-range restores contribute **98.00%** of supplied version-hours. Missing-hash restore labels alone contribute **43.85%**. These populations overlap and must not be added. There are **5,147 same-identifier self-corrections**, separated from other-user undos throughout.

| Population | Self | n | Median min | p90 min | Version-hours |
|---|---|---|---|---|---|
| intermediate | 0 | 28,422 | 32.57 | 17,067.75 | 4,482,838 |
| intermediate | 1 | 2,145 | 1.63 | 2,805.96 | 157,534 |
| long_range | 0 | 11,832 | 402,196.04 | 1,666,666.67 | 233,286,974 |
| long_range | 1 | 274 | 11.19 | 388,432.75 | 405,497 |
| short_local | 0 | 24,775 | 5.37 | 623.63 | 116,733 |
| short_local | 1 | 2,728 | 1.15 | 25.54 | 5,916 |

### Editor and reverter split

These are supplied-label results, not comparisons of editor quality. Named edits have a much longer historical tail; temporary accounts only exist at the end of the sample. The full cross-tab by editor × reverter (named/anonymous/hidden) × self × restore range is in [exposure-by-editor.json](data/exposure-by-editor.json); [valid-exposure-by-editor.json](data/valid-exposure-by-editor.json) excludes missing restoring hashes.

| Editor | Self | n | Median seconds | Within hour % |
|---|---|---|---|---|
| hidden | 0 | 12 | 30.5 | 100.00 |
| ip | 0 | 38,800 | 476.5 | 67.33 |
| ip | 1 | 1,864 | 62.0 | 97.85 |
| named | 0 | 25,238 | 68883.0 | 31.87 |
| named | 1 | 3,274 | 108.5 | 79.35 |
| temp | 0 | 979 | 1796.0 | 56.69 |
| temp | 1 | 9 | 70.0 | 88.89 |

### Temporary accounts: an observational before/after comparison

First appearance in this sample: **2025-09-10 18:02:57 UTC**. This is a sample observation, not independently verified deployment timing. Before = March–August 2025; after = October 2025–March 2026; omit September's transition. The seasonal reference is October 2024–February 2025: the query selects October–March, but its `CASE` gives March 2025 to the before window, so the reference holds five months (the monthly file confirms 1,910 edits and 490 undone from October to February). Before and after are six complete months each, and the reference is not an independent control.

| Window | Editor | Edits | Observed undone, any lag/self | Nonself ≤7d | Share % | Conditional median seconds | Conditional p90 seconds |
|---|---|---|---|---|---|---|---|
| after | anonymous | 1,573 | 554 | 502 | 31.91 | 974.5 | 76928.2 |
| after | named | 9,976 | 291 | 167 | 1.67 | 8381.0 | 172960.0 |
| before | anonymous | 2,350 | 658 | 583 | 24.81 | 640.0 | 218750.6 |
| before | hidden | 1 | 1 | 1 | 100.00 | 19.0 | 19.0 |
| before | named | 15,603 | 692 | 426 | 2.73 | 68313.5 | 441658.5 |
| seasonal_baseline | anonymous | 1,910 | 537 | 490 | 25.65 | 933.5 | 62906.4 |
| seasonal_baseline | named | 18,123 | 377 | 211 | 1.16 | 5394.0 | 215093.0 |

Anonymous seven-day outcomes are unchanged when missing-hash restores are excluded. Anonymous share of all edits is 13.13% before versus 13.62% after: a drop in anonymous counts alone is weak evidence about the account switch. The previous autumn/winter anonymous median was 933.5 seconds, close to the post-switch 974.5 seconds. The full monthly series preserves IP and temporary accounts separately in [temp-accounts.json](data/temp-accounts.json). September 2026 ends at the seven-day eligibility cutoff; October has no eligible edits.

The article-cluster bootstrap resamples the union of 1,549 articles with replacement, using the same article weight in both periods, 2,000 repetitions and seed 20261114. It quantifies article concentration but does not model calendar shocks, editor dependence across articles, seasonality, or selection into this topic set. Exposure medians condition on a nonself undo within seven days: they are truncated outcome distributions, not an unconditional survival estimate. The available exposure results do not support claiming slower patrol from these data.

### Time of day and weekday

Known-hash anonymous nonself short-local restores only; Europe/Helsinki local time, historical DST included. These are descriptive durations among observed undo outcomes, not confirmed vandalism, and not a staffing recommendation. Low overnight counts and changing year/article composition can affect comparisons.

| Local hour | n | Median minutes | p90 hours |
|---|---|---|---|
| 0 | 421 | 9.12 | 11.05 |
| 1 | 338 | 12.49 | 11.56 |
| 2 | 294 | 18.24 | 10.30 |
| 3 | 137 | 59.20 | 12.24 |
| 4 | 118 | 54.15 | 11.10 |
| 5 | 78 | 81.22 | 10.17 |
| 6 | 79 | 121.93 | 11.93 |
| 7 | 164 | 122.80 | 11.65 |
| 8 | 518 | 6.87 | 5.52 |
| 9 | 1021 | 1.67 | 0.85 |
| 10 | 1237 | 1.72 | 0.80 |
| 11 | 1182 | 1.62 | 1.14 |
| 12 | 1397 | 1.60 | 1.30 |
| 13 | 1305 | 1.67 | 1.16 |
| 14 | 1082 | 1.96 | 2.16 |
| 15 | 834 | 3.69 | 3.44 |
| 16 | 857 | 3.77 | 5.75 |
| 17 | 824 | 3.47 | 4.32 |
| 18 | 839 | 3.27 | 5.60 |
| 19 | 774 | 2.77 | 4.45 |
| 20 | 782 | 3.46 | 5.82 |
| 21 | 710 | 2.93 | 10.90 |
| 22 | 704 | 4.72 | 11.78 |
| 23 | 593 | 5.10 | 10.45 |

| Weekday | n | Median minutes | p90 hours |
|---|---|---|---|
| Monday | 2867 | 2.40 | 3.68 |
| Tuesday | 2709 | 2.73 | 4.16 |
| Wednesday | 2555 | 2.40 | 4.83 |
| Thursday | 2682 | 2.62 | 4.14 |
| Friday | 2409 | 2.92 | 4.25 |
| Saturday | 1510 | 5.08 | 7.14 |
| Sunday | 1556 | 5.43 | 6.32 |

### Twenty longest-lived undone versions

All twenty belong to **Vanhoillislestadiolaisuus**, and all are classified long-range. On 2021-05-14, revision **19772752** repeated the empty-text hash of revision **831633** from 2006-02-24; both have zero bytes. Its comment is “Ak: Sivu tyhjennettiin” (“page was blanked”). These are historical intervening edits swept into the span of a later blanking. Their comments include anti-vandalism restores, section edits, wording discussion and reference ordering. This is demonstrably a long-range empty-text identity match, not evidence that those old edits were vandalism. Intent of the later blanking is not established. No text was read. Full reverter metadata and comments are in [longest-lived.json](data/longest-lived.json).

| Rev ID | Exposure days | Exact version days | Original edit comment |
|---|---|---|---|
| 831644 | 5,557.91 | 0.0237 | palautus - vandalismia |
| 831770 | 5,557.87 | 1.2475 | palautus |
| 835781 | 5,556.63 | 0.9285 | /* Seurat */ |
| 838315 | 5,555.70 | 0.01 | /* Kritiikki */ |
| 838403 | 5,555.68 | 0.0069 | ihan turhaa tuossa kritiikki vaiheessa ruveta selittämään tuommoista, mutta noista puoluekannoista voisi kyllä selittää ylempänä artikkelissa, mikä voisi olla ihan relevanttia |
| 838427 | 5,555.68 | 0.0393 | /* Kritiikki */  otetaan pois koko aihe, Suomessa on yleinen äänioikeus ja kuka tahansa saa äänestää ketä tahansa. ei siitä voi kritisoida |
| 838608 | 5,555.64 | 0.0133 | /* Erot muihin lestadiolaissuuntiin */ |
| 838665 | 5,555.62 | 1.0131 | /* Yhteisöllisyys */ |
| 841706 | 5,554.61 | 6.1467 | kh |
| 862827 | 5,548.46 | 0.0318 | lisätty sana endogamia |
| 862860 | 5,548.43 | 0.365 | (none) |
| 863712 | 5,548.07 | 0.0061 | /* Yhteisöllisyys */ näin ehkä parempi muotoilu |
| 863794 | 5,548.06 | 0.0068 | palautus. ei merkittyjen lähteiden puute ole peruste tiedon poistamiselle. tiedät itsekin että tieto on tosi |
| 863858 | 5,548.05 | 0.0947 | Käyttäjän [[Toiminnot:Contributions/128.214.205.4\|128.214.205.4]] ([[Keskustelu_käyttäjästä:128.214.205.4\|keskustelu]]) muokkaukset kumottiin ja sivu palautettiin viimeisimpään käyttäjän Kahkonen tekemään versioon. |
| 864348 | 5,547.95 | 0.0023 | (none) |
| 864362 | 5,547.95 | 0.0035 | "synti", huono sana: "Mitään syntilistaa ei ole, vaan on uskovaisen omantunnon asia..". Muistan kyllä jonkun dokkarin jossa joku piti esiaviollista suutelemista ei-suotavana |
| 864380 | 5,547.95 | 0.0023 | mieluummin "sopimaton" kuin ei-sopivana ja kyllä synti-sanan voi tässä tuoda esille, koska lauseessa on kyse käytännön tasosta eikä virallisista julistuksista. |
| 864394 | 5,547.94 | 0.0238 | sana "synti" on ihan liikaa |
| 864540 | 5,547.92 | 0.0025 | ei muutosta tekstiosaan. lähteiden numerojärjestys tekstin lähdenumeroita vastaavaksi |
| 864557 | 5,547.92 | 1.9186 | ei kuulu johdantoon, yksityiskohta |

### Named-versus-named revert clusters

Count each known-hash restoring revision once per article/month if its full restored span includes at least one differently named account. Unlike exposure, this uses **every restore span**, including repeated reversals of already undone versions. One revert can touch several users; pair counts therefore need not sum to unique event totals. This is activity clustering, not a judgment of intent. Missing-hash exclusions remove 26 candidate events.

| Article | Month | Distinct reverts | Event-user edges | Undo associations |
|---|---|---|---|---|
| Axel Olof Freudenthal | 2006-07 | 30 | 42 | 55 |
| Ilkka Kanerva | 2008-03 | 29 | 29 | 38 |
| Jokelan koulusurmat | 2007-11 | 26 | 29 | 32 |
| Pekka Haavisto | 2012-01 | 24 | 29 | 32 |
| Jaama | 2006-08 | 22 | 34 | 55 |
| Suomalaisuuden liitto | 2007-05 | 21 | 23 | 27 |
| Katri Kulmuni | 2021-12 | 21 | 21 | 21 |
| Karjala | 2008-05 | 17 | 18 | 25 |
| Mona Bling | 2021-08 | 16 | 19 | 22 |
| Johannes Virolainen | 2009-01 | 14 | 14 | 16 |
| Kalevala | 2007-01 | 14 | 14 | 16 |
| Sauli Niinistö | 2012-02 | 14 | 14 | 14 |
| Tarja Halonen | 2008-02 | 13 | 14 | 15 |
| Suur-Suomi | 2005-08 | 13 | 16 | 23 |
| Suomen kuningaskuntahanke | 2021-06 | 13 | 13 | 17 |
| Jatkosota | 2015-12 | 11 | 11 | 55 |
| Talvisota | 2008-01 | 11 | 15 | 39 |
| Suomen presidentinvaali 2018 | 2018-01 | 11 | 13 | 14 |
| Osmo Soininvaara | 2009-02 | 10 | 11 | 15 |
| Vihtori Kosola | 2022-11 | 10 | 10 | 11 |

Who reverted whom appears only as directed counts in [revert-clusters.json](data/revert-clusters.json) and [cluster-pairs.md](cluster-pairs.md), without allegations.

## How it was measured

Run from the repository root:

```sh
uv run labs/exposure-clock/run.py
uv run labs/exposure-clock/validate.py
uv run labs/exposure-clock/report.py
```

MariaDB at `127.0.0.1:3310`, local root password `wtt`, is used because user `wtt` cannot read newly created lab tables. Only `lab_exposure_clock` is written. Source tables are read-only. One sequential connection per script; validation closes its connection before bootstrap. No text queries, no text scans, no web sources, no commits. Re-running rebuilds only this lab's tables and artifacts. `inspect_schema.py` is optional schema inspection. `audit.py` is optional targeted metadata inspection.

1. **Unit:** one supplied undone version. Join `(page_id, undone_by)` to its recorded restoring revision. Exposure = `TIMESTAMPDIFF(SECOND, saved_at, revert_at)`, whole seconds. Quantiles use interpolated `PERCENTILE_CONT`; all shares include equality. Year is the undone edit's UTC year. Values rounded in tables are presentation only; JSON retains query precision.
2. **Identity validity:** the source computes `LAG(seq)` partitioned by page and SHA1, including NULLs. A NULL match is not proof of identity. Raw requested files retain supplied labels for reconciliation; valid variants remove rows whose assigned restoring hash is NULL. They do not seek a later valid revert after an invalid first label. There are 483 missing-hash edits and 285 such restoring revisions. Empty-string hash matches are different: an actual empty-text hash is valid identity but may describe repeated blanking.
3. **Self:** exact binary equality of available user identifiers, excluding hidden identities in the fact table. Shared IPs can conflate people; changed IPs or temporary identifiers can split them. Named does not mean human: bot status is unavailable. Anonymous = IP or temporary account; hidden is separate.
4. **Restore populations:** short-local = at most 5 intervening versions and restored target at most 7 days old at revert; long-range = more than 50 intervening versions OR target more than 365 days old; intermediate = remainder. Boundaries are heuristic. These classify span geometry, never vandalism intent. All durations over 365 days necessarily fall in long-range.
5. **Hours:** raw sum is version-hours. Merge overlapping half-open `[saved_at,revert_at)` intervals by article using running maximum end, then clip to calendar years for article-hours. Exact-version lifetime ends at `ended_at`. Both interval aggregates are retrospective proxies, not pageviews or inserted-text residence time.
6. **Temporary accounts:** compare equal six-month edit cohorts, anonymous denominators include all IP/temp edits; outcome is a recorded nonself undo within 604800 seconds. Eligibility ends seven days before the sample's maximum saved time. Month-level series begins January 2024. The sample maximum is an administrative observation endpoint, not a guarantee of completeness on every article. Observed-any-lag undo counts are also provided but have unequal follow-up.
7. **Local time:** Python's IANA `Europe/Helsinki` zone produces a small offset interval table; all duration/grouping analysis runs in plain SQL. Frozen offsets are in `sql/timezone.sql`; hours and weekdays attach to the original edit. Monday = 0.
8. **Clusters:** group all named/nonself known-hash restore-span associations by revert's UTC month; count distinct restoring rev IDs. SQL sequence expansion is bounded at 10,000; the audited maximum span is 1106. The source ingestion's 5,000 expansion cap does not truncate this dataset.
9. **Checks:** all 70,176 source undone rows join successfully; zero backward reverts, out-of-span versions or negative durations; three zero-second durations. NumPy independently matches all four SQL yearly quantiles across 24 years; independent Python interval merging also matches all yearly SQL article-hour totals. No independence assumption is needed for the descriptive SQL values.

## The exact SQL

Every executed analysis statement is saved verbatim under [sql/](sql/), in execution order below. `run.py` regenerates it and writes chart objects with `title`, `unit`, `source`, `rows`. Wall-clock times are local warm-cache observations, not benchmarks. Core metadata results use SQL; Python only orchestrates, constructs timezone intervals, checks quantiles, estimates uncertainty and formats the report.

| SQL file | Seconds | Result rows |
|---|---|---|
| [setup.sql](sql/setup.sql) | 0.8509 | 0 |
| [timezone.sql](sql/timezone.sql) | 0.0087 | 0 |
| [summary.sql](sql/summary.sql) | 0.2032 | 1 |
| [exposure-by-year.sql](sql/exposure-by-year.sql) | 0.4612 | 24 |
| [exposure-by-editor.sql](sql/exposure-by-editor.sql) | 0.5853 | 31 |
| [exposure-by-population.sql](sql/exposure-by-population.sql) | 0.557 | 6 |
| [exposure-year-population.sql](sql/exposure-year-population.sql) | 0.5113 | 137 |
| [integrity.sql](sql/integrity.sql) | 0.1304 | 1 |
| [exposure-union-by-year.sql](sql/exposure-union-by-year.sql) | 0.6591 | 24 |
| [temp-accounts.sql](sql/temp-accounts.sql) | 0.3519 | 68 |
| [temp-comparison.sql](sql/temp-comparison.sql) | 0.179 | 7 |
| [local-time-setup.sql](sql/local-time-setup.sql) | 0.3725 | 0 |
| [exposure-by-hour.sql](sql/exposure-by-hour.sql) | 0.0992 | 24 |
| [exposure-by-weekday.sql](sql/exposure-by-weekday.sql) | 0.0944 | 7 |
| [longest-lived.sql](sql/longest-lived.sql) | 0.0087 | 20 |
| [event-edges-setup.sql](sql/event-edges-setup.sql) | 8.3969 | 0 |
| [revert-clusters.sql](sql/revert-clusters.sql) | 0.1611 | 252 |
| [cluster-summary.sql](sql/cluster-summary.sql) | 0.0048 | 1 |
| [source-audit.sql](sql/source-audit.sql) | 0.1365 | 1 |
| [overall.sql](sql/overall.sql) | 0.5779 | 1 |
| [editor-summary.sql](sql/editor-summary.sql) | 0.5152 | 7 |
| [patrol-year.sql](sql/patrol-year.sql) | 0.1214 | 23 |
| [long-range-events.sql](sql/long-range-events.sql) | 0.5562 | 20 |
| [comparison-observations.sql](sql/comparison-observations.sql) | 0.028 | 3923 |
| [identity-sensitivity.sql](sql/identity-sensitivity.sql) | 0.5199 | 2 |
| [blank-restore-audit.sql](sql/blank-restore-audit.sql) | 0.1134 | 1 |
| [cluster-validity.sql](sql/cluster-validity.sql) | 0.0157 | 1 |
| [valid-exposure-by-year.sql](sql/valid-exposure-by-year.sql) | 0.4272 | 24 |
| [valid-exposure-by-editor.sql](sql/valid-exposure-by-editor.sql) | 0.5414 | 31 |

The independent read used for quantile checks is [quantile-crosscheck.sql](sql/quantile-crosscheck.sql). Its wall time is recorded in [validation.json](data/validation.json). Bootstrap inputs come from [comparison-observations.sql](sql/comparison-observations.sql); seed and repetition count are recorded in [uncertainty.json](data/uncertainty.json).

## What did not work

- Treating `saved_at → undone_by` as uninterrupted text exposure is not defensible: intervening versions and long-range blankings inflate the tail. Metadata cannot recover fragment-level lifetimes or intent.
- The supplied hash derivation includes NULL hashes. Clean and raw totals disagree substantially; reporting only the supplied aggregate would exaggerate exposure. This lab does not modify ingestion or repair the shared table.
- Counting revert clusters from `undone_by` misses later repeated reverts because it stores only the earliest remover. Full restore-span expansion fixes that for the cluster output.
- A causal “natural experiment” is not identified by this dataset. Calendar trends, article composition, changes in anonymous identity, and detection behavior remain confounders. A before/after median difference is not supported by the clustered interval; the undo-share association is supported descriptively.
- Self-reversion is identifier-based, not person-based. Neither anonymous nor nonself means vandalism. Comment interpretation is limited to the selected top twenty; comments are not used as outcome labels.
- The initial helper name `inspect.py` shadowed Python's standard library; it was renamed. Reading the lab DB with the source-only `wtt` user failed; scripts now use the provided local root credentials. Neither failure changed source data.

## What the product should do with it

Show an **“Identity-revert clock”**, labeled “time until recorded restore”, with sample size, period, and a known-hash default. Offer raw supplied labels as an explicit audit view. Keep self-corrections, short-local, intermediate and long-range restores selectable; do not call the local subset vandalism.

Show annual median/p75/p90/p99 and threshold shares, with a visible partial-2026 marker. Offer version-hours and union article-hours as separately explained metrics. Always display the restored target date, intervening edit count, original version lifetime and known-hash status on extreme cases; repeated blanking deserves its own annotation.

Show the temporary-account transition as an observational comparison with fixed follow-up and sample sizes: undo share rose, total anonymous activity declined alongside named activity, and exposure-time change is inconclusive. Avoid claiming that temporary accounts caused any of these outcomes.

Use local-time charts as exploration with counts, not a ranking of vandalism risk. Show named-user **revert clusters** as article-month event counts; pair tables contain directed counts only. Link revision IDs so readers can investigate context. Do not turn usernames into misconduct scores.
