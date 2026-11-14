# Sentence journeys

## The question

Where does a paragraph travel within the recorded histories of 19,742 Finnish Wikipedia articles? Measure exact paragraph reuse, bulk transfer candidates, survival, and repeated sentences. **First observed here is neither authorship nor first appearance on all Wikipedia.** “Source” below is chronological shorthand, not a proven copying source.

## What we found

- **1,899 of 744,566 (0.255%)** qualifying prose hashes ever appear in at least two articles; **22** reach five, **0** reach twenty. **100** stand in multiple articles at the dataset endpoint.
- **34.75 days** is the median first-to-second delay; quartiles **0.815 and 467.70 days**. **19.01%** spread within an hour, **27.12%** within a day, **73.20%** within 365 days. No tied first timestamps.
- **85 bulk transfer candidates**, with at least five qualifying wordings arriving in one destination revision from one earlier article: **57** have at least five near-synchronous removals; **27** have at least five retained source wordings. These classifications can overlap or leave mixed events unclassified. The largest is **86 paragraphs**, Sortovuodet → Ensimmäinen sortokausi, 2009-03-07, comment “siirto tänne”. **44/85** have transfer-related wording in a destination or near-removal source comment; **28** in the destination comment alone.
- **174 articles (0.88%)** contain at least one qualifying paragraph at their first recorded edit that was observed earlier in another sampled article; **46** contain at least five. This is evidence of text reuse at recorded birth, not proof of a split or true page creation.
- **1,130 destinations outlast their first-observed source, versus 336 sources**, among **1,553** first/second pairs whose source still contains the text at destination arrival. **87** pairs remain in both and cannot be ranked. Among **1,521** pairs with a full year of follow-up, **49.70%** survive unchanged in the destination versus **23.21%** in the source.

### Spread distribution

| Articles ever | Wordings | Of those, currently in ≥2 |
|---|---|---|
| 1 | 742667 | 0 |
| 2 | 1781 | 78 |
| 3 | 80 | 6 |
| 4 | 16 | 7 |
| 5 | 6 | 3 |
| 6 | 7 | 3 |
| 7 | 3 | 0 |
| 9 | 2 | 2 |
| 10 | 2 | 0 |
| 11 | 1 | 0 |
| 17 | 1 | 1 |

### Boilerplate and two additional findings

The leading sentence-like span is observed in **242 articles**: “Hän otti osaa taisteluihin ensimmäisessä maailmansodassa Saksan itärintamalla Misse-joella, Riianlahdella ja Aa-joella.”. Sentence extraction is a separate reading-text analysis, not the paragraph-hash headline population. The top examples below show what actually repeats; hundreds-of-articles sentence reuse is not assumed.

| Articles | Sentence-like span |
|---|---|
| 242 | Hän otti osaa taisteluihin ensimmäisessä maailmansodassa Saksan itärintamalla Misse-joella, Riianlahdella ja Aa-joella. |
| 101 | Hän oli sotilaskoulutuksensa ensimmäisen maailmansodan aikana Saksassa saanut jääkäri, joka sai tulikasteensa Saksan itärintamalla Misse-joella vuonna 1916. |
| 73 | Hän oli sotilaskoulutuksensa ensimmäisen maailmansodan aikana Saksassa saanut jääkäri. |
| 60 | Hän otti osaa taisteluihin ensimmäisessä maailmansodassa Saksan itärintamalla Misse-joella, Riianlahdella ja Schmardenissa sekä Aa-joella. |
| 32 | Hänet sijoitettiin joukon 1. komppaniaan. |
| 30 | Tulikasteensa hän sai Saksan itärintamalla Misse-joella vuonna 1916. |
| 28 | Moskovan rauhassa 1940 alue luovutettiin Neuvostoliitolle, mutta Suomi valtasi alueen takaisin jatkosodan alussa 1941 ja kylän asukkaat pääsivät palaamaan raunioituneeseen kotikyläänsä. |
| 27 | Rauhanteossa kylä jäi taas Neuvostoliiton puolelle. |
| 26 | Jälleenrakennus keskeytyi vuonna 1944 Neuvostoliiton suurhyökkäyksen alettua ja kylän asukkaat evakuoitiin uudelleen. |
| 26 | Kunnassa asuu ihmistä, ja sen pinta-ala on km2, josta km2 on vesistöjä. |

List items repeat much more widely: **10,030** shared list hashes, **113** in at least twenty articles, maximum **482**. “Jääkärimerkki” occurs under one hash in **482** articles. Repeated military decorations and bibliography entries dominate the block-level ranking. A nominal prose hash with empty cleaned text appears in **1,900** articles: a parser/markup artifact, not a repeated sentence. Raw blocks remain in [boilerplate.json](data/boilerplate.json); sentence results are in [boilerplate-sentences.json](data/boilerplate-sentences.json).

**Finding: identical reading text can have different hashes.** The **1899** shared hashes collapse to **1809** distinct exact clean strings. Inspection of `packages/ingest/passages.ts` shows SHA-1 truncated to eight bytes hashes the original block before cleaning. Markup-only changes can end a hash lifetime without changing what a reader sees. The top substantive evacuation paragraph has two clean-text-identical hashes travelling through eleven and nine articles, but only thirteen distinct articles in their union (see `evacuation-reading-text.json`); these are not independent ideas or proof of two separate copying campaigns.

**Finding: bulk restructuring accounts for much of exact reuse.** **1238 of 1899 shared hashes (65.2%)** participate in at least one five-paragraph transfer candidate. This supports a bulk-transfer explorer more strongly than a universal plagiarism detector.

### Thirty largest transfer candidates

“Moved” means source absence begins within ±1 hour of destination arrival; “retained” means source presence continues beyond that hour. A copied paragraph can be removed days later. Current titles label historical pages. Source removal editor/comments, where available, are also preserved in the JSON.

