package db

import (
	"context"
	"fmt"
	"time"

	"github.com/Calrus/ourdreamjournal/backend/config"

	"github.com/jackc/pgx/v5/pgxpool"
)

// New creates a new database connection pool using the provided configuration
func New(cfg *config.Config) (*pgxpool.Pool, error) {
	// Configure the connection pool
	poolConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database URL: %v", err)
	}

	// Set reasonable defaults for the connection pool
	poolConfig.MaxConns = 25
	poolConfig.MinConns = 5
	poolConfig.MaxConnLifetime = time.Hour
	poolConfig.MaxConnIdleTime = 30 * time.Minute
	poolConfig.HealthCheckPeriod = time.Minute

	// Create the connection pool
	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %v", err)
	}

	// Verify the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("unable to ping database: %v", err)
	}

	return pool, nil
}

// Close closes the database connection pool
func Close(pool *pgxpool.Pool) {
	if pool != nil {
		pool.Close()
	}
}
