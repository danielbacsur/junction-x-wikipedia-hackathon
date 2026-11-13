-- The current text of every article: all of Finnish Wikipedia, plus the
-- Swedish and English articles on the history of Finland.
CREATE TABLE IF NOT EXISTS article (
  lang          CHAR(2)      NOT NULL,           -- fi, sv, en
  page_id       INT UNSIGNED NOT NULL,           -- wikipedia's own id, per language
  rev_id        INT UNSIGNED NOT NULL,           -- the version this text is
  wikidata_id   VARCHAR(20),                     -- same topic across languages
  title         VARCHAR(255) NOT NULL,
  url           VARCHAR(500) NOT NULL,
  date_modified DATETIME,
  history       BOOL         NOT NULL DEFAULT 0, -- in the history of finland set
  text          MEDIUMTEXT   NOT NULL,           -- clean markdown from finewiki
  PRIMARY KEY (lang, page_id),
  KEY (wikidata_id),
  KEY (history, lang),
  FULLTEXT (title, text)
);

-- One vector per article, in its own table: a vector index needs NOT NULL,
-- so a row here also means "this article is embedded".
CREATE TABLE IF NOT EXISTS article_vector (
  lang      CHAR(2)      NOT NULL,
  page_id   INT UNSIGNED NOT NULL,
  model     VARCHAR(50)  NOT NULL,
  truncated BOOL         NOT NULL,
  embedding VECTOR(1024) NOT NULL,
  PRIMARY KEY (lang, page_id),
  VECTOR INDEX (embedding) M=16 DISTANCE=cosine
);

-- The finnish category tree as parent and child pairs, walked recursively.
CREATE TABLE IF NOT EXISTS category_link (
  parent VARCHAR(255) NOT NULL,
  child  VARCHAR(255) NOT NULL,
  PRIMARY KEY (parent, child),
  KEY (child)
);

CREATE TABLE IF NOT EXISTS article_category (
  page_id  INT UNSIGNED NOT NULL,                -- the finnish article
  category VARCHAR(255) NOT NULL,
  PRIMARY KEY (page_id, category),
  KEY (category)
);
