-- Lifespan topics: how many agree everywhere, how many disagree on a birth or a death.
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
) AS per_topic
