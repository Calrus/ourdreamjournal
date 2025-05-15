package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all configuration for the application
type Config struct {
	DatabaseURL string
	Port        int
}

// New creates a new Config instance by reading from environment variables
func New() (*Config, error) {
	config := &Config{}

	// Read DATABASE_URL
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		config.DatabaseURL = dbURL
	} else {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	// Read PORT with default value of 8080
	if portStr := os.Getenv("PORT"); portStr != "" {
		port, err := strconv.Atoi(portStr)
		if err != nil {
			return nil, fmt.Errorf("invalid PORT value: %v", err)
		}
		config.Port = port
	} else {
		config.Port = 8080 // Default port
	}

	return config, nil
} 