SELECT articles,COUNT(*) wordings,SUM(current_articles>=2) currently_shared FROM spread GROUP BY articles ORDER BY articles;
