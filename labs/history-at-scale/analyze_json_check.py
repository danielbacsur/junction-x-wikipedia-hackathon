# /// script
# requires-python = ">=3.11,<3.15"
# dependencies = ["pymysql==1.1.2"]
# ///
"""ANALYZE FORMAT=JSON with a binary value in a condition, parsed strictly.

  uv run analyze_json_check.py

The driver sends the BINARY(8) parameter as an escaped string literal. The
server prints it back inside "attached_condition" as raw bytes.
"""
import json

import pymysql

connection = pymysql.connect(host="127.0.0.1", port=3310, user="wtt", password="wtt",
                             database="wtt", autocommit=True)
cursor = connection.cursor()
cursor.execute(
    """ANALYZE FORMAT=JSON
       SELECT row_start, row_end, born_rev, slot
       FROM passage FOR SYSTEM_TIME ALL
       WHERE page_id = %s AND hash = %s
       ORDER BY row_start""",
    (1187, bytes.fromhex("FE1308E858615956")))
text = cursor.fetchall()[0][0]
try:
    json.loads(text)
    print("valid JSON")
except json.JSONDecodeError as error:
    print("not valid JSON:", error)
    at = error.pos
    print("around the error:", repr(text[max(0, at - 60):at + 20]))
