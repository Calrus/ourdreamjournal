import psycopg2
import os

# You may need to adjust these values to match your environment
DB_HOST = os.environ.get('PGHOST', 'localhost')
DB_PORT = os.environ.get('PGPORT', '5432')
DB_NAME = os.environ.get('PGDATABASE', 'ourdreamjournal')
DB_USER = os.environ.get('PGUSER', 'postgres')
DB_PASS = os.environ.get('PGPASSWORD', 'password')

conn = psycopg2.connect(
    host=DB_HOST,
    port=DB_PORT,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS
)

cur = conn.cursor()

print("--- Last 5 comments in 'comments' table ---")
cur.execute("SELECT id, dream_id, user_id, text, created_at FROM comments ORDER BY id DESC LIMIT 5;")
comments = cur.fetchall()
for row in comments:
    comment_id, dream_id, user_id, text, created_at = row
    print(f"Comment ID: {comment_id}, Dream ID: {dream_id}, User ID: {user_id}, Created: {created_at}")
    print(f"  Text: {text}")
    # Check if user exists
    cur.execute("SELECT id, email, username FROM users WHERE id = %s;", (user_id,))
    user = cur.fetchone()
    if user:
        print(f"  User exists: ID={user[0]}, Email={user[1]}, Username={user[2]}")
    else:
        print(f"  User ID {user_id} NOT FOUND in users table!")
    print()

print("--- Done ---")
cur.close()
conn.close() 