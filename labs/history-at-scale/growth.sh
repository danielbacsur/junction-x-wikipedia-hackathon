#!/bin/sh
# Grows p_flat to two and four times its rows and times the hot statements
# at every size. Needs p_flat from `uv run build.py create flat`.
# One statement at a time; build.py waits while the container is above 6.5 GiB.
set -e
cd "$(dirname "$0")"
L=lab_history_at_scale
SQL="docker exec -i wikipedia-through-time-mariadb-1 mariadb -uroot -pwtt -t $L"

# the two indexes that carry both ends of the period, added to the flat copy
$SQL -e "SET @t = NOW(6);
  ALTER TABLE p_flat ADD KEY ps (page_id, row_start), ADD KEY per (page_id, row_end, row_start);
  SELECT TIMESTAMPDIFF(MICROSECOND, @t, NOW(6)) / 1e6 AS add_two_keys_seconds_1x;
  ANALYZE TABLE p_flat;" > data/raw/growth-add-keys.out 2>&1

bench() {
  uv run bench.py growth-$1x \
    "primary=$L.p_flat@IGNORE INDEX (ps, per)" \
    "ps=$L.p_flat@FORCE INDEX (ps)" \
    "per=$L.p_flat@FORCE INDEX (per)" \
    --only=blocks,diff > data/raw/growth-$1x.log 2>&1
  uv run bench.py growth-$1x-other \
    "primary=$L.p_flat@IGNORE INDEX (ps, per)" \
    --only=wording,search,global > data/raw/growth-$1x-other.log 2>&1
}

bench 1
uv run build.py grow flat 1 >> data/raw/build.out 2>&1
bench 2
uv run build.py grow flat 2 3 >> data/raw/build.out 2>&1
bench 4
uv run build.py sizes >> data/raw/build.out 2>&1
