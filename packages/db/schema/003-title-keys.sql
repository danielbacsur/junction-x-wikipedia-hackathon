-- People arrive with a title, not a page id. Without these keys a title
-- lookup read every version of every article: 15 seconds instead of one
-- millisecond.
ALTER TABLE article ADD KEY IF NOT EXISTS (lang, title);

-- Changing a versioned table is refused unless told to keep its history.
SET system_versioning_alter_history = KEEP;
ALTER TABLE revision ADD KEY IF NOT EXISTS (title);
