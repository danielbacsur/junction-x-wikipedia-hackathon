SELECT SUM(written<='2021-10-01') years5,SUM(written<='2016-10-01') years10,SUM(written<='2011-10-01') years15 FROM facts WHERE NOT has_ref AND referenced IS NULL;
