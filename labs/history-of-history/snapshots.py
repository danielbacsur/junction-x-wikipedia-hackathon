"""The 23 snapshot dates every script in this lab uses (UTC)."""

SNAPSHOTS = [f"{y}-12-31 23:59:59" for y in range(2004, 2026)] + ["2026-10-01 23:59:59"]
DB = dict(host="127.0.0.1", port=3310, user="wtt", password="wtt", database="wtt", charset="utf8mb4", autocommit=True)

# Part 3: the words counted by term-shares.sql, as (column, pattern)
TERMS = {"neuvostoliitto": "neuvostoliit", "venaja": "venäjä", "ruotsi": "ruotsi", "saksa": "saksa", "nato": "[^a-zåäö]nato",
         "suomettuminen": "suomettu", "talvisota": "talviso[dt]", "jatkosota": "jatkoso[dt]",
         "saamelainen": "saamelai", "lappalainen": "lappalai"}
