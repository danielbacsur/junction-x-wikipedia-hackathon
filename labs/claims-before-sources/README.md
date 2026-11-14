# Claims before sources

## The question

Can paragraph histories find claims that stood in Finnish Wikipedia before the publication of their first attached source? This lab measures sourcing chronology in the supplied 19,742-article history-of-Finland collection, ending 1 October 2026. It produces an editor review queue, never an allegation of citogenesis.

## What we found

- **99,415 / 133,201 (74.64%)** current prose paragraphs of at least 80 characters contain an inline `<ref>` marker. Among these, **77,539** were born with one and **21,876** gained one later.
- **976.75 days** is the median elapsed wait among paragraphs that gained a reference; quartiles **231.01–3,027.30 days**. Including born-referenced paragraphs, all three quartiles are zero. These are observed waits among currently referenced survivors, not an estimate for all paragraphs ever written.
- **33,786** paragraphs currently have no inline reference. **30,952 / 26,860 / 19,963** have slot origins at least 5 / 10 / 15 years old. Of these, **29,551 / 25,631 / 19,021** have never had a detected inline reference. **1,507** current unreferenced paragraphs had one earlier.
- **48,458 / 195,053 (24.84%)** current reference occurrences have an explicitly parseable publication-year field. **72,606 (37.22%)** are unresolved named uses outside their paragraph. **29,893** current paragraphs contain at least one parsed date. Coverage is deliberately incomplete.
- Among parsed current references, publication year minus paragraph-origin year has **median −5 years**, quartiles **−28 to 0**. **5,455 (11.26%)** have positive gaps, **9,387** zero, **33,616** negative. These are all current references, not necessarily first references. Five parsed occurrences have future years beyond the snapshot; raw coverage retains these as data-quality failures, while candidate screening rejects years after attachment.
- **191** paragraphs pass the stricter first-reference screen; the [top 50](data/candidates.json) are ranked by observed elapsed wait. The longest is **7,225.48 days (19.78 years)**: Herman Klaunpoika Fleming, a 2006 paragraph cited to a 2025 magazine article in 2026.
- **6 later-source / 8 updated-claim / 1 human-look / 0 parser-error** is the top-15 audit mix. The later-source judgments are provisional, not certifications of historical truth or independence. **Zero cases establish circular sourcing.** One university page's alleged publication year remains unverified.
- **50/50 (100%)** sampled years faithfully match the explicit wikitext publication-date field (Wilson 95% interval **92.87–100%**). One is an impossible future year and one dates an archival act rather than demonstrably dating its online publication. This is field-extraction precision; actual source-publication precision and parser recall were not estimated.
- Among all newly observed prose slots, including those later removed, the born-with-inline-reference share is **0/2,560 in 2004**, **459/10,882 (4.22%) in 2006**, and **4,036/4,537 (88.96%) in partial 2026**. This measures the adoption of this inline syntax and paragraph composition, not the absence of bibliographies in early Wikipedia.

### Annual sourcing cohorts

Denominator: first observed slot wording is prose and has at least 80 characters. A slot is an inferred paragraph lineage, not a semantic claim. 2026 is partial; 2003 is included for reconciliation. The current-survivor alternative is in [surviving-sourcing-by-year.json](data/surviving-sourcing-by-year.json).

| Year | New prose slots | Born with inline reference | Share % |
|---|---:|---:|---:|
| 2003 | 159 | 0 | 0.00 |
| 2004 | 2,560 | 0 | 0.00 |
| 2005 | 8,014 | 0 | 0.00 |
| 2006 | 10,882 | 459 | 4.22 |
| 2007 | 18,778 | 2,573 | 13.70 |
| 2008 | 13,116 | 2,807 | 21.40 |
| 2009 | 12,673 | 4,390 | 34.64 |
| 2010 | 7,466 | 3,642 | 48.78 |
| 2011 | 7,269 | 3,513 | 48.33 |
| 2012 | 7,147 | 3,827 | 53.55 |
| 2013 | 7,687 | 4,578 | 59.56 |
| 2014 | 7,487 | 4,780 | 63.84 |
| 2015 | 7,842 | 5,086 | 64.86 |
| 2016 | 7,213 | 5,518 | 76.50 |
| 2017 | 6,880 | 5,128 | 74.53 |
| 2018 | 9,165 | 4,952 | 54.03 |
| 2019 | 5,806 | 4,123 | 71.01 |
| 2020 | 7,382 | 5,685 | 77.01 |
| 2021 | 6,342 | 5,098 | 80.38 |
| 2022 | 6,954 | 4,949 | 71.17 |
| 2023 | 5,432 | 4,450 | 81.92 |
| 2024 | 5,801 | 4,888 | 84.26 |
| 2025 | 5,275 | 4,230 | 80.19 |
| 2026 | 4,537 | 4,036 | 88.96 |

