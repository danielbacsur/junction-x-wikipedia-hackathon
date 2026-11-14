SELECT publication_year-written_year year_gap,COUNT(*) references_n FROM citation_dates WHERE publication_year IS NOT NULL GROUP BY year_gap ORDER BY year_gap;
