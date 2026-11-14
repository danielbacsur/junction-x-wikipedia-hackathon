# Bitemporal offices

## The question

History has two timelines: when something was true, and when Wikipedia said
so. MariaDB has both built in: application-time periods (`PERIOD FOR`,
`WITHOUT OVERLAPS`, `FOR PORTION OF`) and system versioning (`FOR SYSTEM_TIME
AS OF`). Can one table built from the real edit history answer "who was
president of Finland on 1 May 1960, according to Wikipedia as it stood at the
end of 2006?" and "when did Wikipedia change its mind about a term of office?"

Yes. The table is 102 rows and every showcase query runs in under 3 ms.

## What we found

Numbers first. Every one comes from `data/summary.json` (written by
`load.py`) or `RESULTS.md` (written by `report.py`). Timings are from the last
run and move by about a millisecond between runs on the loaded laptop.

| Measure | Value |
|---|---|
| Articles read (the 13 presidents) | 13 |
| Saved versions read | 17,845 (838 MB of wikitext, 31.6 s) |
| Versions skipped as reverted within 30 days | 4,087 (22.9%) |
| Versions accepted | 13,758 |
| Accepted versions with an office infobox | 12,505 |
| Of those, every loaded office field parsed | 12,395 (99.1%) |
| Stated terms read (version x term) | 25,715 |
| Stated terms refused by the parser | 111 (0.43%) |
| **Claim lifetime rows in `office_term`** | **102**, of which 35 are stated today |
| Rows without the revert filter | 586 |
| Direct changes of a stated start or end date | 45 |
| Slowest showcase SELECT (median of 7 runs) | 2.4 ms |

25,715 version-level statements collapse into 102 rows: one row per lifetime
of a claim, not one per version. 252 to 1.

**1. The showcase question has an answer and a citation.** Wikipedia at the
end of 2006 said Urho Kekkonen, term 1 March 1956 to 27 January 1982, and the
statement had stood since revision 752136 of 30 January 2006.

**2. The same question gets a different answer depending on which Wikipedia
you ask.** Who was president on 1 March 1925?

| Wikipedia as of | Answer | Stated term |
|---|---|---|
| end of 2006 | Lauri Kristian Relander | 1925-03-01 to 1931-03-01 |
| end of 2008 | K. J. Ståhlberg | 1919-07-26 to 1925-03-02 |
| end of 2012 | Lauri Kristian Relander | 1925-03-01 to 1931-03-01 |
| now | K. J. Ståhlberg | 1919-07-25 to 1925-03-02 |

Two editors moved the handover day between 1 and 2 March three times, each in
one sitting across the Ståhlberg, Relander and Svinhufvud articles: KLS on
8 August 2007 (to 2 March, no summary), Pxos on 14 March 2012 (back to
1 March, "toimikauden alkaminen ja päättyminen + lähde"), KLS on 5 November
2013 (to 2 March again, "kyllä tämä pitää paikkansa": "yes, this is correct").
The 2012 value stood 601 days.

**3. Wikipedia changed a stated term date 45 times.** 33 of them on the
presidency. 25 moved to the value stated today, 4 moved away from it, 16 moved
between two values Wikipedia no longer states. 5 are a sitting holder's term
being closed. 13 were made by IP editors and 24 had no edit summary. The full
list with editor, rev id and comment is `data/term-changes.json`.

