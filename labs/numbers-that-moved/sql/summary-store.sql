CREATE TABLE IF NOT EXISTS summary (metric VARCHAR(100) PRIMARY KEY, value BIGINT NOT NULL);
DELETE FROM summary;
INSERT INTO summary (metric,value) VALUES (%s,%s);