| Source → destination | UTC / revision | Paragraphs | Moved / retained | Destination editor | Destination comment |
|---|---|---|---|---|---|
| Sortovuodet → Ensimmäinen sortokausi | [2009-03-07T17:24:50](https://fi.wikipedia.org/?oldid=6377012) | 86 | 86 / 0 | Kahkonen | siirto tänne |
| Mäkiluoto → Mäkiluodon historia | [2018-11-16T21:37:52](https://fi.wikipedia.org/?oldid=17713010) | 77 | 0 / 77 | Msaynevirta | Ak: Uusi sivu: '''Mäkiluoto''' ({{k-sv\|Makilo}}) on noin kuusi kilometriä [[Porkkalanniemi\|Porkkalanniemestä]] lounaaseen [[Suomenlahti\|Suomenlahdella]] sijaitseva kallioinen ulkosaari, joka o... |
| Artjärvi → Artjärven historia | [2015-09-21T12:10:32](https://fi.wikipedia.org/?oldid=15227165) | 74 | 74 / 0 | Raksa123 | Siirretty pitkä ja lähdeviitteetön osio omaksi artikkelista sivulta [[Artjärvi]] |
| Koronaviruspandemia Suomessa → Suomen toimenpiteet koronaviruspandemiaa vastaan | [2020-05-20T07:42:26](https://fi.wikipedia.org/?oldid=18936402) | 53 | 0 / 53 | 87.95.219.17 | tekstin siirto uuteen artikkelinn |
| Talvisota → Talvisodan tausta | [2009-09-18T17:49:01](https://fi.wikipedia.org/?oldid=7340849) | 49 | 47 / 2 | Peltimikko | Ak: Uusi sivu: [[File:Paasikivi october 1939 kajander hakkila.jpg\|thumb\|right\|250px\|Suomen neuvottelija [[Juho Kusti Paasikivi\|J.K. Paasikivi]] lähdössä [[Moskova]]n neuvotteluihin 9. lokakuuta 1... |
| Sortovuodet → Toinen sortokausi | [2009-03-07T09:11:57](https://fi.wikipedia.org/?oldid=6374467) | 48 | 48 / 0 | Anna O | artikkelin jakaminen kahteen osaan. |
| Lestadiolaisuus → Lestadiolaisuuden historia | [2025-03-06T19:59:13](https://fi.wikipedia.org/?oldid=23092617) | 41 | 0 / 41 | Weisself | Siirto artikkelista Lestadiolaisuus |
| Lestadiolaisuus → Lestadiolaisuuteen liittyvät kiistat | [2007-08-09T11:30:29](https://fi.wikipedia.org/?oldid=3289457) | 36 | 36 / 0 | Mattiasmeikäläinen | --> Naiset sananjulistajina lestadiolaisuudessa 1800-luvulla |
| Lestadiolaisuus → Lestadiolaisuuden historia | [2025-03-06T21:37:07](https://fi.wikipedia.org/?oldid=23092866) | 36 | 36 / 0 | Weisself | Hajaannusten siirto Lestadiolaisuus-artikkelista |
| Ahtium → Talvivaaran kaivos | [2017-08-07T11:14:00](https://fi.wikipedia.org/?oldid=16672034) | 34 | 34 / 0 | Wähäwiisas | Vesi- ja ympäristöongelmat siirretty yhtiöartikkelista Talvivaara |
| Terrorismi Suomessa → Lahden uusnatsiterroristit | [2023-11-01T15:58:48](https://fi.wikipedia.org/?oldid=21959770) | 25 | 25 / 0 | Inehmo | Tulkoon artikkeli! |
| HL Kuru → HL Kurun uppoaminen | [2016-11-01T21:13:23](https://fi.wikipedia.org/?oldid=16040113) | 24 | 23 / 1 | Aulis Eskola | Kurun uppoamisesta oma artikkeli, materiaali tuotu artikkelista [[HL Kuru]] |
| Saloinen → Saloisten historia | [2008-07-03T12:01:28](https://fi.wikipedia.org/?oldid=5047933) | 22 | 21 / 1 | 130.234.68.211 | Ak: Uusi sivu: '''Saloinen''' eli '''Salo''' on yksi Pohjanmaan vanhoista emäpitäjistä. Salo tarkoittaan isoa saarta, nimensä pitäjä sai siitä että seurakunnan perustamisaikoihin vanhimmat k... |
| Sotatalous Suomessa toisen maailmansodan aikana → Sotatalous Suomessa talvisodan aikana | [2011-09-23T16:06:08](https://fi.wikipedia.org/?oldid=10709167) | 22 | 0 / 22 | Janis | irroitettu toisesta artikkelista ns. pullataikina-efektin vuoksi |
| Laivalatomus → Luettelo laivalatomuksista | [2014-02-22T13:03:40](https://fi.wikipedia.org/?oldid=13880451) | 20 | 20 / 0 | Tanár | siirretään tämä laivalatomus-artikkelista omaksi luettelokseen |
| Koronaviruspandemia Suomessa → Suomen koronaviruspandemian aikajana | [2020-05-18T13:17:27](https://fi.wikipedia.org/?oldid=18933041) | 20 | 20 / 0 | 87.95.175.6 | tekstin siirtoa uuteen artikkeliin |
| Koronaviruspandemia Suomessa → Suomen koronavirusepidemiaa ennustavat mallit | [2020-05-20T07:25:05](https://fi.wikipedia.org/?oldid=18936374) | 19 | 0 / 19 | 87.95.219.17 | Artikkelin perustaminen |
| Sininen eduskuntaryhmä → Perussuomalaisten puoluekokous 2017 | [2017-06-17T14:51:04](https://fi.wikipedia.org/?oldid=16553523) | 18 | 18 / 0 | J. Sketter | Pääartikkeliksi |
| Talvisota → Talvisodan ulkomainen apu | [2009-12-04T22:24:57](https://fi.wikipedia.org/?oldid=7684707) | 17 | 16 / 1 | Peltimikko | Ak: Uusi sivu: [[Tiedosto:Imre Kemeri Nagy and Oscar Enckell.png\|thumb\|right\|250px\|Kenraaliluutnantti [[Oscar Enckell]] suoritti unkarilaisten vapaaehtoisten lähtötarkastuksen.]] '''Talvisodan ulk... |
| Helsingin Vesi → Helsingin seudun ympäristöpalvelut | [2009-12-23T17:42:17](https://fi.wikipedia.org/?oldid=7766415) | 16 | 0 / 16 | August-54 | None |
| Suomen toimenpiteet koronaviruspandemiaa vastaan → Suomen koronavirusstrategia | [2020-06-19T07:39:39](https://fi.wikipedia.org/?oldid=18996712) | 16 | 2 / 14 | 87.95.157.224 | Artikkelin perustaminen |
| Kakskerta → Kakskerta (kunta) | [2026-09-18T07:24:11](https://fi.wikipedia.org/?oldid=24246623) | 16 | 6 / 10 | Lax | Artikkelin [[Kakskerta]] sisällön kopiointi saari- ja kunta-artikkelien erottamisen aluksi (kts. [[Keskustelu:Kakskerta]]). |
| Äärioikeisto Suomessa (kirja) → Jyväskylän kirjastopuukotus | [2013-02-01T11:38:56](https://fi.wikipedia.org/?oldid=12646457) | 15 | 15 / 0 | Thi | Ak: Uusi sivu: [[Kuva:JyväskyläCityLibrary.jpg\|thumb\|Jyväskylän pääkirjasto- ja kansalaisopistontalo.]] '''Puukotusvälikohtaus Jyväskylän kaupunginkirjastossa''' tapahtui 30. tammikuut... |
| Valmet → Valmetin historia | [2018-04-21T05:24:03](https://fi.wikipedia.org/?oldid=17252112) | 15 | 13 / 2 | Jjanhone | siirretään Valmet-artikkelin historia omaksi artikkelikseen |
| Ahlstrom (entinen yritys) → Ahlstrom | [2018-08-12T01:23:47](https://fi.wikipedia.org/?oldid=17494631) | 14 | 0 / 14 | J. Sketter | Vaikka onkin osin lähteetöntä, siirretään tänne asiaankuuluva tieto artikkelista Ahlström. Munksjöstä ei ole ollut artikkelia, mutta ruotsinkielinen löytyy lähtökohdaksi -> AM |
| Viikingit → Viikinkiaika | [2005-09-20T21:42:51](https://fi.wikipedia.org/?oldid=433491) | 12 | 12 / 0 | Rdnk | iso klöntti tekstiä siirretty sivulta viikingit |
| Karjalaiset (heimo) → Karjalan historia | [2006-03-06T14:13:03](https://fi.wikipedia.org/?oldid=864704) | 12 | 12 / 0 | 217.30.179.130 | None |
| Kalevala → Kalevalainen runous | [2006-03-11T12:43:34](https://fi.wikipedia.org/?oldid=883119) | 12 | 12 / 0 | Tuohirulla | None |
| Suomen sisällissota → Suomen sisällissodan nimet | [2006-11-05T07:43:36](https://fi.wikipedia.org/?oldid=1849954) | 11 | 11 / 0 | Ilummeen | Sisällissodan nimille oma linkkisivu |
| Saamelaiset → Saamelaisten historia | [2012-02-21T14:18:29](https://fi.wikipedia.org/?oldid=11299541) | 11 | 0 / 11 | Thi | Artikkelista [[saamelaiset]] |

### Thirty substantive journeys

Ranked by articles descending, then stored chars descending and hash. The explicit exclusions remove chart instructions, bibliography, table/navigation debris and repetitive noise; headline numbers retain all qualifying hashes. This is an editorial display screen, not a claim that `kind=prose` guarantees substantive writing. Separate hash variants remain separate. Full paths, editor metadata and excerpts are in [top-journeys.json](data/top-journeys.json).

**1. 11 articles · `DC4E2656304FF854`**

Talvisodan alussa kylästä evakuoitiin alaikäiset lapset äiteineen. Muu väestö evakuotiin rauhan tultua, kun selvisi että Käkisalmen maalaiskunta kuului luovutettaviin alueisiin. Jatkosodan aikana asukkaita palasi koteihinsa, mutta uusi evakuointi oli edessä vuonna 1944.

[Näpinlahti](https://fi.wikipedia.org/?oldid=5283833) (2008-08-14T17:45:55 UTC) → [Sakkali](https://fi.wikipedia.org/?oldid=5283919) (2008-08-14T17:56:07 UTC) → [Joensuu (Käkisalmen mlk)](https://fi.wikipedia.org/?oldid=5288045) (2008-08-15T14:33:09 UTC) → [Vuohensalo](https://fi.wikipedia.org/?oldid=5294422) (2008-08-16T17:20:58 UTC) → [Marjalanniemi](https://fi.wikipedia.org/?oldid=5305881) (2008-08-18T14:03:35 UTC) → [Kapeasalmi](https://fi.wikipedia.org/?oldid=5306284) (2008-08-18T14:53:21 UTC) → [Hirvisaari (Käkisalmen mlk)](https://fi.wikipedia.org/?oldid=5335869) (2008-08-24T08:26:42 UTC) → [Pärnä](https://fi.wikipedia.org/?oldid=5336430) (2008-08-24T10:19:00 UTC) → [Suotniemi](https://fi.wikipedia.org/?oldid=5336892) (2008-08-24T11:48:40 UTC) → [Tenkalahti](https://fi.wikipedia.org/?oldid=5344943) (2008-08-25T15:13:07 UTC) → [Porkanniemi](https://fi.wikipedia.org/?oldid=5350691) (2008-08-26T14:39:03 UTC)

**2. 9 articles · `173B3C202DBA03B4`**

Talvisodan alussa kylästä evakuoitiin alaikäiset lapset äiteineen. Muu väestö evakuoitiin rauhan tultua, kun selvisi että Käkisalmen maalaiskunta kuului luovutettaviin alueisiin. Jatkosodan aikana asukkaita palasi koteihinsa, mutta uusi evakuointi oli edessä vuonna 1944.

[Näpinlahti](https://fi.wikipedia.org/?oldid=16388413) (2017-04-01T00:50:18 UTC) → [Hirvisaari (Käkisalmen mlk)](https://fi.wikipedia.org/?oldid=16388519) (2017-04-01T05:00:12 UTC) → [Sakkali](https://fi.wikipedia.org/?oldid=16388520) (2017-04-01T05:00:20 UTC) → [Kapeasalmi](https://fi.wikipedia.org/?oldid=16388523) (2017-04-01T05:00:40 UTC) → [Porkanniemi](https://fi.wikipedia.org/?oldid=16388524) (2017-04-01T05:00:48 UTC) → [Pärnä](https://fi.wikipedia.org/?oldid=16388525) (2017-04-01T05:00:58 UTC) → [Suotniemi](https://fi.wikipedia.org/?oldid=16388526) (2017-04-01T05:01:06 UTC) → [Marjalanniemi](https://fi.wikipedia.org/?oldid=16388527) (2017-04-01T05:01:13 UTC) → [Joensuu (Käkisalmen mlk)](https://fi.wikipedia.org/?oldid=16388529) (2017-04-01T05:02:08 UTC)

**3. 6 articles · `C794BF272254E50C`**

Sotasairaala muodostui osastoista, joiden toimintaan vaikuttivat hoidettavat sairaudet ja niiden vaikeusaste. A-osastot ja sairaalat oli tarkoitettu vaikeille kirurgisille tapauksille, joiden hoitoon tarvittiin leikkaussalia, röntgeniä ja laboratoriota. B-osastoilla hoidettiin lievemmin haavoittuneita ja järjestettiin kirurgisten potilaiden kuntoutus. Lisäksi siellä hoidettiin sisätautien potilaita ja tartuntatauteja sairastavia.

[13. sotasairaala](https://fi.wikipedia.org/?oldid=23140438) (2025-03-30T08:30:49 UTC) → [47. sotasairaala](https://fi.wikipedia.org/?oldid=23184647) (2025-04-20T23:57:45 UTC) → [53. sotasairaala](https://fi.wikipedia.org/?oldid=23224465) (2025-05-09T23:32:52 UTC) → [1. sotasairaala](https://fi.wikipedia.org/?oldid=23224484) (2025-05-09T23:43:50 UTC) → [72. sotasairaala](https://fi.wikipedia.org/?oldid=23227986) (2025-05-11T20:39:31 UTC) → [57. sotasairaala](https://fi.wikipedia.org/?oldid=24207211) (2026-08-29T21:15:46 UTC)

**4. 6 articles · `DC700E10130C116E`**

Toisen maailmansodan aikana kylä oli saksalaisjoukkojen miehittämä. Vuosina 1943-1944 inkeriläisiä vietiin Viron kautta Suomeen. Sodan jälkeen osa heistä jäi Suomeen, jotkut pakenivat Ruotsiin. Neuvostoliittoon palanneet eivät vastoin lupauksia päässeet kotikyläänsä, vaan heidät karkotettiin eri puolille Venäjää.

[Pääsölä](https://fi.wikipedia.org/?oldid=21959773) (2023-11-01T15:59:25 UTC) → [Vanhamoisio](https://fi.wikipedia.org/?oldid=21981967) (2023-11-12T09:14:29 UTC) → [Sakoska](https://fi.wikipedia.org/?oldid=21982025) (2023-11-12T09:47:16 UTC) → [Kuttusi](https://fi.wikipedia.org/?oldid=22335736) (2024-04-19T07:50:12 UTC) → [Saklina](https://fi.wikipedia.org/?oldid=22338330) (2024-04-20T10:28:45 UTC) → [Uusi Poru](https://fi.wikipedia.org/?oldid=22354954) (2024-04-28T07:05:52 UTC)

**5. 6 articles · `4318E57D7B6F25BF`**

Kunnallisvaalien yleinen äänestysprosentti ylitti 50% ensimmäistä kertaa vuoden 1945 kunnallisvaaleissa. Edelliset kunnallisvaalit oli sotien vuoksi järjestetty yhdeksän vuotta aikaisemmin 1936. 1930, 1933 ja 1936 eivät kommunistisiksi epäillyt ehdokkaat olleet vaalikelpoisia.

[Kunnallisvaalit 1947](https://fi.wikipedia.org/?oldid=15402730) (2015-12-19T03:29:13 UTC) → [Kunnallisvaalit 1950](https://fi.wikipedia.org/?oldid=15402732) (2015-12-19T03:31:15 UTC) → [Kunnallisvaalit 1953](https://fi.wikipedia.org/?oldid=15402733) (2015-12-19T03:35:45 UTC) → [Kunnallisvaalit 1956](https://fi.wikipedia.org/?oldid=15402734) (2015-12-19T03:37:40 UTC) → [Kunnallisvaalit 1960](https://fi.wikipedia.org/?oldid=15402736) (2015-12-19T03:49:05 UTC) → [Kunnallisvaalit 1964](https://fi.wikipedia.org/?oldid=15402737) (2015-12-19T03:50:18 UTC)

**6. 6 articles · `86B3D75756CD1381`**

Nykyhetken kannalta keskeisin ongelma liittyy siihen, että Stasin tiedusteluasema koordinoi läheisesti toimintaansa Neuvostoliiton KGB:n kanssa. Näin ollen myös Venäjä saattaa kyetä edelleen käyttämään hyväksi itäsaksalaisten kautta muodostettuja riippuvuussuhteita.

[Riitta Myller](https://fi.wikipedia.org/?oldid=20420995) (2022-04-13T15:48:03 UTC) → [Ilkka Taipale](https://fi.wikipedia.org/?oldid=20421006) (2022-04-13T15:53:16 UTC) → [Jouko Kajanoja](https://fi.wikipedia.org/?oldid=20421017) (2022-04-13T15:57:36 UTC) → [Eero Heinäluoma](https://fi.wikipedia.org/?oldid=20421027) (2022-04-13T16:00:43 UTC) → [Ulpu Iivari](https://fi.wikipedia.org/?oldid=20421037) (2022-04-13T16:03:22 UTC) → [Paavo Lipponen](https://fi.wikipedia.org/?oldid=20421061) (2022-04-13T16:09:42 UTC)

**7. 5 articles · `F9520AFAAAEA6E60`**

Nykyhetken kannalta keskeisin ongelma liittyy siihen, että Stasin tiedusteluasema koordinoi läheisesti toimintaansa Neuvostoliiton KGB:n kanssa. Näin ollen myös Venäjä saattaa kyetä edelleen käyttämään hyväksi itäsaksalaisten kautta muodostettuja riippuvuussuhteita.

[Veijo Puhjo](https://fi.wikipedia.org/?oldid=20420997) (2022-04-13T15:49:17 UTC) → [Ilkka-Christian Björklund](https://fi.wikipedia.org/?oldid=20421007) (2022-04-13T15:53:27 UTC) → [Kalevi Sorsa](https://fi.wikipedia.org/?oldid=20421031) (2022-04-13T16:02:03 UTC) → [Kirsti Lintonen](https://fi.wikipedia.org/?oldid=20421040) (2022-04-13T16:04:11 UTC) → [Jaakko Blomberg](https://fi.wikipedia.org/?oldid=20421064) (2022-04-13T16:10:40 UTC)

**8. 4 articles · `37F201A358090759`**

Tutkimuksessa on esitetty eriäviä tulkintoja tämän aluejaon synnystä. Aiempi tulkinta ajoitti sen 1300-luvun alkuun, mutta tätä on kritisoitu sillä perusteella, että Varsinais-Suomi oli todennäköisesti vielä yhtenäinen 1300-luvun puolivälissä. Tämän myöhemmän tulkinnan mukaan jako ajoittuu sen sijaan mecklenburgilaiselle ajalle (1360-luvun jälkeen), mahdollisesti Bo Jonssonin aikana.

[Pohja-Suomi (historiallinen alue)](https://fi.wikipedia.org/?oldid=24184079) (2026-08-18T07:03:48 UTC) → [Etelä-Suomi (historiallinen alue)](https://fi.wikipedia.org/?oldid=24184095) (2026-08-18T07:09:05 UTC) → [Pohja-Suomen laamannikunta](https://fi.wikipedia.org/?oldid=24184128) (2026-08-18T07:20:47 UTC) → [Etelä-Suomen laamannikunta](https://fi.wikipedia.org/?oldid=24184149) (2026-08-18T07:27:56 UTC)

**9. 4 articles · `39D59C200556B9C7`**

Toisen maailmansodan aikana kylä oli miehitetty saksalaisjoukoilla. Inkeriläisiä oli viety vuosina 1943-1944 Viron kautta Suomeen. Sodan jälkeen osa niistä jäi Suomeen, jotkut pakenivat Ruotsiin. Neuvostoliittoon palanneet eivät vastoin lupauksia päässeet kotikylälle, vaan heidät karkotettiin eri puolille Venäjää..

[Savota (Järvisaari)](https://fi.wikipedia.org/?oldid=17107490) (2018-02-23T13:12:55 UTC) → [Korkka](https://fi.wikipedia.org/?oldid=17110065) (2018-02-24T16:08:26 UTC) → [Pitkäjärvi (Inkeri)](https://fi.wikipedia.org/?oldid=17115286) (2018-02-26T17:57:57 UTC) → [Muja (Inkeri)](https://fi.wikipedia.org/?oldid=19013002) (2020-06-29T13:13:39 UTC)

**10. 4 articles · `5B7B3BF97C327681`**

Toisen maailmansodan aikana kylä oli saksalaisjoukkojen miehittämä. Vuonna 1943 inkeriläisiä vietiin Viron kautta Suomeen. Sodan jälkeen osa heistä jäi Suomeen, jotkut pakenivat Ruotsiin. Neuvostoliittoon palanneet eivät vastoin lupauksia päässeet kotikyläänsä, vaan heidät karkotettiin eri puolille Venäjää.

[Luukkasi](https://fi.wikipedia.org/?oldid=22244908) (2024-03-08T11:05:50 UTC) → [Rönölä](https://fi.wikipedia.org/?oldid=22265318) (2024-03-17T14:06:07 UTC) → [Poru](https://fi.wikipedia.org/?oldid=23185223) (2025-04-21T09:26:18 UTC) → [Valasniekka](https://fi.wikipedia.org/?oldid=24240859) (2026-09-15T10:41:03 UTC)

**11. 4 articles · `FDA4AE5F4E1514FA`**

Nykyhetken kannalta keskeisin ongelma liittyy siihen, että Stasin tiedusteluasema koordinoi läheisesti toimintaansa Neuvostoliiton KGB:n kanssa. Näin ollen myös Venäjä saattaa kyetä edelleen käyttämään hyväksi itäsaksalaisten kautta muodostettuja riippuvuussuhteita.

[Osmo Kock](https://fi.wikipedia.org/?oldid=20420981) (2022-04-13T15:42:43 UTC) → [Ulf Sundqvist](https://fi.wikipedia.org/?oldid=20421001) (2022-04-13T15:51:59 UTC) → [Vappu Taipale](https://fi.wikipedia.org/?oldid=20421025) (2022-04-13T15:59:33 UTC) → [Arto Mansala](https://fi.wikipedia.org/?oldid=20421046) (2022-04-13T16:05:01 UTC)

**12. 4 articles · `EFE87464A796E9E1`**

Porvarissäädyn puhemies oli Anders Joachim Kurtén ja sihteeri Axel Valdemar Lindberg. Säädyn jäsenet olivat puhemies mukaan luettuna seuraavat:

[Säätyvaltiopäivät 1891](https://fi.wikipedia.org/?oldid=19660627) (2021-03-25T10:32:37 UTC) → [Säätyvaltiopäivät 1894](https://fi.wikipedia.org/?oldid=19660957) (2021-03-25T12:52:03 UTC) → [Säätyvaltiopäivät 1897](https://fi.wikipedia.org/?oldid=19661293) (2021-03-25T16:22:56 UTC) → [Säätyvaltiopäivät 1899](https://fi.wikipedia.org/?oldid=19661319) (2021-03-25T16:40:32 UTC)

**13. 3 articles · `B422501F92C80E2B`**

Oulun yliopiston kansanterveystieteen professori Jouni Jaakkola kritisoi THL:n lukuja. Hänen mukaansa tuhkarokossa laumasuojaan on tarvittu yli 90 prosentin rokotusaste, ja vaikka luku ei olisikaan koronaviruksessa yhtä suuri, se olisi todennäköisesti suurempi kuin THL:n pahin skenaario, jossa virukseen sairastuisi 60 prosenttia väestöstä. Jaakkolan mukaan 60 prosenttia oli alakanttiin vedetty ja liian optimistinen luku. Hän ei olisi jäänyt odottamaan laumaimmuniteetin muodostumista. Hänen mukaansa laskelmat laumasuojastrategian seurauksista ovat "aikamoisia". THL:n mukaan enintään 40 prosenttia kansasta saisi viruksen nykyisillä rajoitustoim

[Koronaviruspandemia Suomessa](https://fi.wikipedia.org/?oldid=18926690) (2020-05-15T12:30:33 UTC) → [Suomen toimenpiteet koronaviruspandemiaa vastaan](https://fi.wikipedia.org/?oldid=18936402) (2020-05-20T07:42:26 UTC) → [Suomen koronavirusstrategia](https://fi.wikipedia.org/?oldid=18996712) (2020-06-19T07:39:39 UTC)

**14. 3 articles · `E5604A609D32B713`**

Suomessa ei THL:n ohjeiden mukaan testata kaikkia koronavirusepäilyjä. Suomessa tehtiin joihinkin muihin maihin verrattuna melko vähän testejä. 15. maaliskuuta kriteerit testeihin tiukentuivat entisestään. Annettiin ohjeita, että terveyskeskuksiin ei pidä soittaa tartuntaepäilyn takia, eikä hakeutua koronavirustesteihin, mikäli pärjää oireiden kanssa kotona. 15.3. tiukat ohjeet johtivat siihen, että iso osa oireisista jäi kotiin niin, ettei tieto tartunnasta kantautunut viranomaisille. Runsas testaaminen, kontaktien jäljitys, sosiaalinen etäisyydenotto ja yhteisöjen aktivointi estää tartuntoja ja pelastaa henkiä. THL perusteli testaamisen väh

[Koronaviruspandemia Suomessa](https://fi.wikipedia.org/?oldid=18926690) (2020-05-15T12:30:33 UTC) → [Suomen toimenpiteet koronaviruspandemiaa vastaan](https://fi.wikipedia.org/?oldid=18936402) (2020-05-20T07:42:26 UTC) → [Suomen koronavirusstrategia](https://fi.wikipedia.org/?oldid=18996712) (2020-06-19T07:39:39 UTC)

**15. 3 articles · `E838FDD06BDE2C18`**

Maailman terveysjärjestö WHO:n mukaan ei riitä, että maat sulkevat kaiken. Ihmisten eristäytyminen hidastaa viruksen leviämistä ja antaa lisäaikaa, mutta tarvitaan enemmän toimenpiteitä. WHO:n mukaan viruksen voittaminen vaatii aggressiivisia ja kohdennettuja toimia. Jokainen epäilty koronatapaus olisi testattava ja jokainen tartunnan saanut asetettava karanteeniin, sekä jokainen mahdollisesti virukselle altistunut jäljitettävä. THL:n Mika Salminen ei ymmärtänyt WHO:n suositusta, koska Suomessa ei testata lieväoireisia, vaikka testauskapasiteettia jääkin yli. Britannian hallitus oli aikeissa antaa viruksen levitä väestöön ilman suuria rajoitu

[Koronaviruspandemia Suomessa](https://fi.wikipedia.org/?oldid=18926690) (2020-05-15T12:30:33 UTC) → [Suomen toimenpiteet koronaviruspandemiaa vastaan](https://fi.wikipedia.org/?oldid=18936402) (2020-05-20T07:42:26 UTC) → [Suomen koronavirusstrategia](https://fi.wikipedia.org/?oldid=18996712) (2020-06-19T07:39:39 UTC)

**16. 3 articles · `45B2AD1C470A4B2D`**

Kesäkuun 22 päivän aamulla ryhtyi Neuvostoliitto hyökkäykseen Suomen alueelle pommittaen ja tulittaen puhtaasti suomalaisia kohteita. Klo 6.05 aamulla sanottuna päivänä Neuvostoliiton ilmavoimat pommittivat suomalaisia panssarilaivoja Sottungan luona, klo 6.15 Alskärin linnaketta Turun saaristossa, klo 6.45 suomalaisia kuljetusaluksia Korppoon luona ja klo 7.55 Puna-armeijan tykistö avasi tulen Hangon vuokra-alueelta ampuen Porsöhön, Storholmaan ja mantereelle. Samana päivänä avattiin Hirsilammen luona, noin 14 km Imatran itäpuolella, Neuvostoliiton alueelta tuli suomalaisia rajavartioita kohden ja Pummangista Petsamossa ammuttiin useita kymm

[Jatkosodan hyökkäysvaihe](https://fi.wikipedia.org/?oldid=17468081) (2018-07-30T20:45:11 UTC) → [Suomen ja Saksan sotilasyhteistyö 1940–1941](https://fi.wikipedia.org/?oldid=17537081) (2018-08-29T08:55:06 UTC) → [Suomen ja Saksan lähentyminen 1940–1941](https://fi.wikipedia.org/?oldid=17545835) (2018-09-02T09:11:47 UTC)

**17. 3 articles · `00B71683D18C27FC`**

Valtion lainanotto Suomen pankista tarkoitti käytännössä sitä, että valtio otti kasvaneiden puolustusmenojensa rahoittamiseksi lainaa Suomen pankilta, joka taas painoi lisää rahaa menojen kattamiseksi. Kyseessä oli siis tyypillinen setelirahoitus, joka johti nopeasti inflaation kasvuun, joka ei kuitenkaan vielä talvisodan aikana johtanut merkittäviin ongelmiin. Vallitsevissa oloissa ei käytettävissä ollut muita rahapoliittisia keinoja sotatalouden rahoittamiseksi. Suomen valtio rahoitti sodankäyntiään myös muulla, kotimaisella lainanotolla. Suomen pankista ja yksityisiltä markkkinoilta otetuilla lainoilla kerättiin vuonna 1939 noin 800 miljoo

[Sotatalous Suomessa toisen maailmansodan aikana](https://fi.wikipedia.org/?oldid=10793701) (2011-10-13T19:13:20 UTC) → [Sotatalous Suomessa talvisodan aikana](https://fi.wikipedia.org/?oldid=10793706) (2011-10-13T19:14:26 UTC) → [Sotatalouden rahoittaminen Suomessa toisen maailmansodan aikana](https://fi.wikipedia.org/?oldid=10928689) (2011-11-17T18:35:45 UTC)

**18. 3 articles · `05EEB3B62E887B4D`**

Lestadiolaisuus sai jo vuonna 1847 paljon saamelaisia kannattajia myös Koutokeinossa Norjassa. Keväällä 1849 Laestadius muutti Kaaresuvannosta Pajalaan, joka oli paljon kauempana Koutokeinosta. Niinpä Koutokeinolaiset lestadiolaiset alkoivat sen jälkeen käydä kuuntelemassa juuri lestadiolaistuneen Muonion kirkkoherran J. F. Liljebladin saarnoja, koska Muonioon oli Koutokeinosta paljon lyhyempi matka kuin Pajalaan. Mutta jo talvella 1849-1850 alkoi Koutokeinon saamelaisten lestadiolaisten käytöksessä ja uskonelämässä näkyä huolestuttavia piirteitä, kuten hurmahenkisyyttä, röyhkeyttä ja agressiivisuutta. Ilmiötä esiintyi myös Kuttasen kylässä. 

[Lestadiolaisuus](https://fi.wikipedia.org/?oldid=12021833) (2012-08-21T20:40:38 UTC) → [Koutokeinon kansannousu](https://fi.wikipedia.org/?oldid=12021880) (2012-08-21T20:53:21 UTC) → [Koutokeinon hurmos](https://fi.wikipedia.org/?oldid=12021976) (2012-08-21T21:24:30 UTC)

**19. 3 articles · `CB96494B14AB4A6C`**

Lentoyhtiöt lennättivät epidemia-alueelta helmikuun 24. päivän jälkeen yli kahden viikon ajan tuhansia matkustajia eri puolille Suomea. Hallitus ei määrännyt lentoja keskeytettäväksi tai suositellut vapaaehtoista karanteenia. Sosiaali- ja terveysministeri Aino-Kaisa Pekonen tyynnytteli mielialoja hallituksen tiedotustilaisuudessa 27. helmikuuta sanomalla, että Suomessa ei ole epidemiaa. Helsingin yliopiston ekologian ja evoluutiobiologian tutkijatohtori Tuomas Aivelo olisi toivonut, että hallitus olisi kertonut tiedotustilaisuudessa, että Suomessa tulee esiintymään koronavirustapauksia ja viruksen leviämistä pyritään estämään erilaisin toimen

[Koronaviruspandemia Suomessa](https://fi.wikipedia.org/?oldid=18926690) (2020-05-15T12:30:33 UTC) → [Suomen toimenpiteet koronaviruspandemiaa vastaan](https://fi.wikipedia.org/?oldid=18936402) (2020-05-20T07:42:26 UTC) → [Suomen koronavirusstrategia](https://fi.wikipedia.org/?oldid=18996712) (2020-06-19T07:39:39 UTC)

**20. 3 articles · `112DE68249D63609`**

Äänisniemen, Syvärinlaakson ja Maanselänkannaksen väestöä, joka perinteisesti sattuu puhumaan venäjää, siirrettiin etulinjasta taemmaksi leireihin paitsi neuvostopartisaanien hyökkäysten ehkäisemiseksi myös siviilien itsensä suojelemiseksi. Äänisniemelle oli tätä paitsi pakkautunut ei-suomensukuista syntyperää olevia pakolaisia eri puolilta Karjalais-suomalaista sosialistista neuvostotasavaltaa; odottaessaan turhaan kuljetusta Äänisjärven ylitse he jäivät Suomen puolustusvoimien käsiin. Tutkimuskirjallisuuden perusteella voi arvioida, että rintamien läheltä evakuoituja taikka pakolaisia saattoi olla jopa 16.600 Itä-Karjalan leireihin sijoitet

[Jatkosota](https://fi.wikipedia.org/?oldid=5530321) (2008-09-25T15:59:05 UTC) → [Suur-Suomi](https://fi.wikipedia.org/?oldid=5530336) (2008-09-25T16:05:27 UTC) → [Itä-Karjalan keskitysleirit](https://fi.wikipedia.org/?oldid=5539982) (2008-09-26T20:26:22 UTC)

**21. 3 articles · `EED532A656816842`**

Keskiajan kaupungissa rakennukset olivat valtaosaltaan puuta, vaikka kivi- ja tiilitalojakin oli. Kadut olivat ahtaita ja tulipalot yleisiä. Keskiaikainen kaupunki oli keskittynyt suurin piirtein Tuomiokirkon, Kerttulinmäen ja Kaskenmäen väliselle alueelle Aurajoen eteläpuolelle. Joen pohjoispuolella keskiaikaista kaupunkiasutusta oli lähinnä Aninkaistenmäellä. Kaupungin asukasluku lienee keskiajalla noussut kahdentuhannen tienoille, mikä keskieurooppalaisella mittapuulla tarkoitti keskikokoista ja pohjoismaisella mittapuulla suurta kaupunkia. Useimmat Turun nykyisistä kaupunginosista olivat keskiajalla maalaiskyliä, jotka kuuluivat Kaarinan,

[Turun historia](https://fi.wikipedia.org/?oldid=3044387) (2007-06-20T22:30:01 UTC) → [Turku 1300-luvulla](https://fi.wikipedia.org/?oldid=7108488) (2009-07-31T02:42:39 UTC) → [Turku 1400-luvulla](https://fi.wikipedia.org/?oldid=7108521) (2009-07-31T03:07:20 UTC)

**22. 3 articles · `355F57AA05A8A845`**

THL:n johtaja Mika Salminen piti Italiassa epidemian puhjettua tehtyjä rajoituksia ja ylimitoitettuna, ja vähätteli niiden merkitystä, vaikka tilanne Euroopassa oli muuttunut. THL:n johdossa on vain yksi lääkäri, ja laitoksesta on irtisanottu lukuisia asiantuntijoita 2000-luvun aikana useissa yt-neuvotteluissa. Salmisen mukaan testejä ei tehty päivässä niin montaa kuin on mahdollista, vaan tarpeen mukaan. Siihenkään ei olla aina ylletty, sillä kaikkia karanteeniin ohjattuja terveydenhuollon työntekijöitä ei testattu, vaikka THL ja valtionjohto ovat painottaneet terveydenhuollon henkilökunnan testaamista matalla kynnyksellä. Terveydenhuollon t

[Koronaviruspandemia Suomessa](https://fi.wikipedia.org/?oldid=18926690) (2020-05-15T12:30:33 UTC) → [Suomen toimenpiteet koronaviruspandemiaa vastaan](https://fi.wikipedia.org/?oldid=18936402) (2020-05-20T07:42:26 UTC) → [Suomen koronavirusstrategia](https://fi.wikipedia.org/?oldid=18996712) (2020-06-19T07:39:39 UTC)

**23. 3 articles · `4B98ED9BCBC19C5C`**

Aslak Hættan johtama hurmahenkinen saamelaisryhmä oli ennen Koutokeinon murhatöitä selvästi erkaantunut Laestadiuksen opista ja myös lestadiolaisesta seurakuntayhteydestä omaksi uskonnolliseksi ryhmäkseen, jolla oli lähemmät suhteet kirkkoherra Liljebladiin kuin Laestadiukseen. Aslak Hætta oli jopa suunnitellut Lars Levi Laestadiuksen surmaamista, joka on yksi todiste siitä että hänen johtamansa lestadiolaissuuntaus oli erkaantunut muusta lestadiolaisuudesta erilliseksi hurmahenkiseksi lahkokseen, vaikka osa heistä arvostikin yhä Laestadiusta ja jopa vetosivat häneen oikeudenkäynnissä. Laestadius puolestaan syytti Koutokeinon ristiriidoista m

[Koutokeinon kansannousu](https://fi.wikipedia.org/?oldid=12021919) (2012-08-21T21:03:54 UTC) → [Lestadiolaisuus](https://fi.wikipedia.org/?oldid=12021925) (2012-08-21T21:05:03 UTC) → [Koutokeinon hurmos](https://fi.wikipedia.org/?oldid=12021976) (2012-08-21T21:24:30 UTC)

**24. 3 articles · `3BB8B6A539444B84`**

Viikinkien magiaa harjoittivat pohjanmiesten kulttuurissa ennustajat, joita kutsuttiin myös riimumestareiksi, maagikot ja berserkit (maagiset soturit). Riimuilla ennustaminen tapahtui seuraavasti: muutama kivi johon oli kaiverrettu riimuja nostettiin sattumanvaraisesti säkistä, ja järjestettiin kuvioon josta ilmeni menneisyys, nykyaika ja tulevaisuus. Kuvion tulkintaa käytettiin silloin apuna päätöksenteossa. Viikingit kunnioittivat syvästi oppineita riimumestareita, ja heidän uskottiin olevan Odinin verisukulaisia. Riimumestarin perinteisen asusteen kerrotaan olleen sininen viitta ja messinkikärkinen puusauva, Odinin viitan ja sauvan mukaan.

[Riimukirjoitus](https://fi.wikipedia.org/?oldid=390972) (2005-08-26T12:46:52 UTC) → [Viikingit](https://fi.wikipedia.org/?oldid=432019) (2005-09-19T22:36:58 UTC) → [Skandinaavinen muinaisusko](https://fi.wikipedia.org/?oldid=437051) (2005-09-22T22:18:21 UTC)

**25. 3 articles · `D75FA1BE85F1AC08`**

Suomi katkaisi suhteensa Saksaan 2. syyskuuta 1944. Neuvostoliiton kanssa tehtävän rauhansopimuksen ennakkoehdot edellyttivät suomalaisten vaativan saksalaisjoukkojen poistumista maasta 15. syyskuuta mennessä. Pohjois-Suomen rintamaosuutta hoitanut 200 000 miehen vahvuinen saksalainen 20. Vuoristoarmeijakunta lähti ennalta laaditun suunnitelman, Operaatio Birken mukaisesti vetäytymään pohjoiseen uusiin puolustusasemiin heti syyskuun alussa. Uudet asemat oli linnoitettu valmiiksi Karesuvanto-Ivalo -linjalle eteläisemmästä Suomesta kohdistuvaa hyökkäystä vastaan. Asemat turvasivat idässä Petsamon nikkelituotannon saksalaisille, ja toisaalta suo

[Pudasjärven välikohtaus](https://fi.wikipedia.org/?oldid=4536992) (2008-03-27T13:20:59 UTC) → [Olhavan taistelu](https://fi.wikipedia.org/?oldid=4556096) (2008-03-30T21:39:24 UTC) → [Tornion kaappaus](https://fi.wikipedia.org/?oldid=8310237) (2010-04-11T05:15:33 UTC)

**26. 3 articles · `CAB0430E5040DA55`**

Ampumatarvikkeissa käsiaseiden ammusten tuotantomäärät olivat merkittäviä, mutta suurikaliberisempien aseiden ammusten tuotanto ei missään vaiheessa vastannut edes kulutusta. Suurimmat tuotannon ongelmat kohdistuivat etenkin tykistön ampumatarvikkeiden valmistukseen. Hankalimmiksi osoittautuivat mm. tykistön hylsyjen, sytyttimien ja ns. pohjanallien valmistus. Kriittisimmillään esim. kranaatinheittimien ammusten valmistuskapasiteettia ei pystytty juurikaan käyttämään hyväksi, koska sytyttimien valmistus laahasi pahasti jäljessä. Sodan loppuvaiheissa pystyttiin valmistamaan noin 6 000 heittimen kranaattia vuorokaudessa, mutta sytyttimiä valmis

[Sotatalous Suomessa toisen maailmansodan aikana](https://fi.wikipedia.org/?oldid=10764810) (2011-10-07T12:42:28 UTC) → [Sotatalous Suomessa talvisodan aikana](https://fi.wikipedia.org/?oldid=10785732) (2011-10-11T16:37:54 UTC) → [Suomen sotatarvikehankinnat talvisodan aikana](https://fi.wikipedia.org/?oldid=10785736) (2011-10-11T16:39:34 UTC)

**27. 3 articles · `207D5E795A918F62`**

Saamelaisilla yleisesti Koutokeinossa oli tuohon aikaan vaikeat olot. Mainittakoon parina esimerkkinä että Venäjä lakkautti syksyllä 1852Norjan saamelaisten oikeudet talvilaiduntamiseen ja kalastukseen Suomen puolella, ja Norjassakin jokien varteen muuttaneet talonpojat estivät saamelaisia kalastamasta Jäämereen laskevien jokien parhailla kalapaikoilla. Tuollainen muiden etnisten ryhmien ja viranomaistenkin syrjivä ja ankara toiminta Norjan saamelaisia kohtaan oli omiaan herättämään ja provosoimaan Koutokeinon saamelaisissa hurmahenkisyyttä ja agressiota. Lisäksi porvarien ja talonpoikien harjoittama vastuuton viinakauppa tuotti paljon ongelm

[Lestadiolaisuus](https://fi.wikipedia.org/?oldid=12021842) (2012-08-21T20:43:59 UTC) → [Koutokeinon kansannousu](https://fi.wikipedia.org/?oldid=12021880) (2012-08-21T20:53:21 UTC) → [Koutokeinon hurmos](https://fi.wikipedia.org/?oldid=12021976) (2012-08-21T21:24:30 UTC)

**28. 3 articles · `0750FD5747D9421E`**

Kaupunki oli pitkään Suomen merkittävin myös kaupankäynnin saralla. Se lukeutui keskiajalla Hansaliiton kaupan ja merenkulun piiriin. 1300-luvulla kaksi kolmasosaa kaupungin porvareista oli saksalaisia , mutta vähitellen kotimaisten porvarien osuus kasvoi. Kauppiailla oli useita yhteisöjä, kiltoja, joiden kiltataloissa juhlinta saattoi yltyä varsin riehakkaaksi. Vilkkaat kauppasuhteet kohdistuivat etenkin Tukholmaan ja Tallinnaan, mutta myös Pohjanmaalle, Novgorodiin ja Itämeren etelärannikon suurin hansakaupunkeihin. Hämeeseen kulki Turusta tunnettu maantie, Hämeen Härkätie. Viipuriin vei Suuri Rantatie, joka sittemmin tunnettiin Kuninkaanti

[Turun historia](https://fi.wikipedia.org/?oldid=6934563) (2009-06-24T20:47:03 UTC) → [Turku 1300-luvulla](https://fi.wikipedia.org/?oldid=7108488) (2009-07-31T02:42:39 UTC) → [Turku 1400-luvulla](https://fi.wikipedia.org/?oldid=7108521) (2009-07-31T03:07:20 UTC)

**29. 3 articles · `F2DC727B22346779`**

Helsingin yliopiston zoonoosivirologian professori Olli Vapalahden mukaan virus pitäisi pyrkiä tukahduttamaan kaikin keinoin sen sijaan, että virusta yritettäisiin vain hidastaa. Etelä-Koreassa, Singaporessa, Taiwanissa, Japanissa ja Kiinassa on ollut ajattelutapa, että virus tukahdutetaan, eikä sen anneta levitä hiljalleen väestöön. Sen jälkeen massiivisella testaamisella ja tartuntaketjujen jäljittämisellä, sekä kohdennetuilla karanteeneilla huolehditaan siitä, ettei se enää palaa väestöön, kunnes rokote saadaan kehitettyä. Vapaalahden mukaan Suomi heräsi tilanteeseen paljon hitaammin kuin Kaakkois- ja Itä-Aasian maat.

[Koronaviruspandemia Suomessa](https://fi.wikipedia.org/?oldid=18926690) (2020-05-15T12:30:33 UTC) → [Suomen toimenpiteet koronaviruspandemiaa vastaan](https://fi.wikipedia.org/?oldid=18936402) (2020-05-20T07:42:26 UTC) → [Suomen koronavirusstrategia](https://fi.wikipedia.org/?oldid=18996712) (2020-06-19T07:39:39 UTC)

**30. 3 articles · `9FD4923B72E8E4E3`**

Suomen valtion aloitettua sodankäynnin rahoittamisen lainaamalla rahaa keskuspankiltaan eli Suomen Pankilta oli sen seurauksena nopeasti kiihtynyt hintojen nousu eli inflaatio. Jo välirauhan aikana työtätekevän kansanosan palkkoja oli vastaavasti nostettava, jotta tyytymättömyys elintason laskuun ei olisi aiheuttanut levottomuutta. Kyseessä oli siis tyypillinen ns. setelirahoituksen aikaansaama kierre, jossa hintojen nousua seurasi palkkojen nousu, joka taas nosti hintoja entisestään. Sodan rahoittamiseen ei toisaalta ollut juuri muita mahdollisuuksia, joten kyse oli ns. välttämättömyyden pakosta.

[Sotatalouden rahoittaminen Suomessa toisen maailmansodan aikana](https://fi.wikipedia.org/?oldid=10938559) (2011-11-20T16:15:31 UTC) → [Sotatalous Suomessa toisen maailmansodan aikana](https://fi.wikipedia.org/?oldid=10938575) (2011-11-20T16:21:01 UTC) → [Sotatalous Suomessa välirauhan aikana](https://fi.wikipedia.org/?oldid=10938583) (2011-11-20T16:23:10 UTC)

## How it was measured

Run sequentially from the repository root (no parallel execution):

```sh
uv run labs/sentence-journeys/run.py
uv run labs/sentence-journeys/extra.py
uv run labs/sentence-journeys/validate.py
uv run labs/sentence-journeys/report.py
```

Only `lab_sentence_journeys` is written. One connection per script, using the supplied local root credential to access the lab database. All source tables are read-only. No commits. The scripts regenerate their SQL files and chart JSON. `run.py --reports` reruns reports without rebuilding derived tables. Rerunning against changed core data changes results. Timings are local wall-clock observations under shared load, not a benchmark.

1. **Headline unit:** distinct eight-byte hash with `passage_text.kind='prose' AND chars>=120` and at least one recorded passage row. Characters use the supplied column; clean text, raw markup and character counts are not interchangeable. No inference of originality or copying intent. No near-match or sentence-level reuse included in these headline counts.
2. **Time:** UTC, half-open `[row_start,row_end)` lifetimes. Running maximum preceding end, then cumulative island grouping, merges touching/overlapping rows of `(page_id,hash,dup)`. A second union across duplicates measures presence anywhere in the page. This avoids falsely treating reorderings or disappearance of one duplicate as paragraph death. Ends beyond 2100 are the system-versioning sentinel, not observed survival into the future. The administrative cutoff is the maximum edit timestamp, **2026-10-01 10:59:12 UTC**.
3. **Firsts:** one earliest presence per hash/article. The earliest two articles define delay and paired survival. Stable page-ID ordering would break simultaneous timestamps, but no first/second ties occur. Paths list first observations, not every reintroduction. The earliest interval’s `born_rev` links the edit that introduced the hash. Titles are current, not historical.
4. **Transfer events:** for each destination’s first appearance of a shared hash, find every distinct earlier article whose presence began strictly earlier and ended no earlier than one hour before arrival. Group by source, destination and destination revision; require five distinct hashes. This requires no row-by-row SQL. Five reduces coincidental repeated sentences while still finding modest section transfers. Arrivals must be in the same revision, a stricter requirement than a one-hour arrival cluster. Events are candidates: several earlier sources can qualify. No claim is made that every bulk copy is a split or every move a merge. Source disappearance is local to the selected lifetime, not permanent deletion; reintroductions are allowed.
5. **Comments:** case-insensitive regex `siirr|siirt|yhdist|kopio|jaett|jakami|eriyt|split|merg|mov|cop` on destination introduction and matching source removal edits. This counts lexical corroboration, not manually certified intent. False positives and missed synonyms remain; absence of a matching comment is not disproof. Editor identifiers report metadata and are not authorship assignments.
6. **Birth:** first saved timestamp in the available edit table. Count qualifying hashes present then whose global-within-sample first time is strictly earlier. Five-hash birth counts may include more than one earlier article. Historical imports, deleted revisions and missing out-of-sample pages can alter interpretation.
7. **Survival:** first/second pairs only; exclude source already absent at destination arrival. Compare the uninterrupted presence interval containing that arrival with the destination’s first interval. Both censored pairs are unresolved; one censored and one ended pair is already orderable. No lifespan means or Kaplan–Meier estimate is claimed. One-year survival uses the same origin and excludes arrivals less than 365 days before cutoff. A wording change, including markup-only change, ends exact-hash survival. Pair observations are dependent within editing campaigns.
8. **Sentences:** Python splits every distinct prose clean text after `. ! ?` followed by whitespace and an uppercase Latin/Finnish letter; whitespace is collapsed, case retained. Keep terminal-punctuation spans of 40–1,000 characters. SHA-1 identifies these extracted strings. SQL joins the sentence map to distinct `(hash,page_id)` history pairs and counts distinct articles. This avoids counting repeated revisions as spread. Finnish abbreviations and quotations can mis-segment; these are explicitly sentence-like spans. Short lines, list items and template expansions are separate, so this is not a comprehensive linguistic sentence census.
9. **Validation:** `validate.py` independently unions all raw intervals for shared wordings in Python and compares every resulting page interval with SQL; direct current-table aggregation checks the current shared count. Integrity checks cover negative/zero durations, missing born revisions, birth timestamp/page mismatches and negative delays. Results are in [validation.json](data/validation.json), [integrity.json](data/integrity.json), and [edge-audit.json](data/edge-audit.json). No source data were repaired.

Threshold sensitivity (same event definition):

| Minimum paragraphs | Events |
|---|---|
| 3 | 151 |
| 5 | 85 |
| 10 | 34 |

Removal-window sensitivity among baseline candidate edges (does not add sources removed more than one hour before arrival):

| Removal window, hours | Events with ≥5 removals |
|---|---|
| 1 | 57 |
| 24 | 59 |
| 168 | 62 |

## The exact SQL

Every statement is saved verbatim in [sql/](sql/); the complete execution sequence and timings are in [timings.json](data/timings.json). The primary analytical method is MariaDB: temporal history scans, window-function interval unions, distinct-article counts, `PERCENTILE_CONT`, temporal joins and grouped event detection. Python orchestrates SQL, segments text, checks interval unions and renders this report. Parameterized sentence inserts are generated by the reproducible `extra.py` mapping, with batch timing recorded separately.

Core SQL examples (full executable statements in linked files):

[raw.sql](sql/raw.sql)

```sql
CREATE TABLE raw AS SELECT p.page_id,p.hash,p.dup,p.born_rev,p.row_start s,p.row_end e
 FROM wtt.passage FOR SYSTEM_TIME ALL p JOIN wtt.passage_text t ON t.hash=p.hash WHERE t.kind='prose' AND t.chars>=120;
```

[lifetimes.sql](sql/lifetimes.sql)

```sql
CREATE TABLE lifetimes AS
 WITH previous AS (SELECT *,MAX(e) OVER(PARTITION BY page_id,hash,dup ORDER BY s,e ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) prior_end FROM raw),
 groups AS (SELECT *,SUM(prior_end IS NULL OR s>prior_end) OVER(PARTITION BY page_id,hash,dup ORDER BY s,e) g FROM previous)
 SELECT page_id,hash,dup,g,MIN(s) s,MAX(e) e,SUBSTRING_INDEX(GROUP_CONCAT(born_rev ORDER BY s,e),',',1)+0 born_rev FROM groups GROUP BY page_id,hash,dup,g;
```

[presence.sql](sql/presence.sql)

```sql
CREATE TABLE presence AS
 WITH previous AS (SELECT *,MAX(e) OVER(PARTITION BY page_id,hash ORDER BY s,e,dup ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) prior_end FROM lifetimes),
 groups AS (SELECT *,SUM(prior_end IS NULL OR s>prior_end) OVER(PARTITION BY page_id,hash ORDER BY s,e,dup) island FROM previous)
 SELECT page_id,hash,island,MIN(s) s,MAX(e) e,SUBSTRING_INDEX(GROUP_CONCAT(born_rev ORDER BY s,e,dup),',',1)+0 born_rev FROM groups GROUP BY page_id,hash,island;
```

[pairs.sql](sql/pairs.sql)

```sql
CREATE TABLE pairs AS SELECT a.hash,a.page_id src,b.page_id dst,a.first_at src_at,b.first_at dst_at,a.born_rev src_rev,b.born_rev dst_rev,TIMESTAMPDIFF(SECOND,a.first_at,b.first_at) delay_seconds FROM ranked a JOIN ranked b ON a.hash=b.hash AND a.pos=1 AND b.pos=2;
```

[delay-distribution.sql](sql/delay-distribution.sql)

```sql
SELECT DISTINCT COUNT(*) OVER() n,PERCENTILE_CONT(.25) WITHIN GROUP(ORDER BY delay_seconds) OVER() q25_seconds,PERCENTILE_CONT(.5) WITHIN GROUP(ORDER BY delay_seconds) OVER() median_seconds,PERCENTILE_CONT(.75) WITHIN GROUP(ORDER BY delay_seconds) OVER() q75_seconds,AVG(delay_seconds<=3600) OVER() within_hour,AVG(delay_seconds<=86400) OVER() within_day,AVG(delay_seconds<=31536000) OVER() within_year,SUM(delay_seconds=0) OVER() tied_first FROM pairs;
```

[edges.sql](sql/edges.sql)

```sql
CREATE TABLE edges AS SELECT d.hash,s.page_id src,d.page_id dst,d.first_at at,d.born_rev dst_rev,MAX(s.e) src_end,
 MAX(s.e>d.first_at) overlaps, (ABS(TIMESTAMPDIFF(SECOND,MAX(s.e),d.first_at))<=3600) near_removal
 FROM ranked d JOIN presence s ON s.hash=d.hash AND s.page_id<>d.page_id AND s.s<d.first_at AND s.e>=d.first_at-INTERVAL 1 HOUR
 GROUP BY d.hash,s.page_id,d.page_id,d.first_at,d.born_rev;
```

[events.sql](sql/events.sql)

```sql
CREATE TABLE events AS SELECT src,dst,at,dst_rev,COUNT(*) paragraphs,SUM(near_removal) moved,SUM(NOT near_removal AND overlaps) retained FROM edges GROUP BY src,dst,at,dst_rev HAVING COUNT(*)>=5;
```

[survival.sql](sql/survival.sql)

```sql
WITH x AS (SELECT p.*,s.e source_end,d.e destination_end FROM pairs p JOIN presence s ON s.hash=p.hash AND s.page_id=p.src AND s.s<=p.dst_at AND s.e>p.dst_at JOIN presence d ON d.hash=p.hash AND d.page_id=p.dst AND d.s=p.dst_at WHERE p.delay_seconds>0)
 SELECT COUNT(*) overlapping_first_second,SUM(source_end>='2100-01-01' AND destination_end>='2100-01-01') both_censored,SUM(source_end<destination_end) destination_outlives,SUM(destination_end<source_end) source_outlives,SUM(source_end=destination_end AND source_end<'2100-01-01') same_end,
 SUM(source_end<'2100-01-01' AND destination_end<'2100-01-01') both_ended,
 SUM(dst_at<=(SELECT MAX(saved_at) FROM wtt.edit)-INTERVAL 365 DAY) eligible_year,
 SUM(dst_at<=(SELECT MAX(saved_at) FROM wtt.edit)-INTERVAL 365 DAY AND source_end>=dst_at+INTERVAL 365 DAY) source_survives_year,
 SUM(dst_at<=(SELECT MAX(saved_at) FROM wtt.edit)-INTERVAL 365 DAY AND destination_end>=dst_at+INTERVAL 365 DAY) destination_survives_year FROM x;
```

[sentence-counts.sql](sql/sentence-counts.sql)

```sql
CREATE TABLE sentence_counts AS SELECT s.sentence_hash,COUNT(DISTINCT p.page_id) articles FROM sentence_map s JOIN hash_pages p ON p.hash=s.hash GROUP BY s.sentence_hash;
```

| Statement (last execution) | Seconds | Returned rows |
|---|---|---|
| [titles](sql/titles.sql) | 0.3042 | 0 |
| [titles-index](sql/titles-index.sql) | 0.0845 | 0 |
| [page-birth](sql/page-birth.sql) | 0.4376 | 0 |
| [raw](sql/raw.sql) | 13.2396 | 0 |
| [raw-index](sql/raw-index.sql) | 0.9264 | 0 |
| [lifetimes](sql/lifetimes.sql) | 8.4247 | 0 |
| [presence](sql/presence.sql) | 8.317 | 0 |
| [presence-index](sql/presence-index.sql) | 1.249 | 0 |
| [firsts](sql/firsts.sql) | 1.4033 | 0 |
| [firsts-index](sql/firsts-index.sql) | 1.1066 | 0 |
| [spread](sql/spread.sql) | 1.3655 | 0 |
| [spread-index](sql/spread-index.sql) | 0.7649 | 0 |
| [ranked](sql/ranked.sql) | 0.4671 | 0 |
| [ranked-index](sql/ranked-index.sql) | 0.0239 | 0 |
| [pairs](sql/pairs.sql) | 0.0251 | 0 |
| [edges](sql/edges.sql) | 0.0425 | 0 |
| [events](sql/events.sql) | 0.0043 | 0 |
| [all-spread](sql/all-spread.sql) | 2.8161 | 0 |
| [summary](sql/summary.sql) | 1.2692 | 1 |
| [spread-distribution](sql/spread-distribution.sql) | 0.0928 | 11 |
| [delay-distribution](sql/delay-distribution.sql) | 0.0102 | 1 |
| [delay-bins](sql/delay-bins.sql) | 0.0019 | 4 |
| [journey-candidates](sql/journey-candidates.sql) | 0.0858 | 100 |
| [splits-and-merges](sql/splits-and-merges.sql) | 0.0162 | 30 |
| [event-summary](sql/event-summary.sql) | 0.0266 | 1 |
| [birth-summary](sql/birth-summary.sql) | 1.6669 | 1 |
| [survival](sql/survival.sql) | 0.0253 | 1 |
| [boilerplate](sql/boilerplate.sql) | 8.4291 | 40 |
| [integrity](sql/integrity.sql) | 2.4122 | 1 |
| [journey-paths](sql/journey-paths.sql) | 0.0052 | 123 |
| [removals](sql/removals.sql) | 0.0142 | 0 |
| [removal-details](sql/removal-details.sql) | 0.0008 | 68 |
| [corroboration](sql/corroboration.sql) | 0.0018 | 1 |
| [threshold-sensitivity](sql/threshold-sensitivity.sql) | 0.0014 | 3 |
| [sentence-map-schema](sql/sentence-map-schema.sql) | 0.0047 | 0 |
| [sentence-text-schema](sql/sentence-text-schema.sql) | 0.0046 | 0 |
| [sentence-input](sql/sentence-input.sql) | 11.1252 | 848430 |
| sentence-mapping-python-and-inserts | 33.8669 | 2908082 |
| [hash-pages](sql/hash-pages.sql) | 12.4345 | 0 |
| [hash-pages-index](sql/hash-pages-index.sql) | 0.7558 | 0 |
| [sentence-counts](sql/sentence-counts.sql) | 10.3949 | 0 |
| [boilerplate-sentences](sql/boilerplate-sentences.sql) | 4.1233 | 40 |
| [validate-raw](sql/validate-raw.sql) | 0.702 | 5028 |
| [validate-presence](sql/validate-presence.sql) | 0.5681 | 4499 |
| [validate-current](sql/validate-current.sql) | 1.1999 | 1 |
| [edge-audit](sql/edge-audit.sql) | 0.001 | 1 |
| [same-reading-text](sql/same-reading-text.sql) | 0.0448 | 1 |
| [evacuation-reading-text](sql/evacuation-reading-text.sql) | 0.5065 | 1 |
| [event-concentration](sql/event-concentration.sql) | 0.0055 | 1 |
| [list-scale](sql/list-scale.sql) | 0.7754 | 1 |
| [window-sensitivity](sql/window-sensitivity.sql) | 0.0123 | 178 |
| [repair-use](sql/repair-use.sql) | 0.0003 | 0 |
| [repair-drop-events](sql/repair-drop-events.sql) | 0.0048 | 0 |
| [repair-drop-edges](sql/repair-drop-edges.sql) | 0.0013 | 0 |

## What did not work

- Validation caught three source edges with a near-removal followed by a qualifying reintroduction. Move classification now uses the latest qualifying source interval end; the final edge audit has zero such inconsistencies.
- The premise of long exact paragraphs spreading to hundreds of articles is not supported here. Short decorations and bibliography entries spread far more widely. A short-list or empty-clean-text leaderboard would misrepresent paragraph journeys.
- `kind='prose'` includes table debris, navigation, repeated noise and empty cleaned strings. The requested length filter removes empty strings but not all artifacts. Only the displayed top thirty are screened; headline population is reproducible and unfiltered beyond the specified definition.
- Hash identity is stricter than reading-text identity. Equal cleaned paragraphs can have different hashes because underlying wikitext differs. The lab does not silently collapse these identities; sentence analysis is explicitly separate.
- MariaDB became unavailable after the main analyses. Docker reported `OOMKilled=true`, exit 137, at 2026-11-14 11:53:10 UTC. The existing container was restarted; crash recovery finished and the independent validation pass then completed. The cause cannot be assigned to one job on this shared laptop.
- The first birth-summary query used large unindexed joins and was cancelled after roughly 27 seconds while running. It was replaced by a small join of the shared-hash ranked table (the saved `birth-summary.sql`). Its interrupted run has no completed timing. All completed statements are recorded.
- Chronology cannot determine which of several earlier articles supplied a copy, distinguish independent use of a common source, or detect paraphrase. A move within an hour is a temporal signal; retained text can be removed later. Imported history and missing articles are unobserved.
- Full-history ranks pool differently aged articles. Current-row counts describe the recorded endpoint, not live Wikipedia today. The cutoff censors survival; historical identifiers and current titles need not reflect current account names or titles at the event.

## What the product should do with it

Show an **“Observed text journey”** with a chronological path of article titles, first-seen dates, revision links and lifetime bars. Label it “first observed in this collection.” Expose hash identity versus reading-text identity and explicitly mark right-censored bars. Show the source and destination together from the arrival time, including later reintroductions.

Offer a **bulk-transfer explorer** ranked by qualifying paragraph count, with the one-hour/five-paragraph thresholds visible, moved and retained counts, both sides’ comments and revision links. Call entries candidates until a reader inspects the history. Highlight the Sortovuodet split as a clear comment-supported example. Allow thresholds to change without implying that a copy establishes authorship.

Keep boilerplate and parser artifacts in separate views. Default the journey gallery to the screened substantive examples, while preserving raw counts and exclusions for audit. Never label an editor a plagiarist from this evidence. Charts can consume the six requested JSON objects plus sentence, survival and validation supplements directly.