**4. None of the 45 is vandalism.** The vandal values exist in the history
("78.3.1856 – 1.3.2012", "4.8.1337 – 11.3.1946", "Suomen tasavallan 400.
presidentti") but all of them sat in versions the revert filter skipped.
Without the filter the table has 586 rows instead of 102. What got past the
filter and still stood for less than a day is 19 rows, 16 of them by named
editors, and they are typos and half-finished edits: the editor who created
the infobox term
fields on 29 January 2006 entered seven dates that were replaced within a
day, six of them by the same editor;
Kyösti Kallio's infobox carried Relander's term (1925 to 1931) for 210
seconds until the next editor asked "mitähän nuo ajat oikein olivat?" ("what
on earth were those dates?").

**5. The longest-lived wrong-by-today's-standard value stood 55 days.** On
21 October 2007 an IP editor ended Kekkonen's term on 26 October 1981 (about
when he resigned, not the handover). 52 accepted versions repeated it before
another IP restored 27 January 1982 on 15 December.

**6. Since 9 August 2011 Wikipedia's own articles leave Finland without a
president for 10 days.** Ryti's article ends his term on 1 August 1944 and
Mannerheim's starts on 4 August (3 days). Mannerheim's ends on 4 March 1946
and Paasikivi's starts on 11 March (7 days). One editor made both changes in
one evening, citing a 1965 book. At the end of 2010 all the articles met
exactly.
Asked "who was president on 2 August 1944?", Wikipedia answered Risto Ryti at
every year end through 2010 and nobody at every year end since. The lab does
not judge which is right; it shows that the answer changed and who changed it.

**7. Two presidents at once happened 10 times and never lasted.** The longest
was 4 days in 2006 (a typo started Ryti's term on 19 February 1940, 304 days
inside Kallio's). The others lasted 35 seconds to 17 minutes: an editor
changing one article and then the next. At no year end do two stated terms
overlap.

**8. The plain `undone_by` flag would have thrown away half the history.** It
marks 8,399 of 17,845 versions (47.1%), and 2,970 of Tarja Halonen's 3,078
(96.5%). A blanked page has the same sha1 as the previous blanking, so the
blanking "restores" a version years older and every version in between counts
as undone. The filter used here skips 4,087.

## How it was measured

Three steps, all on one connection.

```sh
cd labs/bitemporal-offices
uv run extract.py   # 32 s. Reads 17,845 versions, keeps the office infobox, writes cache/infobox.json
uv run load.py      # under 1 s. Parses, collapses, loads lab_bitemporal_offices, writes data/summary.json
uv run report.py    # under 1 s. Runs sql/*.sql, writes RESULTS.md and the other data/*.json
```

`uv run overlap_semantics.py` reproduces the key behaviour described under
"What did not work". `uv run q.py "SELECT ..." lab_bitemporal_offices` runs
any statement. `uv run --no-project python inspect_boxes.py` prints what the
parser makes of each of the 929 distinct infoboxes.

**Source.** `wtt.revision FOR SYSTEM_TIME ALL` for the 13 articles, joined to
`wtt.edit` by rev id. The facts are in the infobox: `{{Hallitsija}}` in 2006
and `{{Valtionjohto}}` from 2007, both pairing `arvo` / `arvoN` (the office)
with `virassa` / `virassaN` (the term). The extractor takes the first
top-level template that has a `virassa` field, whatever its name.

**Parser** (`parse.py`, regex only). The term was written four ways:

```
[[1. maaliskuuta|1.3.]] [[1956]]–[[27. tammikuuta|27.1.]] [[1982]]    2006 to about 2014
[[4. elokuuta]] [[1944]] – [[11. maaliskuuta]] [[1946]]               plain date links, Finnish month names
1.3.1956 – 27.1.1982                                                  today
1.3.2012 –   /   1.3.2000 alkaen                                      still in office
```

For a piped link the label is read, because that is what the reader saw. The
words in front of a range may name it: "vt." makes it an acting term, stored
as office `... (vt.)`; "valtionhoitajana" makes it a regency. "27.5. –
12.12.1918" borrows the end's year for the start. Anything else is refused
and stored in `office_unparsed` with the reason:

| Reason | Version x field |
|---|---|
| years only, no day ("1919–1925", the first 13 days of the infobox in January 2006) | 72 |
| end date not understood ("6.5.1979–26. 26.1.1982", "1.3.1994 –1. tuokokuuta 2000") | 23 |
| end not after start ("17.5.-26.3. 1946") | 13 |
| no date range found | 2 |
| term field empty | 1 |

Three offices are loaded: president, prime minister, regent. The other 175
distinct office titles in these infoboxes (speaker, ministers) are counted
and not loaded.

**Which versions count as "Wikipedia said"** (`skipped_window` in `load.py`).
A version is skipped when a revert removed it within 30 days of its saving and
that revert itself stood. Reverts are walked from newest to oldest using
`edit.restores`; a revert that was itself skipped removes nothing. A value
that stood longer than 30 days was what Wikipedia said, even if it was later
reverted. The window barely matters: 1 day gives 103 rows, 30 days 102, 365
days 102.

**Collapsing.** For each article the accepted versions are walked in order.
A claim is `(office, valid_from, valid_to)`. A row opens at the version where
the claim first appears and closes at the first accepted version that no
longer makes it. Reformatting the field without changing the dates does not
close the row.

## The schema

```sql
CREATE TABLE office_term (
  page_id     INT UNSIGNED NOT NULL,   -- the article that makes the statement
  person      VARCHAR(255) NOT NULL,   -- its title
  office      VARCHAR(64)  NOT NULL,
  valid_from  DATE NOT NULL,           -- stated first day in office
  valid_to    DATE NOT NULL,           -- stated last day, exclusive
  open_ended  BOOLEAN NOT NULL,        -- still in office: valid_to is 9999-12-31
  rev_id      INT UNSIGNED NOT NULL,   -- the version that first made this statement
  seq         INT UNSIGNED NOT NULL,
  editor      VARCHAR(255),
  editor_kind VARCHAR(8) NOT NULL,
  comment     VARCHAR(1000),           -- that version's edit summary
  versions    INT UNSIGNED NOT NULL,   -- accepted versions that repeated the statement
  source_text VARCHAR(600) NOT NULL,   -- the raw infobox field
  row_start   TIMESTAMP(6) GENERATED ALWAYS AS ROW START,
  row_end     TIMESTAMP(6) GENERATED ALWAYS AS ROW END,
  PERIOD FOR SYSTEM_TIME (row_start, row_end),
  PERIOD FOR valid_time (valid_from, valid_to),
  PRIMARY KEY (page_id, office, valid_time WITHOUT OVERLAPS),
  KEY office_valid (office, valid_from, valid_to)
) WITH SYSTEM VERSIONING;
```

- **System time is when Wikipedia said it.** Loaded with `SET
  system_versioning_insert_history = 1`. A claim no longer made is inserted
  with both `row_start` and `row_end`. A claim still made is inserted with
  `row_start` only, so MariaDB marks it current itself.
- **Valid time is half-open**, as MariaDB periods are. The infobox writes
  "1.3.1956–27.1.1982" and the successor's starts "27.1.1982". Stored as
  written, the two rows meet without overlapping and the handover day belongs
  to the successor.
- **The key is the article, the office and the stated period.** One article
  may state several terms of one office (Kekkonen's five governments) but
  never two that overlap. The real data passes: all 102 rows load under
  `WITHOUT OVERLAPS`, none refused (`data/overlap-trials.json`).
- **The key stops at the article on purpose.** Two articles may disagree, and
  that disagreement is the finding. A key across articles would refuse real
  history (see below).
- `person` is the article title. A claim is attributed to the article that
  makes it, not to a canonical person.

`office_unparsed` holds the 17 lifetimes of fields the parser refused, with
the same system time.

## The SQL

All statements are files in `sql/`. Full output is in `RESULTS.md`.

**(a) Both times in one statement** (`a-who-held-office.sql`, 0.7 ms):

```sql
SELECT person, valid_from, valid_to, rev_id, row_start AS said_since
FROM office_term FOR SYSTEM_TIME AS OF TIMESTAMP '2006-12-31 23:59:59'
WHERE office = 'Suomen tasavallan presidentti'
  AND valid_from <= DATE '1960-05-01' AND valid_to > DATE '1960-05-01';
```

| person | valid_from | valid_to | rev_id | said_since |
|---|---|---|---|---|
| Urho Kekkonen | 1956-03-01 | 1982-01-27 | 752136 | 2006-01-30 15:01:04 |

`a2-answer-that-flips.sql` (0.9 ms) is the 1 March 1925 table above.
`a3-nobody.sql` (0.8 ms) asks one day of 21 year ends at once by joining a
sequence to `FOR SYSTEM_TIME ALL` on `row_start <= t AND row_end > t`.

**(b) The list as of four dates** (`b-list-as-of.sql`, 2.4 ms). Valid time,
end exclusive, empty end while in office:

| person | as of 2006 | as of 2012 | as of 2020 | now |
|---|---|---|---|---|
| K. J. Ståhlberg | 1919-07-26 .. 1925-03-01 | 1919-07-25 .. 1925-03-01 | 1919-07-25 .. 1925-03-02 | 1919-07-25 .. 1925-03-02 |
| Lauri Kristian Relander | 1925-03-01 .. 1931-03-01 | 1925-03-01 .. 1931-03-01 | 1925-03-02 .. 1931-03-02 | 1925-03-02 .. 1931-03-02 |
| P. E. Svinhufvud | 1931-03-01 .. 1937-03-01 | 1931-03-01 .. 1937-03-01 | 1931-03-02 .. 1937-03-01 | 1931-03-02 .. 1937-03-01 |
| Kyösti Kallio | 1937-03-01 .. 1940-12-19 | 1937-03-01 .. 1940-12-19 | 1937-03-01 .. 1940-12-19 | 1937-03-01 .. 1940-12-19 |
| Risto Ryti | 1940-12-19 .. 1944-08-04 | 1940-12-19 .. 1944-08-01 | 1940-12-19 .. 1944-08-01 | 1940-12-19 .. 1944-08-01 |
| Carl Gustaf Emil Mannerheim | 1944-08-04 .. 1946-03-11 | 1944-08-04 .. 1946-03-04 | 1944-08-04 .. 1946-03-04 | 1944-08-04 .. 1946-03-04 |
| Juho Kusti Paasikivi | 1946-03-11 .. 1956-03-01 | 1946-03-11 .. 1956-03-01 | 1946-03-11 .. 1956-03-01 | 1946-03-11 .. 1956-03-01 |
| Urho Kekkonen | 1956-03-01 .. 1982-01-27 | 1956-03-01 .. 1982-01-27 | 1956-03-01 .. 1982-01-27 | 1956-03-01 .. 1982-01-27 |
| Mauno Koivisto | 1982-01-27 .. 1994-03-01 | 1982-01-27 .. 1994-03-01 | 1982-01-27 .. 1994-03-01 | 1982-01-27 .. 1994-03-01 |
| Martti Ahtisaari | 1994-03-01 .. 2000-03-01 | 1994-03-01 .. 2000-03-01 | 1994-03-01 .. 2000-03-01 | 1994-03-01 .. 2000-03-01 |
| Tarja Halonen | 2000-03-01 .. | 2000-03-01 .. 2012-03-01 | 2000-03-01 .. 2012-03-01 | 2000-03-01 .. 2012-03-01 |
| Sauli Niinistö | | 2012-03-01 .. | 2012-03-01 .. | 2012-03-01 .. 2024-03-01 |
| Alexander Stubb | | | | 2024-03-01 .. |

Between 2006 and 2012 four presidents' dates changed (Ståhlberg, Ryti,
Mannerheim, and Halonen's term closed). Between 2012 and 2020 three
(Ståhlberg, Relander, Svinhufvud: the 1 or 2 March dispute). Since 2020 only
Niinistö's term closed and Stubb arrived. Five have the same stated term at
all four dates: Kallio, Paasikivi, Kekkonen, Koivisto and Ahtisaari.

**(c) Every change of a stated date** (`c-term-changes.sql`, 2.3 ms). A
statement's system period ends at the instant another statement about an
overlapping period in the same article begins:

```sql
SELECT b.row_start AS changed_at, a.person, a.office,
       a.valid_from AS from_before, IF(a.open_ended, NULL, a.valid_to) AS to_before,
       b.valid_from AS from_after,  IF(b.open_ended, NULL, b.valid_to) AS to_after,
       b.editor, b.rev_id, b.comment
FROM office_term FOR SYSTEM_TIME ALL a
JOIN office_term FOR SYSTEM_TIME ALL b
  ON b.page_id = a.page_id AND b.office = a.office
 AND b.row_start = a.row_end                                    -- system time: one replaces the other
 AND a.valid_from < b.valid_to AND b.valid_from < a.valid_to    -- valid time: about the same days
ORDER BY changed_at;
```

The file adds three columns: whether the new value is the one stated today,
how long it stood, and whether the old value was put straight back. A sample
of the 45 rows:

| changed_at | person | before | after | verdict | stood (days) | editor | comment |
|---|---|---|---|---|---|---|---|
| 2006-01-30 | K. J. Ståhlberg | starts 1919-03-01 | starts 1919-07-26 | superseded later | 555 | 85.157.87.76 | Ståhlberg aloitti presidentin toimessa 26.7. eikä 1.3.1919 |
| 2007-10-21 | Urho Kekkonen | ends 1982-01-27 | ends 1981-10-26 | away from today's value | 55 | 85.156.239.247 | |
| 2011-08-09 | Risto Ryti | ends 1944-08-04 | ends 1944-08-01 | to today's value | 1363, then put back for 10 min | Pxos | Rytin ero 1.8.1944 |
| 2011-08-09 | C. G. E. Mannerheim | ends 1946-03-11 | ends 1946-03-04 | to today's value | still stated | Pxos | Tarkennukset virkakausien päivämääriin (Lähde: ... WSOY 1965) |
| 2012-03-14 | K. J. Ståhlberg | 1919-07-26 .. 1925-03-02 | 1919-07-25 .. 1925-03-01 | superseded later | 601 | Pxos | Lain mukaan 1. presidentti astui toimeen heti kun hänet oli valittu (25.7.) ... |
| 2013-11-05 | K. J. Ståhlberg | ends 1925-03-01 | ends 1925-03-02 | to today's value | still stated | KLS | kyllä tämä pitää paikkansa. |
| 2015-05-28 | Alexander Stubb (PM) | ends 2015-05-28 | ends 2015-05-29 | to today's value | still stated | Kaldur | huomenna vasta eroaa |
| 2018-01-24 | Mauno Koivisto (acting) | starts 1981-10-27 | starts 1981-09-11 | to today's value | still stated | Skjölker | Kekkonen jäi sairaslomalle 11.9.1981, jolloin Koivistosta tuli hänen sijaisensa. |

**Corrections or vandalism?** `c2-change-summary.sql` gives the counts in
finding 3. Read as a list, the 45 are corrections, disputes and updates. Three
got past the revert filter and were then put straight back: the Kekkonen
resignation date (55 days, outside the 30-day window by design), an IP
editor's argued change of Ryti's end date in 2015 (10 minutes; the undo
restored only one of two edits so no sha1 matched), and an IP editor splitting
Niinistö's term in two in 2018 (8 hours). None is vandalism in content.
`c3-short-lived.sql` lists the 19 statements that stood under a day.

**(d) Gaps and overlaps as of each year end** (`d-gaps-and-overlaps.sql`,
1.7 ms): `LAG(valid_to)` over the stated terms of each year-end snapshot.

| kind | outgoing | stated end | incoming | stated start | days | year ends |
|---|---|---|---|---|---|---|
| gap: nobody | P. E. Svinhufvud | 1937-03-01 | Kyösti Kallio | 1937-03-02 | 1 | 2008 to 2009 |
| gap: nobody | Risto Ryti | 1944-08-01 | C. G. E. Mannerheim | 1944-08-04 | 3 | 2011 to 2026 |
| gap: nobody | C. G. E. Mannerheim | 1946-03-04 | Juho Kusti Paasikivi | 1946-03-11 | 7 | 2011 to 2026 |

`d3-two-at-once.sql` (1.9 ms) is the bitemporal join: two articles, valid
periods intersect, system periods intersect. It returns the 10 transient
overlaps of finding 7 with the second they began and how long both were live.

**(e) `FOR PORTION OF` does something useful** (`e-for-portion-of.sql`). A
derived table `president_timeline` holds one clean line of holders with
`PRIMARY KEY (office, valid_time WITHOUT OVERLAPS)`: one holder per day across
all articles. Koivisto's article states an acting presidency inside
Kekkonen's term. Inserting it is refused:

```
ERROR 1062: Duplicate entry 'Suomen tasavallan presidentti-1982-01-27-1981-09-11' for key 'PRIMARY'
```

One statement carves those days out instead (0.5 ms):

```sql
SELECT valid_from, valid_to INTO @acting_from, @acting_to
FROM office_term WHERE office = 'Suomen tasavallan presidentti (vt.)';

UPDATE president_timeline FOR PORTION OF valid_time FROM @acting_from TO @acting_to
   SET status = 'in office, on sick leave: Koivisto acting'
 WHERE office = 'Suomen tasavallan presidentti';
```

| holder | status | valid_from | valid_to |
|---|---|---|---|
| Urho Kekkonen | in office | 1956-03-01 | 1981-09-11 |
| Urho Kekkonen | in office, on sick leave: Koivisto acting | 1981-09-11 | 1982-01-27 |
| Mauno Koivisto | in office | 1982-01-27 | 1994-03-01 |

MariaDB split Kekkonen's row in two, and because the table is also
system-versioned the undivided row is still there as history
(`e2-portion-history.sql`). This is an honest fit for a curated timeline. It
does not fit `office_term` itself: that table records what was stated, and a
statement is replaced whole, never trimmed.

**(3) What the agent calls** (`f-office-holder-function.sql`):

```sql
CREATE OR REPLACE FUNCTION office_holder(p_office VARCHAR(64), p_day DATE, p_as_of DATETIME(6))
RETURNS LONGTEXT CHARSET utf8mb4
READS SQL DATA
RETURN (
  SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
           'holder', person, 'office', office, 'acting', office LIKE '% (vt.)',
           'stated_from', valid_from, 'stated_to', IF(open_ended, NULL, valid_to),
           'rev_id', rev_id, 'said_since', row_start,
           'said_until', IF(row_end > NOW(6), NULL, row_end),
           'source_text', source_text) ORDER BY office, valid_from), JSON_ARRAY())
  FROM office_term FOR SYSTEM_TIME AS OF p_as_of
  WHERE office IN (p_office, CONCAT(p_office, ' (vt.)'))
    AND valid_from <= p_day AND valid_to > p_day);
```

`FOR SYSTEM_TIME AS OF` accepts the routine parameter. The `wtt` user has
`SELECT` and `EXECUTE` on the lab database. Four calls in 1.4 ms
(`f2-office-holder-calls.sql`):

```sql
SELECT lab_bitemporal_offices.office_holder('Suomen tasavallan presidentti', '1960-05-01', '2006-12-31 23:59:59');
-- [{"holder": "Urho Kekkonen", "acting": false, "stated_from": "1956-03-01", "stated_to": "1982-01-27",
--   "rev_id": 752136, "said_since": "2006-01-30 15:01:04.000000", "said_until": "2007-01-19 19:02:59.000000", ...}]
SELECT lab_bitemporal_offices.office_holder('Suomen tasavallan presidentti', '1981-12-01', NOW(6));
-- two elements: Urho Kekkonen, and Mauno Koivisto with "acting": true, stated from 1981-09-11
SELECT lab_bitemporal_offices.office_holder('Suomen tasavallan presidentti', '1944-08-02', NOW(6));
-- []   Wikipedia names nobody for that day
```

An empty array means nobody was named. Two non-acting elements mean two
articles disagreed at that moment.

## What did not work

- **`edit.undone_by IS NOT NULL` as the vandalism filter.** See finding 8. It
  needs the walk over `restores` described above.
- **`WITHOUT OVERLAPS` does not know about system time.** MariaDB puts
  `row_end` inside the key: `SHOW CREATE TABLE` reports `PRIMARY KEY
  (page_id, office, row_end, valid_time WITHOUT OVERLAPS)` (`sql/schema.sql`).
  So only rows with the same `row_end` are compared, which in practice means
  the current rows. `overlap_semantics.py` shows it: two history rows that
  overlap in both valid time and system time are accepted; two current rows
  that overlap are refused; rows that touch on the handover day are accepted.
  The key protects today's statements and does not make history consistent.
- **One holder per day cannot be a constraint on the bitemporal table.**
  Inserting the presidents' stated terms as of one moment into `UNIQUE
  (office, valid_time WITHOUT OVERLAPS)` passes at all 21 year ends and is
  refused at 10 moments in between (`data/one-holder-trial.json`). Those 10
  are real history that the table must keep.
- **Period columns cannot be NULL.** "Still in office" is stored as
  9999-12-31 with an `open_ended` flag, and every output has to hide it.
- **Valid time has no `AS OF`.** `FOR SYSTEM_TIME AS OF` exists; the valid
  side of query (a) is two plain comparisons. `FOR PORTION OF` exists only on
  `UPDATE` and `DELETE`.
- **`FOR SYSTEM_TIME AS OF` takes one moment.** To ask many moments at once
  (b, d) the query joins `FOR SYSTEM_TIME ALL` on `row_start` and `row_end`.
- **A current row must not be given a `row_end`.** The first loader wrote
  2038-01-19 03:14:07.999999 for current rows. On 12.3 the real maximum is
  2106-02-07 06:28:15.999999, so those rows were history and a plain `SELECT`
  returned nothing.
- **The change query is a lower bound.** It pairs statements that replace one
  another in the same edit and overlap in valid time. It misses a term that
  vanished for a while and came back different (Ahtisaari's field was
  unreadable for 45 days in 2008) and a replacement about entirely different
  days (Kallio carrying Relander's term).
- **Coverage is the infobox, from 16 January 2006.** None of the 13 articles
  states one of the loaded offices in an infobox before that day, and for the
  first 13 days nine of the terms were years only. 1,253 accepted versions have no office infobox. The prose and the
  list articles ("Suomen tasavallan presidentti", "Luettelo Suomen
  pääministereistä") were not parsed, so a second source that could disagree
  with the infoboxes is missing.
- **The prime minister rows are partial.** They come from the seven
  presidents who were also prime minister, not from all prime ministers.

## What the product should do with it

1. **Give the agent `office_holder(office, day, as_of)`.** It answers the
   question MariaDB's own RAG demo fails on, "who was president from 1956 to
   1982", with a row instead of a vector, and it returns the rev id that said
   it, which the existing `read_article` tool can open.
2. **Show the "changed its mind" list on a person's page.** 45 rows with
   before, after, editor and edit summary, from `data/term-changes.json`. The
   1 or 2 March dispute and the 10 days without a president are the stories.
3. **Draw the terms as bars per as-of date** from `data/terms-by-asof.json`
   and `data/terms-now.json`, with the gaps of `data/gaps-by-asof.json`
   marked.
4. **Use the 30-day standing-revert rule** wherever the product says
   "Wikipedia said", not `undone_by` alone.
5. **Extend the loader to every article with `{{Valtionjohto}}`** if there is
   time: the parser is not specific to presidents, and reading costs about
   1.8 ms per version.

## Files

| File | What |
|---|---|
| `extract.py`, `wikitext.py` | read the versions, keep the office infobox |
| `parse.py` | the deterministic parser |
| `load.py` | revert filter, collapsing, schema, load, key trial |
| `report.py` | runs `sql/*.sql`, writes `RESULTS.md` and `data/*.json` |
| `overlap_semantics.py` | what `WITHOUT OVERLAPS` checks on a versioned table |
| `inspect_boxes.py`, `q.py` | exploration helpers |
| `sql/` | the showcase statements and `schema.sql` as MariaDB reports it |
| `data/terms-now.json` | 35 terms stated today |
| `data/terms-by-asof.json` | the presidents' terms as of 2006, 2012, 2020, now |
| `data/term-changes.json` | the 45 changes |
| `data/gaps-by-asof.json`, `data/two-at-once.json` | gaps per year end, transient overlaps |
| `data/summary.json` | coverage: read, skipped, parsed, loaded, per article |
| `data/overlap-trials.json`, `data/one-holder-trial.json`, `data/query-timings.json` | key trials and timings |
