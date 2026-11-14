-- undone_by marks every version that sits between a revert and the text it
-- restored. That is exact, and useless as a vandalism filter: on a page
-- vandalised often, the same vandal text returns again and again, each
-- return "restores" the last one, and 96 % of an article's versions end up
-- marked. reverted_by is the careful reading: the version was removed
-- within thirty days by a revert that itself stood.
ALTER TABLE edit ADD COLUMN IF NOT EXISTS reverted_by INT UNSIGNED AFTER undone_by;
