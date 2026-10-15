"""Apply supabase/migrations/*.sql (sorted) and seed.sql to a hosted Supabase project.

Reads the connection from environment variables so no credential lives in the repo:
  SUPABASE_DB_HOST, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD  (optional SUPABASE_DB_PORT, default 5432)
"""
import glob, os, sys
import psycopg2

conn = psycopg2.connect(
    host=os.environ["SUPABASE_DB_HOST"],
    port=int(os.environ.get("SUPABASE_DB_PORT", "5432")),
    user=os.environ["SUPABASE_DB_USER"],
    password=os.environ["SUPABASE_DB_PASSWORD"],
    dbname="postgres",
    sslmode="require",
)
conn.autocommit = True
files = sorted(glob.glob("supabase/migrations/*.sql")) + ["supabase/seed.sql"]
cur = conn.cursor()
for f in files:
    sql = open(f).read()
    try:
        cur.execute(sql)
        print("applied", f)
    except Exception as e:
        print("FAILED", f, "->", str(e).strip()[:400])
        sys.exit(1)
