-- People look for an article by its name. A full-text index over titles
-- alone is small, so a search with prefixes over all 568,416 articles
-- answers in milliseconds, where the same search over every article's
-- whole text took seconds.
ALTER TABLE article ADD FULLTEXT IF NOT EXISTS title_words (title);
