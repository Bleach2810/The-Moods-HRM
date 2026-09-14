
import json
import psycopg2

try:
    with open('appsettings.json', 'r') as f:
        config = json.load(f)
    conn_str = config['ConnectionStrings']['DefaultConnection']
    print("Conn string:", conn_str)
    
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    cur.execute("SELECT \"LocationId\", \"ConfigKey\", \"ConfigValue\" FROM \"PayrollConfigs\" WHERE \"ConfigKey\" = 'ManagerNote';")
    rows = cur.fetchall()
    for r in rows:
        print(f"Location: {r[0]} | Key: {r[1]} | Value: {r[2]}")
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
