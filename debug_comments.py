import psycopg2
import os

# You may need to adjust these values to match your environment
DB_HOST = os.environ.get('PGHOST', '34.174.78.61')
DB_PORT = os.environ.get('PGPORT', '5432')
DB_NAME = os.environ.get('PGDATABASE', 'dreamjournal')
DB_USER = os.environ.get('PGUSER', 'dreamjournal')
DB_PASS = os.environ.get('PGPASSWORD', 'dreamjournal')

conn = psycopg2.connect(
    host=DB_HOST,
    port=DB_PORT,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS
)

cur = conn.cursor()

# Get the most recent comment
cur.execute("SELECT id, dream_id, user_id, text, created_at FROM comments ORDER BY id DESC LIMIT 1;")
row = cur.fetchone()
if not row:
    print("No comments found.")
    cur.close()
    conn.close()
    exit(0)

comment_id, dream_id, user_id, text, created_at = row
print(f"Most recent comment: id={comment_id}, dream_id={dream_id}, user_id={user_id}, created_at={created_at}")
print(f"  Text: {text}")

# 1. SELECT * FROM comments WHERE id = comment_id
print("\n--- Raw comment row ---")
cur.execute("SELECT * FROM comments WHERE id = %s;", (comment_id,))
print(cur.fetchone())

# 2. SELECT * FROM users WHERE id = user_id
print("\n--- User row for user_id ---")
cur.execute("SELECT * FROM users WHERE id = %s;", (user_id,))
print(cur.fetchone())

# 3. Run the join query
print("\n--- Join result for this comment ---")
cur.execute("""
    SELECT c.id, c.text, c.created_at, c.updated_at, u.id, u.username, u.display_name, u.profile_image_url
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = %s;
""", (comment_id,))
result = cur.fetchone()
if result:
    print(result)
else:
    print("No join result found for this comment (join failed)")

cur.close()
conn.close() 