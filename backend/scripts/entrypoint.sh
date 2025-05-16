#!/bin/sh
set -e

if [ "$RESET_DB" = "true" ]; then
  echo "RESET_DB is true: Dropping and recreating database..."
  PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;"
  PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d postgres -c "CREATE DATABASE $POSTGRES_DB;"
fi

echo "Running migrations..."
migrate -path /migrations -database "postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:5432/$POSTGRES_DB?sslmode=disable" up

echo "Starting backend server..."
exec ./server 