### Oldest currently unreferenced paragraphs

These are current excerpts and first observed slot dates, not a guarantee of uninterrupted residence or that the exact current wording is that old. Oldid links open the originating edit; the editor attribution is in the JSON. No inline reference does not imply no article-level source.

| Article | Slot first written (UTC) | Originating version | Current excerpt |
|---|---|---|---|
| Erik Edner | 2003-02-27 14:20:34 | [167](https://fi.wikipedia.org/?oldid=167) | Ednerin vanhemmat olivat Turun kaupungin kassanhoitaja, raatimies Erik Edner ja hänen ensimmäinen puolisonsa Anna Maria Detlofson (Detloff). Hänen kasvatusisänään toimi haminalaine… |
| Erik Edner | 2003-02-27 14:20:34 | [167](https://fi.wikipedia.org/?oldid=167) | Erik Edner toimi Lempäälässä ensin vt. kirkkoherrana 1748 ja armovuodensaarnaajana 1749 sekä sitten seurakunnan kirkkoherrana vuodesta 1750 lähtien. Hän oli tarmokas kirkkoherra, j… |
| Erik Edner | 2003-02-27 14:20:34 | [167](https://fi.wikipedia.org/?oldid=167) | Edner kuoli vuonna 1779. Lempäälässä myönnetään vuosittain Erik Edner -mitali huomattavaa kotiseudun kehittämistä tehneelle lempääläiselle.… |
| Kalevala | 2003-03-27 14:03:37 | [600](https://fi.wikipedia.org/?oldid=600) | Kalevala on Suomen kansalliseepos, Elias Lönnrotin kokoama ja toimittama runoelma, joka perustuu hänen vuodesta 1828 alkaen kokoamiinsa suomalais-karjalaisiin kansanrunoihin. Varsi… |
| Mauno Koivisto | 2003-03-29 20:47:58 | [937](https://fi.wikipedia.org/?oldid=937) | Koiviston toinen merkkisaavutus oli tasavallan presidentin aseman parlamentarisoiminen. Koiviston presidenttikaudella presidentin toimikaudet rajattiin kahteen kauteen. Tämä päätös… |
| Suomen tasavallan presidentti | 2003-05-13 09:11:18 | [1304](https://fi.wikipedia.org/?oldid=1304) | Ennen vuotta 1994 tasavallan presidentti valittiin valitsijamiesvaalilla. Äänestäjät valitsivat 300 valitsijamiestä suhteellisella vaalitavalla, minkä jälkeen valitsijamiehet valit… |
| Luettelo Suomen entisistä kunnista | 2003-05-22 10:20:55 | [835](https://fi.wikipedia.org/?oldid=835) | Tämä on aakkosellinen luettelo kuntaliitosten yhteydessä tai muuten hävinneistä Suomen kunnista ja kaupungeista. Kunnan nimen jälkeen on kaupunki tai muu kunta, johon se liitettiin… |
| Palosaari (Vaasa) | 2003-05-29 12:39:06 | [60723](https://fi.wikipedia.org/?oldid=60723) | Palosaarella sijaitsevat korkeakouluista Vaasan yliopisto, Yrkeshögskolan Novia ja Vaasan ammattikorkeakoulu. Palosaarella sijaitsee myös Vaasan yrityskeskus, valtion virastotalo, … |
| Mauno Koivisto | 2003-06-11 08:08:14 | [8269](https://fi.wikipedia.org/?oldid=8269) | Ulkopolitiikan saralla tapahtui tälläkin kaudella suuria muutoksia. Neuvostoliiton hajoamisprosessin aikana irtisanottiin YYA-sopimus sekä Pariisin rauhansopimuksen aserajoitukset.… |
| Ulla-Maj Wideroos | 2003-06-17 17:07:45 | [39539](https://fi.wikipedia.org/?oldid=39539) | Cecilia Ulla-Maj Wideroos (o.s. Staffans, s. 22. lokakuuta 1951 Pietarsaari) on suomalainen poliitikko, RKP:n entinen kansanedustaja (1995–2015) ja ruotsalaisen eduskuntaryhmän puh… |
| Oulunkylä | 2003-06-19 09:31:28 | [1086](https://fi.wikipedia.org/?oldid=1086) | Oulunkylä () on kaupunginosa Pohjois-Helsingissä. Oulunkylä sijaitsee Helsingin kantakaupungin rajalla pääradan varressa noin kuusi kilometriä keskustasta pohjoiseen.… |
| Pääkaupunkiseudun yhteistyövaltuuskunta | 2003-06-19 17:41:19 | [1718](https://fi.wikipedia.org/?oldid=1718) | YTV (, ) oli vuosina 1970–2009 Suomen pääkaupunkiseudun lakisääteinen yhteistyöelin. YTV-alueeseen kuuluivat pääkaupunkiseudun kaupungit Helsinki, Vantaa, Espoo ja Kauniainen.… |
| Pääkaupunkiseudun yhteistyövaltuuskunta | 2003-06-19 17:41:19 | [1718](https://fi.wikipedia.org/?oldid=1718) | YTV:n asioista päättivät seutukokous ja hallitus. Toimintaorganisaation johdossa oli yhteistyöjohtaja. Seutukokouksessa 23. tammikuuta 2009 valittiin tammikuussa 2008 Helsingin kau… |
| Sm2 | 2003-06-19 20:04:45 | [23674](https://fi.wikipedia.org/?oldid=23674) | Ulospäin näkyvin ero Sm1- ja Sm2-yksiköiden välillä on, että Sm1:ssä on kyljissä aaltopeltiä muistuttavat ”rypyt” eli rakennetta tukevat pokkaukset. Myös tuuletuslaitteiden ritilät… |
| Mänttä | 2003-07-29 12:21:37 | [1013](https://fi.wikipedia.org/?oldid=1013) | Mänttä on merkittävä suomalainen teollisuuspaikkakunta. Se syntyi Serlachiuksen suvun perustaman paperitehtaan ympärille, joka kuuluu nykyään Metsä Groupiin. Serlachiuksen nimi näk… |
| Paavo Lipponen | 2003-08-31 08:34:13 | [1153](https://fi.wikipedia.org/?oldid=1153) | Suomen Sosialidemokraattisessa Puolueessa Lipponen on toiminut tutkimussihteerinä, kansainvälisten asiain sihteerinä, poliittisen osaston päällikkönä, Helsingin piirin puheenjohtaj… |
| Lars Levi Laestadius | 2003-09-21 17:36:53 | [874](https://fi.wikipedia.org/?oldid=874) | Vuonna 1842 Laestadius sairastui vakavasti. Hän pelkäsi kuolevansa mutta oli varma, ettei elämällään olisi ansainnut muuta kuin helvetin tuskat. Hänen mieltään rupesi painamaan suu… |
| Lars Levi Laestadius | 2003-09-21 17:36:53 | [874](https://fi.wikipedia.org/?oldid=874) | Åselen tapahtumien jälkeen Laestadiuksen saarnat saivat uuden värin ja voiman. Hänen puheensa herättivät ihmisissä monenlaisia tunteita, ja kirkkoon alkoi tulla uteliaita kuulijoit… |
| Anneli Jäätteenmäki | 2003-11-21 02:14:59 | [38](https://fi.wikipedia.org/?oldid=38) | Jäätteenmäen pääministerikausi jäi lyhyeksi. Jo 68 päivän kuluttua nimityksestä hän päätyi eroamaan virastaan, ja eduskunta valitsi hänen seuraajakseen Matti Vanhasen samasta puolu… |
| Teknillinen korkeakoulu | 2004-01-01 16:45:43 | [15406](https://fi.wikipedia.org/?oldid=15406) | Korkeakoulussa oli noin 3 300 henkilöstön jäsentä ja noin 15 000 perus- ja jatko-opiskelijaa. Professoreita TKK:ssa oli 250.… |
| Säästöpankkien Keskus-Osake-Pankki | 2004-01-06 14:05:00 | [5497](https://fi.wikipedia.org/?oldid=5497) | Säästöpankkien Keskus-Osake-Pankki (SKOP, myös Skop) oli suomalaisten säästöpankkien keskuspankki ja pörssiyhtiö, joka perustettiin vuonna 1908. SKOP oli keskeisessä osassa Suomen … |
| Televisiomaksu | 2004-01-06 14:23:01 | [9655](https://fi.wikipedia.org/?oldid=9655) | Vuonna 1999 voimaan astuneen valtion televisio- ja radiorahastolain myötä televisiolupa muuttui television käyttöönottoilmoitukseksi ja televisiolupamaksu televisiomaksuksi. Televi… |
| Suuri Pohjan sota | 2004-01-09 21:13:45 | [11082](https://fi.wikipedia.org/?oldid=11082) | Kaarle XII kaavaili Puola-Liettuasta liittolaista, mutta ensin hänen piti voittaa Saksin ja Puolan armeijat ja syöstä August II Väkevä vallasta. August ei ollut antanut periksi lop… |
| Jokelan junaturma | 2004-01-21 04:25:57 | [6120](https://fi.wikipedia.org/?oldid=6120) | Tuntia ennen aikataulun mukaista saapumisaikaa Helsinkiin juna suistui raiteilta Jokelan rautatieaseman pohjoispäässä. Jokela sijaitsee noin 50 km Helsingistä pohjoiseen.… |
| Jokelan junaturma | 2004-01-21 04:25:57 | [6120](https://fi.wikipedia.org/?oldid=6120) | Junassa oli 139 matkustajaa ja viisi henkilökuntaan kuuluvaa, ja se oli ylittämässä onnettomuushetkellä poikkeavalle raiteelle asetettua vaihdetta. Juna ylitti 35 km/h sallitulle n… |

## How it was measured

Run sequentially from the repository root:

```sh
uv run labs/claims-before-sources/run.py --extract
uv run labs/claims-before-sources/refine.py
uv run labs/claims-before-sources/check.py
uv run labs/claims-before-sources/parse.py
uv run labs/claims-before-sources/publication_sql.py
uv run labs/claims-before-sources/audit.py
uv run labs/claims-before-sources/validate.py
uv run labs/claims-before-sources/report.py
```

One database connection at a time; one heavy SQL statement at a time. Only `lab_claims_before_sources` is written, using the provided local root credentials; `wtt` is read-only throughout. No commits. Re-extraction rebuilds only this lab's tables. `run.py` without `--extract` reuses the heavy extraction, but reruns result and first-version tables; use the full sequence for a clean reproduction. Raw inputs live in ignored `cache/`; compact chart/review artifacts live in `data/`. SQL files contain the exact executed statements; timings are local wall-clock observations, not benchmarks. All quantities are computed by the supplied scripts; manual labels are frozen observations regenerated by `audit.py`, not re-audited automatically.

1. **Population:** current `passage` joined to `passage_text`, `kind='prose' AND chars>=80`. All 133,201 have positive slots; there are no duplicate `(page_id,slot)` entries in the current population. Historical slot origins are not restricted to 80 characters, avoiding a spurious late birth when a paragraph grows.
2. **Single wikitext scan:** materialize `hash,kind,chars,has_ref` for every wording in one set-based pass. Detection uses `<ref` followed by whitespace, `/` or `>`, so `<references>` is excluded. All subsequent wikitext reads are targeted hash joins. The marker counts self-closing named uses, bare references and full templates. It does not prove the reference supports every sentence. General bibliographies, external links, source templates without `<ref>`, or sources inherited from a neighboring paragraph are outside this definition. Targeted checks found zero `{{sfn` or `{{harv` substrings in the current unreferenced subset.
3. **Lifetimes:** extract all positive-slot histories; partition `(page_id,slot,hash,dup)`, use running maximum preceding end and cumulative island labels, then merge overlapping/contiguous rows. Including slot protects against silently conflating lineage reassignment. This reduces 1,419,241 physical rows to 1,364,007 stays. Origins are the earliest start within each slot; first reference is the earliest stay with a marker. A separate running-maximum pass across slot wordings identifies periods with no observed wording. Candidate screening excludes gaps before attachment; ordinary wait statistics remain elapsed calendar time and can contain gaps.
4. **Dates and authors:** attach `born_rev` to `edit.rev_id` for both first wording and first-reference wording. The current-population integrity check found zero timestamp mismatches or missing edits for either event. The before-version is the most recently started unreferenced stay spanning attachment. Both before and first-reference versions, plus the original version, have oldid links. Original author attribution is not authorship of every later word.
5. **Publication parser:** `mwparserfromhell` handles nested templates. Accept only explicit fields in Verkkoviite, Lehtiviite, Kirjaviite, Verkkolähde, Cite web/news/book/journal. Normalize field casing, spaces, hyphens and underscores. Priority: Ajankohta, Julkaistu, Päiväys, Date, publication-date, Vuosi, Year. Accept exactly one distinct four-digit year (1000–2099), including Finnish dotted dates, ISO dates, month-and-year strings and year-only values. Preserve the raw date and selected field. Do not infer years from URLs, titles, page numbers, Wayback dates, Viitattu or Luettu. Access-date strings are retained for inspection but do not replace observed attachment dates. Years before 1000 and dates outside the supported templates are not parsed. Full calendar dates are not normalized or validated; comparisons use year precision only.
6. **Reference unit:** one `<ref>` occurrence in a current paragraph, including repeated named uses; not a distinct publication. Resolve named references only when their definition is in that same paragraph and same wording. Cross-paragraph named definitions, short footnotes pointing to bibliographies and plain-text citation dates are left unresolved. This avoids borrowing a definition from a later revision but lowers sensitivity. Publication results are conditional on parseability and are not representative of all references. The parser audit checks year extraction, not whole-source metadata, date truth or source independence.
7. **Candidates:** currently referenced, first reference later than origin, at least one explicitly dated source in that first attachment batch with `origin year < publication year <= attachment year`; no observed slot gaps before attachment; selected source still occurs today by exact parsed URL (else title, else body); multiset word Dice overlap at least **0.80** for original→first referenced, immediate predecessor→first referenced, and first referenced→current. Tokenization is lowercase Unicode `\w+`; Dice is twice the shared token-count sum divided by total token counts. This is lexical, not semantic: a death date or corrected year can pass easily. Filtering the 21,876 gained-reference paragraphs excludes 1,727 with observation gaps. In the remaining predecessor-eligible set there are 4,005 dated first-attachment occurrences, including 1,154 with a later publication year before the final overlap/persistence filters.
8. **Ranking:** descending elapsed days from slot birth to first attachment, then descending selected publication year, page ID and slot. One result per paragraph; when several sources arrive together, select the latest publication year and preserve all coattached references. The score is waiting time until attachment, not time until publication; year-only sources cannot support an exact publication-day waiting time. Earlier sources can be coattached with a later one. A currently referenced paragraph whose original source was replaced may be absent from this conservative queue.
9. **Statistics:** MariaDB performs temporal merging, slot event detection, coverage, yearly cohorts and interpolated `PERCENTILE_CONT` wait estimates. Python parses citations and calculates lexical overlap. Parsed occurrence facts are loaded into the lab database; MariaDB aggregates coverage, year-gap counts and quartiles. Python independently checks wait quantiles and denominator reconciliation. Right-censored never-referenced paragraphs are counted, not included as completed waits; no survival estimate is claimed.

### Manual audit of the top 15

I read all original, pre-reference and first-reference texts and selected citation wikitext. These are research-agent judgments, not an independent human editorial review. “Later better source for an old true claim” means consistent with ordinary later sourcing; unless noted, the outside publication was not read and historical truth/independence is not established. “Possible circular sourcing” is a review priority, not evidence that copying occurred.

| Rank | Article | Wait days | Classification | Reading and reason |
|---|---|---:|---|---|
| 1 | [Herman Klaunpoika Fleming](https://fi.wikipedia.org/?oldid=23942278) | 7,225.48 | later better source for an old true claim | Identical before/after description of Louhisaari architecture; 2025 magazine article added in 2026 to a 2006 lineage. Ordinary retrospective sourcing is plausible; magazine contents and historical truth not independently verified. |
| 2 | [Maria Tschetschulin](https://fi.wikipedia.org/?oldid=24252727) | 7,127.32 | later better source for an old true claim | Family relationships and occupations retained; removes summer 1852 and changes punctuation. A 2017 biographical retrospective is attached in 2026. Low concern; publisher contents not independently read. |
| 3 | [Esko Seppänen](https://fi.wikipedia.org/?oldid=22664387) | 7,062.48 | claim was updated with new information | Citation accompanies the newly appended comparison with Jörg Haider. High paragraph overlap hides a new claim; old political-orientation text is not evidence that the new comparison preceded its source. |
| 4 | [Pohjanmaan maanjäristys 1626](https://fi.wikipedia.org/?oldid=23375538) | 6,963.82 | later better source for an old true claim | Identical text at attachment. University seismology page supports the old earthquake/magnitude/damage account. Its fetched page shows no publication date: template year 2025 is unverified, potentially an update/access-year mistake. Do not present as confirmed later publication. Sources checked: [link](https://www.helsinki.fi/fi/seismologian-instituutti/maanjaristykset/perustietoa-maanjaristyksista). |
| 5 | [Laatokan Karjalan valtaus 1941](https://fi.wikipedia.org/?oldid=23955923) | 6,926.61 | claim was updated with new information | First sentence is localized from Korpiselkä to Ristikangas northeast of Korpiselkä at attachment. The 2021 book can support that new precision, even though the long paragraph is mostly unchanged. |
| 6 | [Pirkko Ikonen](https://fi.wikipedia.org/?oldid=23770838) | 6,844.71 | claim was updated with new information | The 2026 obituary arrives with a newly added 9 January 2026 death date and present-to-past tense. This is a new event, not evidence of copying a 2007 death claim. |
| 7 | [Valter Valli](https://fi.wikipedia.org/?oldid=23627529) | 6,618.85 | claim was updated with new information | Adds the specific regiment number 126 when citing a 2014 book. Much older battle narrative remains, but citation scope may be the newly specified unit. |
| 8 | [Venäjän kenttälinnoitukset Suomessa ensimmäisen maailmansodan aikana](https://fi.wikipedia.org/?oldid=23224768) | 6,592.27 | later better source for an old true claim | Word-identical rationale for Russian wartime fortifications; later 2018 history book attached in 2025. Ordinary historical sourcing is plausible; book text not independently verified. |
| 9 | [Outokummun rata](https://fi.wikipedia.org/?oldid=23258029) | 6,573.15 | claim was updated with new information | Changes demolition year from 2004 to 2005, removes the 2000 closure claim, and qualifies opening of the complete route. The 2009 railway reference accompanies factual corrections. |
| 10 | [Suomen ensimmäiset tietokoneet](https://fi.wikipedia.org/?oldid=21185452) | 6,515.56 | later better source for an old true claim | Unchanged 2005 paragraph includes the sauna-origin anecdote. Archived Sitra article confirms 24 October 2017 and has a source list naming Sarmanto/Tunkelo interviews, 1971/1972 records and older material. Evidence favors a later researched retrospective; direct dependence of this individual anecdote is not fully traced. Sources checked: [link](https://arkisto.sitra.fi/caset/data-sitra/), [link](https://arkisto.sitra.fi/artikkelit/tarinoita-tulevaisuudesta-lahdeluettelo/). |
| 11 | [Nailonsukkamurhat](https://fi.wikipedia.org/?oldid=22471914) | 6,511.34 | claim was updated with new information | Adds exact death day/month at attachment; older crime narrative remains. The template says 23 June 2023, accessed 24 June 2023, but attachment is 24 June 2024. Access dates cannot substitute for observed attachment times; source metadata could also contain a typo. |
| 12 | [Sinikka Hurskainen](https://fi.wikipedia.org/?oldid=22382594) | 6,450.59 | claim was updated with new information | Changes spouse from secretary general to former secretary general; cited 2014 article announces a successor. Also removes child name. New status update explains why a later source is relevant. |
| 13 | [Lauri Nurminen](https://fi.wikipedia.org/?oldid=24248750) | 6,341.60 | later better source for an old true claim | Rephrases last surviving into longest lived while preserving identity/date claim. The dated 2023 association report cites its own anniversary book and describes a grave visit. Evidence favors later retrospective sourcing; does not prove every detail independently. Sources checked: [link](https://vapaussodanperinne.yhdistysavain.fi/uutiset/yhdistys-laski-havukukat-viimeisen/). |
| 14 | [Laitaatsillan taistelu](https://fi.wikipedia.org/?oldid=22579810) | 6,316.38 | possible circular sourcing worth a human look | Unchanged, detailed earthwork dimensions and trench account predates a 2015 tourism thesis by eight years. Theseus confirms thesis year; PDF fetch was blocked, so its page 20 and bibliography remain unchecked. A focused provenance check is worthwhile; no evidence that the thesis copied Wikipedia has been established. Sources checked: [link](https://www.theseus.fi/handle/10024/99666). |
| 15 | [Hietamäki (Inkeri)](https://fi.wikipedia.org/?oldid=21318876) | 6,216.81 | claim was updated with new information | Changes the historical church village and memorial location from Alakylä to Jälkylä while attaching a 2017 church magazine. This is a substantive location correction despite 93% origin overlap. |

The strongest illustration of a false-positive risk is the unchanged Data-Sitra anecdote: its 2017 retrospective has interviews and archival material listed explicitly, including records predating the Wikipedia paragraph. The most useful unresolved lead is the Laitaatsilta thesis, whose metadata was accessible but whose PDF returned 403; its cited page and bibliography must be examined before any provenance conclusion. The earthquake page supports the historical account but does not establish the template's claimed 2025 publication date. Live external checks are supplemental notes dated 14 November 2026 and may not represent the exact source version seen by the Wikipedia editor.

### Parser audit

Simple random sample of 50 parsed **current occurrences**, deterministic seed 20261114, selected from the initial SQL extraction order. The committed parser-sample-manifest.json freezes occurrence identities so reruns reproduce the same random sample independently of SQL row ordering. The frozen sample and all 50 individual decisions are in [parser-audit.json](data/parser-audit.json); the selected raw citation, same-paragraph definition body where needed, expected year, result and note are retained. Three sampled self-closing uses were checked against their definition bodies. All 50 selected years match explicit publication fields; zero came from access or archive dates. One source has `Ajankohta=6.5.2028` with access in 2026, one has a malformed `2001--01-24` full date, and one has the date of a 1918 archival act. The parser extracts those strings faithfully but cannot certify their publication semantics. Do not advertise 100% publication-date accuracy. Sampling occurrences gives frequently repeated sources more weight; uncertainty is not adjusted for article/source clustering.

## The exact SQL

The central source scan is:

```sql
CREATE TABLE flags AS
SELECT hash,kind,chars,
       (wikitext REGEXP '<ref([[:space:]/>])') has_ref
FROM wtt.passage_text;
```

The event definition is:

```sql
CREATE TABLE origins AS
SELECT page_id,slot,MIN(a) written,
       MIN(IF(has_ref,a,NULL)) referenced
FROM stays GROUP BY page_id,slot;
```

Every executed statement, including the window-function merging and quantiles, is linked below. Insert parameters for parsed dates are regenerated in `cache/citation-facts-input.json`. The import statement is parameterized; no core table is changed. Result-row counts are zero for DDL even when it materializes many rows. The initial extraction scans 1,630,250 wording rows; timing excludes neither decompression nor server work, but Python JSON serialization is outside the recorded query time.

| SQL statement | Wall seconds | Returned/imported rows |
|---|---:|---:|
| [database](sql/database.sql) | 0.0027 | 0 |
| [use](sql/use.sql) | 0.0005 | 0 |
| [timezone](sql/timezone.sql) | 0.0012 | 0 |
| [drop-flags](sql/drop-flags.sql) | 0.0469 | 0 |
| [build-flags](sql/build-flags.sql) | 16.0325 | 0 |
| [index-flags](sql/index-flags.sql) | 1.2026 | 0 |
| [drop-raw](sql/drop-raw.sql) | 0.0022 | 0 |
| [build-raw](sql/build-raw.sql) | 7.1143 | 0 |
| [index-raw](sql/index-raw.sql) | 1.4877 | 0 |
| [drop-marked](sql/drop-marked.sql) | 0.0070 | 0 |
| [build-marked](sql/build-marked.sql) | 5.8632 | 0 |
| [drop-islands](sql/drop-islands.sql) | 0.0077 | 0 |
| [build-islands](sql/build-islands.sql) | 6.4649 | 0 |
| [drop-stays](sql/drop-stays.sql) | 0.0103 | 0 |
| [build-stays](sql/build-stays.sql) | 13.2721 | 0 |
| [index-stays](sql/index-stays.sql) | 1.9073 | 0 |
| [drop-origins](sql/drop-origins.sql) | 0.0027 | 0 |
| [build-origins](sql/build-origins.sql) | 2.6713 | 0 |
| [index-origins](sql/index-origins.sql) | 0.3674 | 0 |
| [drop-current](sql/drop-current.sql) | 0.0020 | 0 |
| [build-current](sql/build-current.sql) | 2.4967 | 0 |
| [index-current](sql/index-current.sql) | 0.0551 | 0 |
| [drop-facts](sql/drop-facts.sql) | 0.0013 | 0 |
| [build-facts](sql/build-facts.sql) | 0.2830 | 0 |
| [index-facts](sql/index-facts.sql) | 0.0593 | 0 |
| [summary](sql/summary.sql) | 0.0587 | 1 |
| [sourcing-by-year](sql/sourcing-by-year.sql) | 0.0442 | 24 |
| [wait-for-reference](sql/wait-for-reference.sql) | 0.1342 | 24 |
| [wait-overall](sql/wait-overall.sql) | 0.1284 | 2 |
| [drop-first_versions](sql/drop-first_versions.sql) | 0.0019 | 0 |
| [build-first_versions](sql/build-first_versions.sql) | 3.3515 | 0 |
| [index-first_versions](sql/index-first_versions.sql) | 0.6600 | 0 |
| [drop-first_refs](sql/drop-first_refs.sql) | 0.0138 | 0 |
| [build-first_refs](sql/build-first_refs.sql) | 1.2091 | 0 |
| [index-first_refs](sql/index-first_refs.sql) | 0.4077 | 0 |
| [oldest-unsourced](sql/oldest-unsourced.sql) | 0.0780 | 25 |
| [reference-input](sql/reference-input.sql) | 23.3511 | 99415 |
| [drop-pre_refs](sql/drop-pre_refs.sql) | 0.1972 | 0 |
| [build-pre_refs](sql/build-pre_refs.sql) | 1.5155 | 0 |
| [index-pre_refs](sql/index-pre_refs.sql) | 0.0497 | 0 |
| [pre-reference-input](sql/pre-reference-input.sql) | 1.4024 | 28756 |
| [integrity](sql/integrity.sql) | 0.7378 | 1 |
| [use-refine](sql/use-refine.sql) | 0.0003 | 0 |
| [all-sourcing-by-year](sql/all-sourcing-by-year.sql) | 0.4690 | 24 |
| [drop-slot_gaps](sql/drop-slot_gaps.sql) | 0.0029 | 0 |
| [build-slot_gaps](sql/build-slot_gaps.sql) | 3.4547 | 0 |
| [index-slot_gaps](sql/index-slot_gaps.sql) | 0.0464 | 0 |
| [gap-input](sql/gap-input.sql) | 0.0404 | 2338 |
| [never-unsourced-age](sql/never-unsourced-age.sql) | 0.0267 | 1 |
| [use-check](sql/use-check.sql) | 0.0212 | 0 |
| [use-check](sql/use-check.sql) | 0.0004 | 0 |
| [event-integrity](sql/event-integrity.sql) | 2.7456 | 1 |
| [current-reference-markers](sql/current-reference-markers.sql) | 4.8726 | 1 |
| [use-publication](sql/use-publication.sql) | 0.0006 | 0 |
| [drop-citation_dates](sql/drop-citation_dates.sql) | 0.0031 | 0 |
| [create-citation_dates](sql/create-citation_dates.sql) | 0.0031 | 0 |
| [insert-citation_dates](sql/insert-citation_dates.sql) | 0.8291 | 195053 |
| [publication-sql-summary](sql/publication-sql-summary.sql) | 0.0329 | 1 |
| [publication-year-gap](sql/publication-year-gap.sql) | 0.0202 | 219 |
| [publication-quantiles](sql/publication-quantiles.sql) | 0.0327 | 1 |

## What did not work

- **Chronology is not causality.** Most audited cases are old history being sourced later or new details being added. Paragraph overlap does not isolate the particular sentence supported by a citation. No outside copying is demonstrated.
- **Named-reference resolution is incomplete.** A full page-and-revision citation-definition resolver is the main missing capability. The 191 candidates are a reproducible conservative screen, not an estimate of how much circular sourcing exists. Bare bibliographic dates are intentionally not guessed.
- **Publication metadata is user-entered.** Five current parsed occurrences contain years after 2026. Full dates can be malformed; web update dates and archive-record dates can masquerade as publication dates. Template dates require publisher verification before escalation.
- **Lineage is inferred.** Paragraph splits, merges, large rewrites, earlier copies in another article, missing historical revisions and slot reassignment may make a first observed slot different from the first appearance of the claim anywhere. The candidate gate checks endpoint wording similarity and gap-free slot residence, not every intermediate wording or uninterrupted survival of each sentence.
- **Current-survivor selection and partial 2026 matter.** Current wait distributions cannot describe all historical sourcing behavior. The annual birth chart instead includes removed slots, but still depends on inferred slot creation and the syntax measured. Early zero inline-ref rates do not mean early articles had no sources.
- **Age is not continuous unsourced exposure.** The old-currently-unreferenced table includes 1,507 lineages with historical references elsewhere in the population; separate never-referenced counts are given. Age thresholds use 1 October 2026 UTC calendar anniversaries.
- **Access dates do not date attachment.** Nailonsukkamurhat's saved template reports access in 2023, while the observed attachment is in 2024. Copying citation templates and metadata typos defeat treating access fields as exact event timestamps.
- **Development fixes:** duplicate `title` keys in initial audit export caused a Python error; an ambiguous SQL join needed explicit aliases. Both were fixed. Adding observed `Nimike` and `www` aliases corrected metadata coverage and changed exact source-persistence matching from 193 to 191 candidates. Final outputs use the corrected parser; no source rows were changed.

## What the product should do with it

Show a **“Claim before source?” review queue** with three separate clocks: first observed paragraph, first inline reference, and declared publication date/precision. Put the original, immediately preceding, first-referenced and current wording side by side, with sentence-level changes highlighted. Expose the selected date field, exact reference wikitext, coattached sources and oldid links. Display authors as revision provenance, never misconduct scores.

Default to the conservative candidate filter and show audit labels beside the ranking. Explain that a long wait is not suspicious by itself; new death dates and location/year corrections should be easy to dismiss. The publication-date coverage denominator, unresolved named uses, provisional publication dates and partial-2026 labels must be visible. Distinguish “currently no inline reference” from “never had one” and “article has no sources.”

The next research step is historical page-level named-reference resolution, followed by sentence-level citation scope and verified source publication dates. For any proposed citogenesis case, a human must inspect the external source's provenance and earlier editions/archives. This lab supplies an investigation queue and a measured limit on automation.
