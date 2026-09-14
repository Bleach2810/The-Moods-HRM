
import sqlite3
import json
# Wait, is the DB SQLite or Postgres?
# In TenantDbContext.cs, it uses Postgres: Npgsql
# Let's check the connection string from appsettings.json
with open('appsettings.json', 'r') as f:
    config = json.load(f)
conn_str = config['ConnectionStrings']['DefaultConnection']
print("Conn string:", conn_str)

# Let's write a quick python script to connect to Postgres and query PayrollConfigs
import psycopg2
conn = psycopg2.connect(conn_str)
cur = conn.cursor()
cur.execute("SELECT \"LocationId\", \"ConfigKey\", \"ConfigValue\" FROM \"PayrollConfigs\" WHERE \"ConfigKey\" = 'ManagerNote';")
rows = cur.fetchall()
for r in rows:
    print(f"Location: {r[0]} | Key: {r[1]} | Value: {r[2]}")
cur.close()
conn.close()
