package main

import (
	"bytes"
	"context"
	crand "crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/Calrus/ourdreamjournal/backend/config"
	"github.com/Calrus/ourdreamjournal/backend/db"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/cors"
	"github.com/sashabaranov/go-openai"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID              string `json:"id"`
	Email           string `json:"email"`
	Username        string `json:"username"`
	DisplayName     string `json:"display_name"`
	Description     string `json:"description"`
	ProfileImageURL string `json:"profile_image_url"`
	CreatedAt       int64  `json:"created_at"`
}

type AuthResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Dream struct {
	ID                       string    `json:"id"`
	UserID                   string    `json:"userId"`
	Username                 string    `json:"username"`
	DisplayName              string    `json:"displayName"`
	ProfileImageURL          string    `json:"profileImageURL"`
	Title                    string    `json:"title"`
	Text                     string    `json:"text"`
	Public                   bool      `json:"public"`
	CreatedAt                time.Time `json:"createdAt"`
	UpdatedAt                time.Time `json:"updatedAt"`
	Tags                     []string  `json:"tags,omitempty"`
	NightmareRating          *int      `json:"nightmare_rating,omitempty"`
	VividnessRating          *int      `json:"vividness_rating,omitempty"`
	ClarityRating            *int      `json:"clarity_rating,omitempty"`
	EmotionalIntensityRating *int      `json:"emotional_intensity_rating,omitempty"`
}

type CreateDreamRequest struct {
	Title                    string `json:"title"`
	Text                     string `json:"text"`
	Public                   bool   `json:"public"`
	NightmareRating          *int   `json:"nightmare_rating,omitempty"`
	VividnessRating          *int   `json:"vividness_rating,omitempty"`
	ClarityRating            *int   `json:"clarity_rating,omitempty"`
	EmotionalIntensityRating *int   `json:"emotional_intensity_rating,omitempty"`
}

// In-memory storage for dreams
var dreams []Dream
var dbpool *pgxpool.Pool

const base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

// JWT secret (should be set via env in production)
var jwtSecret = []byte("supersecretkey")

func generateShortcode(length int) (string, error) {
	b := make([]byte, length)
	for i := range b {
		n, err := crand.Int(crand.Reader, big.NewInt(int64(len(base62))))
		if err != nil {
			return "", err
		}
		b[i] = base62[n.Int64()]
	}
	return string(b), nil
}

func main() {
	cfg, err := config.New()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	dbpool, err = db.New(cfg)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close(dbpool)

	r := mux.NewRouter()

	// Register REST API handlers
	r.HandleFunc("/api/register", registerHandler).Methods("POST")
	r.HandleFunc("/api/login", loginHandler).Methods("POST")

	// /api/me endpoint for user info
	r.HandleFunc("/api/me", func(w http.ResponseWriter, r *http.Request) {
		userID, err := extractUserIDFromJWT(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}
		var email, username string
		var createdAt time.Time
		var isAdmin bool
		err = dbpool.QueryRow(context.Background(), "SELECT email, username, created_at, is_admin FROM users WHERE id=$1", userID).Scan(&email, &username, &createdAt, &isAdmin)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		user := User{
			ID:        userID,
			Email:     email,
			Username:  username,
			CreatedAt: createdAt.Unix(),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"user":    user,
			"isAdmin": isAdmin,
		})
	}).Methods("GET")

	// Public profile page
	r.HandleFunc("/api/users/{username}/public", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		username := vars["username"]
		log.Printf("[PUBLIC PROFILE] Looking up user with username: %s", username)
		var user User
		var createdAt time.Time
		// Look up user by username
		var displayName, description, profileImageURL sql.NullString
		err := dbpool.QueryRow(context.Background(), "SELECT id, username, display_name, description, profile_image_url, created_at FROM users WHERE username=$1", username).Scan(&user.ID, &user.Username, &displayName, &description, &profileImageURL, &createdAt)
		if err != nil {
			log.Printf("[PUBLIC PROFILE] SQL error for username '%s': %v", username, err)
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		user.DisplayName = displayName.String
		user.Description = description.String
		user.ProfileImageURL = profileImageURL.String
		user.CreatedAt = createdAt.Unix()
		// Get public dreams for this user
		rows, err := dbpool.Query(context.Background(), "SELECT public_id, title, text, created_at FROM dreams WHERE user_id=$1 AND public=TRUE ORDER BY created_at DESC", user.ID)
		if err != nil {
			http.Error(w, "Failed to fetch dreams", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		var dreams []map[string]interface{}
		for rows.Next() {
			var publicID, title, text string
			var createdAt time.Time
			if err := rows.Scan(&publicID, &title, &text, &createdAt); err == nil {
				dreams = append(dreams, map[string]interface{}{
					"id":        publicID,
					"title":     title,
					"text":      text,
					"createdAt": createdAt,
				})
			}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"user":   user,
			"dreams": dreams,
		})
	}).Methods("GET")

	// Get own profile
	r.HandleFunc("/api/users/me/profile", func(w http.ResponseWriter, r *http.Request) {
		userID, err := extractUserIDFromJWT(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		log.Printf("[PROFILE] Looking up user with id: %s", userID)
		var user User
		var createdAt time.Time
		var displayName, description, profileImageURL sql.NullString
		err = dbpool.QueryRow(context.Background(), "SELECT id, email, username, display_name, description, profile_image_url, created_at FROM users WHERE id=$1", userID).Scan(&user.ID, &user.Email, &user.Username, &displayName, &description, &profileImageURL, &createdAt)
		if err != nil {
			log.Printf("[PROFILE] Query error for user id %s: %v", userID, err)
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		user.DisplayName = displayName.String
		user.Description = description.String
		user.ProfileImageURL = profileImageURL.String
		user.CreatedAt = createdAt.Unix()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	}).Methods("GET")

	// Update own profile
	r.HandleFunc("/api/users/me/profile", func(w http.ResponseWriter, r *http.Request) {
		userID, err := extractUserIDFromJWT(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		var req struct {
			DisplayName     string `json:"display_name"`
			Description     string `json:"description"`
			ProfileImageURL string `json:"profile_image_url"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		_, err = dbpool.Exec(context.Background(), "UPDATE users SET display_name=$1, description=$2, profile_image_url=$3 WHERE id=$4", req.DisplayName, req.Description, req.ProfileImageURL, userID)
		if err != nil {
			http.Error(w, "Failed to update profile", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}).Methods("PUT")

	// Dream endpoints
	r.HandleFunc("/api/dreams", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "POST":
			var req CreateDreamRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}
			userID, err := extractUserIDFromJWT(r)
			if err != nil {
				http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
				return
			}
			// Validate ratings (if present)
			validateRating := func(val *int) bool {
				if val == nil {
					return true
				}
				return *val >= 1 && *val <= 10
			}
			if !validateRating(req.NightmareRating) || !validateRating(req.VividnessRating) || !validateRating(req.ClarityRating) || !validateRating(req.EmotionalIntensityRating) {
				http.Error(w, "All ratings must be between 1 and 10", http.StatusBadRequest)
				return
			}
			now := time.Now()
			var dreamID int
			var shortcode string
			for {
				sc, err := generateShortcode(10)
				if err != nil {
					http.Error(w, "Failed to generate shortcode", http.StatusInternalServerError)
					return
				}
				var exists bool
				err = dbpool.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM dreams WHERE public_id=$1)", sc).Scan(&exists)
				if err != nil {
					http.Error(w, "Database error", http.StatusInternalServerError)
					return
				}
				if !exists {
					shortcode = sc
					break
				}
			}
			// Insert with new ratings fields
			err = dbpool.QueryRow(context.Background(),
				"INSERT INTO dreams (user_id, title, text, public, created_at, updated_at, public_id, nightmare_rating, vividness_rating, clarity_rating, emotional_intensity_rating) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id",
				userID, req.Title, req.Text, req.Public, now, now, shortcode,
				req.NightmareRating, req.VividnessRating, req.ClarityRating, req.EmotionalIntensityRating,
			).Scan(&dreamID)
			if err != nil {
				http.Error(w, "Failed to create dream", http.StatusInternalServerError)
				return
			}
			// After saving the dream, call OpenAI to extract tags
			tags := []string{}
			apiKey := os.Getenv("OPENAI_API_KEY")
			if apiKey != "" {
				cfg := openai.DefaultConfig(apiKey)
				cfg.BaseURL = "https://openrouter.ai/api/v1"
				client := openai.NewClientWithConfig(cfg)
				resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
					Model: "deepseek/deepseek-prover-v2:free",
					Messages: []openai.ChatCompletionMessage{
						{Role: openai.ChatMessageRoleSystem, Content: `Extract 1-5 keyword tags from this dream. Each tag must be 1-2 words only. Tags should be the main setting(s) (e.g., forest, school, city) and main actions (e.g., cutting wood, making smores). If you cannot extract any tags that fit these requirements, return an empty string. Return only a comma-separated list of tags, no extra text.`},
						{Role: openai.ChatMessageRoleUser, Content: req.Text},
					},
					MaxTokens: 60,
				})
				if err == nil && len(resp.Choices) > 0 {
					tags = splitTags(resp.Choices[0].Message.Content)
					// Insert tags into dream_tags table
					for _, tag := range tags {
						_, _ = dbpool.Exec(context.Background(), "INSERT INTO dream_tags (dream_id, tag) VALUES ($1, $2)", dreamID, tag)
					}
				}
			}
			dream := Dream{
				ID:                       shortcode, // Use shortcode as ID for frontend
				UserID:                   userID,
				Title:                    req.Title,
				Text:                     req.Text,
				Public:                   req.Public,
				CreatedAt:                now,
				UpdatedAt:                now,
				Tags:                     tags,
				NightmareRating:          req.NightmareRating,
				VividnessRating:          req.VividnessRating,
				ClarityRating:            req.ClarityRating,
				EmotionalIntensityRating: req.EmotionalIntensityRating,
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(dream)

		case "GET":
			userID := r.URL.Query().Get("userId")
			publicOnly := r.URL.Query().Get("public") == "true"

			var rows pgx.Rows
			var err error
			if userID != "" {
				if publicOnly {
					rows, err = dbpool.Query(context.Background(),
						`SELECT d.public_id, d.user_id, u.username, u.display_name, u.profile_image_url, d.title, d.text, d.public, d.created_at, d.updated_at, d.nightmare_rating, d.vividness_rating, d.clarity_rating, d.emotional_intensity_rating
						 FROM dreams d
						 JOIN users u ON d.user_id = u.id
						 WHERE d.user_id=$1 AND d.public=TRUE`, userID)
				} else {
					rows, err = dbpool.Query(context.Background(),
						`SELECT d.public_id, d.user_id, u.username, u.display_name, u.profile_image_url, d.title, d.text, d.public, d.created_at, d.updated_at, d.nightmare_rating, d.vividness_rating, d.clarity_rating, d.emotional_intensity_rating
						 FROM dreams d
						 JOIN users u ON d.user_id = u.id
						 WHERE d.user_id=$1`, userID)
				}
			} else if publicOnly {
				rows, err = dbpool.Query(context.Background(),
					`SELECT d.public_id, d.user_id, u.username, u.display_name, u.profile_image_url, d.title, d.text, d.public, d.created_at, d.updated_at, d.nightmare_rating, d.vividness_rating, d.clarity_rating, d.emotional_intensity_rating
					 FROM dreams d
					 JOIN users u ON d.user_id = u.id
					 WHERE d.public=TRUE`)
			} else {
				rows, err = dbpool.Query(context.Background(),
					`SELECT d.public_id, d.user_id, u.username, u.display_name, u.profile_image_url, d.title, d.text, d.public, d.created_at, d.updated_at, d.nightmare_rating, d.vividness_rating, d.clarity_rating, d.emotional_intensity_rating
					 FROM dreams d
					 JOIN users u ON d.user_id = u.id`)
			}
			if err != nil {
				http.Error(w, "Failed to fetch dreams", http.StatusInternalServerError)
				return
			}
			defer rows.Close()

			var dreams []Dream
			for rows.Next() {
				var d Dream
				var publicID, userID, username, title, text string
				var displayName, profileImageURL sql.NullString
				var public bool
				var createdAt, updatedAt time.Time
				var dreamRowId int
				var nightmareRating, vividnessRating, clarityRating, emotionalIntensityRating sql.NullInt32
				if err := rows.Scan(&publicID, &userID, &username, &displayName, &profileImageURL, &title, &text, &public, &createdAt, &updatedAt, &nightmareRating, &vividnessRating, &clarityRating, &emotionalIntensityRating); err != nil {
					http.Error(w, "Failed to scan dream", http.StatusInternalServerError)
					return
				}
				err = dbpool.QueryRow(context.Background(), "SELECT id FROM dreams WHERE public_id=$1", publicID).Scan(&dreamRowId)
				tags := []string{}
				if err == nil {
					tagRows, err := dbpool.Query(context.Background(), "SELECT tag FROM dream_tags WHERE dream_id=$1", dreamRowId)
					if err == nil {
						for tagRows.Next() {
							var tag string
							tagRows.Scan(&tag)
							tags = append(tags, tag)
						}
						tagRows.Close()
					}
				}
				d = Dream{
					ID:              publicID,
					UserID:          userID,
					Username:        username,
					DisplayName:     displayName.String,
					ProfileImageURL: profileImageURL.String,
					Title:           title,
					Text:            text,
					Public:          public,
					CreatedAt:       createdAt,
					UpdatedAt:       updatedAt,
					Tags:            tags,
				}
				if nightmareRating.Valid {
					val := int(nightmareRating.Int32)
					d.NightmareRating = &val
				}
				if vividnessRating.Valid {
					val := int(vividnessRating.Int32)
					d.VividnessRating = &val
				}
				if clarityRating.Valid {
					val := int(clarityRating.Int32)
					d.ClarityRating = &val
				}
				if emotionalIntensityRating.Valid {
					val := int(emotionalIntensityRating.Int32)
					d.EmotionalIntensityRating = &val
				}
				dreams = append(dreams, d)
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(dreams)
		}
	}).Methods("POST", "GET")

	// Add endpoint to get dream by public_id
	r.HandleFunc("/api/dreams/{public_id}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		publicID := vars["public_id"]
		if r.Method == "DELETE" {
			userID, err := extractUserIDFromJWT(r)
			if err != nil {
				http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
				return
			}
			var dreamOwnerID string
			var dreamRowID int
			err = dbpool.QueryRow(context.Background(), "SELECT user_id, id FROM dreams WHERE public_id=$1", publicID).Scan(&dreamOwnerID, &dreamRowID)
			if err == pgx.ErrNoRows {
				http.Error(w, "Dream not found", http.StatusNotFound)
				return
			} else if err != nil {
				http.Error(w, "Database error", http.StatusInternalServerError)
				return
			}
			// Check if user is admin
			var isAdmin bool
			err = dbpool.QueryRow(context.Background(), "SELECT is_admin FROM users WHERE id=$1", userID).Scan(&isAdmin)
			if err != nil {
				http.Error(w, "Database error", http.StatusInternalServerError)
				return
			}
			if dreamOwnerID != userID && !isAdmin {
				http.Error(w, "Forbidden: not your dream", http.StatusForbidden)
				return
			}
			_, err = dbpool.Exec(context.Background(), "DELETE FROM dreams WHERE id=$1", dreamRowID)
			if err != nil {
				http.Error(w, "Failed to delete dream", http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}
		var d Dream
		var id int
		var createdAt, updatedAt time.Time
		var nightmareRating, vividnessRating, clarityRating, emotionalIntensityRating sql.NullInt32
		err := dbpool.QueryRow(context.Background(),
			"SELECT id, user_id, title, text, public, created_at, updated_at, nightmare_rating, vividness_rating, clarity_rating, emotional_intensity_rating FROM dreams WHERE public_id=$1",
			publicID,
		).Scan(&id, &d.UserID, &d.Title, &d.Text, &d.Public, &createdAt, &updatedAt, &nightmareRating, &vividnessRating, &clarityRating, &emotionalIntensityRating)
		if err != nil {
			http.Error(w, "Dream not found", http.StatusNotFound)
			return
		}
		d.ID = publicID
		d.CreatedAt = createdAt
		d.UpdatedAt = updatedAt
		if nightmareRating.Valid {
			val := int(nightmareRating.Int32)
			d.NightmareRating = &val
		}
		if vividnessRating.Valid {
			val := int(vividnessRating.Int32)
			d.VividnessRating = &val
		}
		if clarityRating.Valid {
			val := int(clarityRating.Int32)
			d.ClarityRating = &val
		}
		if emotionalIntensityRating.Valid {
			val := int(emotionalIntensityRating.Int32)
			d.EmotionalIntensityRating = &val
		}
		// Fetch tags
		tags := []string{}
		tagRows, err := dbpool.Query(context.Background(), "SELECT tag FROM dream_tags WHERE dream_id=$1", id)
		if err == nil {
			for tagRows.Next() {
				var tag string
				tagRows.Scan(&tag)
				tags = append(tags, tag)
			}
			tagRows.Close()
		}
		d.Tags = tags
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(d)
	}).Methods("GET", "DELETE")

	// Add new endpoint for prophecy
	r.HandleFunc("/api/dreams/prophecy", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Id string `json:"id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		log.Printf("[DEBUG] Looking up dream with public_id: %s", req.Id)
		var text string
		var prophecy sql.NullString
		err := dbpool.QueryRow(context.Background(), "SELECT text, prophecy FROM dreams WHERE public_id=$1", req.Id).Scan(&text, &prophecy)
		if err != nil {
			log.Printf("[DEBUG] Query error: %v", err)
			http.Error(w, "Dream not found", http.StatusNotFound)
			return
		}
		prophecyStr := ""
		if prophecy.Valid {
			prophecyStr = prophecy.String
		}
		if prophecyStr != "" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"prophecy": prophecyStr})
			return
		}
		apiKey := os.Getenv("OPENAI_API_KEY")
		if apiKey == "" {
			log.Printf("[PROPHECY] OpenAI API key not set")
			http.Error(w, "OpenAI API key not set", http.StatusInternalServerError)
			return
		}
		cfg := openai.DefaultConfig(apiKey)
		cfg.BaseURL = "https://openrouter.ai/api/v1"
		client := openai.NewClientWithConfig(cfg)
		resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
			Model: "deepseek/deepseek-prover-v2:free",
			Messages: []openai.ChatCompletionMessage{
				{Role: openai.ChatMessageRoleSystem, Content: "Give a short, direct, one-sentence interpretation of the dream's meaning. Do not write a story, poem, or prophecy. Example: 'This dream means you desire more social interaction in college.'"},
				{Role: openai.ChatMessageRoleUser, Content: text},
			},
			MaxTokens: 60,
		})
		if err != nil {
			log.Printf("[PROPHECY] OpenAI error: %v", err)
			http.Error(w, "Failed to generate prophecy", http.StatusInternalServerError)
			return
		}
		prophecyStr = ""
		if len(resp.Choices) > 0 {
			prophecyStr = resp.Choices[0].Message.Content
		}
		// Cache prophecy in DB
		_, _ = dbpool.Exec(context.Background(), "UPDATE dreams SET prophecy=$1 WHERE public_id=$2", prophecyStr, req.Id)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"prophecy": prophecyStr})
	}).Methods("POST")

	// Add new endpoint for extracting tags
	r.HandleFunc("/api/dreams/tags", func(w http.ResponseWriter, r *http.Request) {
		var req CreateDreamRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		apiKey := os.Getenv("OPENAI_API_KEY")
		if apiKey == "" {
			http.Error(w, "OpenAI API key not set", http.StatusInternalServerError)
			return
		}
		cfg := openai.DefaultConfig(apiKey)
		cfg.BaseURL = "https://openrouter.ai/api/v1"
		client := openai.NewClientWithConfig(cfg)
		resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
			Model: "deepseek/deepseek-prover-v2:free",
			Messages: []openai.ChatCompletionMessage{
				{Role: openai.ChatMessageRoleSystem, Content: "Extract 3-5 keyword tags from this dream. Return only a comma-separated list of tags, no extra text."},
				{Role: openai.ChatMessageRoleUser, Content: req.Text},
			},
			MaxTokens: 60,
		})
		if err != nil {
			http.Error(w, "Failed to extract tags", http.StatusInternalServerError)
			return
		}
		tags := []string{}
		if len(resp.Choices) > 0 {
			for _, tag := range splitTags(resp.Choices[0].Message.Content) {
				tags = append(tags, tag)
			}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string][]string{"tags": tags})
	}).Methods("POST")

	// Add new endpoint for AI insights
	r.HandleFunc("/api/ai-insights", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			UserId string `json:"userId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		if req.UserId == "" {
			http.Error(w, "Missing userId", http.StatusBadRequest)
			return
		}
		// Fetch last 5 dreams for user
		rows, err := dbpool.Query(context.Background(),
			"SELECT public_id, text, id FROM dreams WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5", req.UserId)
		if err != nil {
			http.Error(w, "Failed to fetch dreams", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		apiKey := os.Getenv("OPENAI_API_KEY")
		if apiKey == "" {
			http.Error(w, "OpenAI API key not set", http.StatusInternalServerError)
			return
		}
		cfg := openai.DefaultConfig(apiKey)
		cfg.BaseURL = "https://openrouter.ai/api/v1"
		client := openai.NewClientWithConfig(cfg)
		var insights []map[string]interface{}
		for rows.Next() {
			var publicId, text string
			var dreamId int
			if err := rows.Scan(&publicId, &text, &dreamId); err != nil {
				http.Error(w, "Failed to scan dream", http.StatusInternalServerError)
				return
			}
			// Get tags from dream_tags
			tags := []string{}
			tagRows, err := dbpool.Query(context.Background(), "SELECT tag FROM dream_tags WHERE dream_id=$1", dreamId)
			if err == nil {
				for tagRows.Next() {
					var tag string
					tagRows.Scan(&tag)
					tags = append(tags, tag)
				}
				tagRows.Close()
			}
			// Get summary (no cache, always call OpenAI for now)
			summary := ""
			resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
				Model: "deepseek/deepseek-prover-v2:free",
				Messages: []openai.ChatCompletionMessage{
					{Role: openai.ChatMessageRoleSystem, Content: "Summarize the following dream in one concise paragraph:"},
					{Role: openai.ChatMessageRoleUser, Content: text},
				},
				MaxTokens: 120,
			})
			if err == nil && len(resp.Choices) > 0 {
				summary = resp.Choices[0].Message.Content
			}
			insights = append(insights, map[string]interface{}{
				"dreamId": publicId,
				"summary": summary,
				"tags":    tags,
			})
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(insights)
	}).Methods("POST")

	// Add new endpoint for summarizing a dream
	r.HandleFunc("/api/dreams/summary", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Id string `json:"id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		log.Printf("[DEBUG] Looking up dream with public_id: %s", req.Id)
		var text string
		var summary sql.NullString
		err := dbpool.QueryRow(context.Background(), "SELECT text, summary FROM dreams WHERE public_id=$1", req.Id).Scan(&text, &summary)
		if err != nil {
			log.Printf("[DEBUG] Query error: %v", err)
			http.Error(w, "Dream not found", http.StatusNotFound)
			return
		}
		//added comment
		summaryStr := ""
		if summary.Valid {
			summaryStr = summary.String
		}
		if summaryStr != "" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"summary": summaryStr})
			return
		}
		apiKey := os.Getenv("OPENAI_API_KEY")
		if apiKey == "" {
			http.Error(w, "OpenAI API key not set", http.StatusInternalServerError)
			return
		}
		cfg := openai.DefaultConfig(apiKey)
		cfg.BaseURL = "https://openrouter.ai/api/v1"
		client := openai.NewClientWithConfig(cfg)
		resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
			Model: "deepseek/deepseek-prover-v2:free",
			Messages: []openai.ChatCompletionMessage{
				{Role: openai.ChatMessageRoleSystem, Content: "Summarize the following dream in one direct sentence."},
				{Role: openai.ChatMessageRoleUser, Content: text},
			},
			MaxTokens: 120,
		})
		if err != nil {
			log.Printf("[SUMMARY] OpenAI error: %v", err)
			http.Error(w, "Failed to summarize dream", http.StatusInternalServerError)
			return
		}
		summaryStr = ""
		if len(resp.Choices) > 0 {
			summaryStr = resp.Choices[0].Message.Content
		}
		// Cache summary in DB
		_, _ = dbpool.Exec(context.Background(), "UPDATE dreams SET summary=$1 WHERE public_id=$2", summaryStr, req.Id)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"summary": summaryStr})
	}).Methods("POST")

	// Friend system endpoints
	r.HandleFunc("/api/friends/request", func(w http.ResponseWriter, r *http.Request) {
		userID, err := extractUserIDFromJWT(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		var req struct {
			UserID   string `json:"user_id"`
			FriendID string `json:"friend_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		if req.UserID != userID {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		// Check if already friends or pending
		var status string
		err = dbpool.QueryRow(context.Background(), "SELECT status FROM friends WHERE user_id=$1 AND friend_id=$2", req.UserID, req.FriendID).Scan(&status)
		if err == nil {
			json.NewEncoder(w).Encode(map[string]string{"status": status})
			return
		}
		_, err = dbpool.Exec(context.Background(), "INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, 'pending') ON CONFLICT (user_id, friend_id) DO NOTHING", req.UserID, req.FriendID)
		if err != nil {
			log.Printf("[FRIEND REQUEST ERROR] userID=%v friendID=%v error=%v", req.UserID, req.FriendID, err)
			http.Error(w, "Failed to send friend request", http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(map[string]string{"status": "pending"})
	}).Methods("POST")

	r.HandleFunc("/api/friends/accept", func(w http.ResponseWriter, r *http.Request) {
		userID, err := extractUserIDFromJWT(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		var req struct {
			UserID   string `json:"user_id"`
			FriendID string `json:"friend_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		if req.FriendID != userID {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		_, err = dbpool.Exec(context.Background(), "UPDATE friends SET status='accepted', updated_at=NOW() WHERE user_id=$1 AND friend_id=$2 AND status='pending'", req.UserID, req.FriendID)
		if err != nil {
			http.Error(w, "Failed to accept friend request", http.StatusInternalServerError)
			return
		}
		// Also insert reciprocal row if not exists
		_, _ = dbpool.Exec(context.Background(), "INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, 'accepted') ON CONFLICT (user_id, friend_id) DO UPDATE SET status='accepted', updated_at=NOW()", req.FriendID, req.UserID)
		json.NewEncoder(w).Encode(map[string]string{"status": "accepted"})
	}).Methods("POST")

	r.HandleFunc("/api/friends/remove", func(w http.ResponseWriter, r *http.Request) {
		userID, err := extractUserIDFromJWT(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		var req struct {
			UserID   string `json:"user_id"`
			FriendID string `json:"friend_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		if req.UserID != userID && req.FriendID != userID {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		_, err = dbpool.Exec(context.Background(), "DELETE FROM friends WHERE (user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1)", req.UserID, req.FriendID)
		if err != nil {
			http.Error(w, "Failed to remove friend", http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(map[string]string{"status": "removed"})
	}).Methods("POST")

	r.HandleFunc("/api/friends", func(w http.ResponseWriter, r *http.Request) {
		userID := r.URL.Query().Get("user_id")
		pendingFor := r.URL.Query().Get("pending_for")
		if pendingFor != "" {
			// List pending friend requests for this user
			rows, err := dbpool.Query(context.Background(), "SELECT u.id, u.username, u.display_name, u.profile_image_url FROM friends f JOIN users u ON f.user_id = u.id WHERE f.friend_id=$1 AND f.status='pending'", pendingFor)
			if err != nil {
				http.Error(w, "Failed to list friend requests", http.StatusInternalServerError)
				return
			}
			defer rows.Close()
			requests := []map[string]interface{}{{}}
			for rows.Next() {
				var id, username, displayName, profileImageURL sql.NullString
				if err := rows.Scan(&id, &username, &displayName, &profileImageURL); err == nil {
					requests = append(requests, map[string]interface{}{
						"id":                id.String,
						"username":          username.String,
						"display_name":      displayName.String,
						"profile_image_url": profileImageURL.String,
					})
				}
			}
			json.NewEncoder(w).Encode(map[string]interface{}{"requests": requests[1:]})
			return
		}
		if userID == "" {
			var err error
			userID, err = extractUserIDFromJWT(r)
			if err != nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
		}
		rows, err := dbpool.Query(context.Background(), "SELECT u.id, u.username, u.display_name, u.profile_image_url FROM friends f JOIN users u ON f.friend_id = u.id WHERE f.user_id=$1 AND f.status='accepted'", userID)
		if err != nil {
			http.Error(w, "Failed to list friends", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		friends := []map[string]interface{}{}
		for rows.Next() {
			var id, username, displayName, profileImageURL sql.NullString
			if err := rows.Scan(&id, &username, &displayName, &profileImageURL); err == nil {
				friends = append(friends, map[string]interface{}{
					"id":                id.String,
					"username":          username.String,
					"display_name":      displayName.String,
					"profile_image_url": profileImageURL.String,
				})
			}
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"friends": friends})
	}).Methods("GET")

	r.HandleFunc("/api/friends/dreams", func(w http.ResponseWriter, r *http.Request) {
		userID := r.URL.Query().Get("user_id")
		if userID == "" {
			var err error
			userID, err = extractUserIDFromJWT(r)
			if err != nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
		}
		// Get all accepted friends' user IDs
		rows, err := dbpool.Query(context.Background(), "SELECT friend_id FROM friends WHERE user_id=$1 AND status='accepted'", userID)
		if err != nil {
			http.Error(w, "Failed to list friends", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		friendIDs := []string{}
		for rows.Next() {
			var fid string
			if err := rows.Scan(&fid); err == nil {
				friendIDs = append(friendIDs, fid)
			}
		}
		if len(friendIDs) == 0 {
			json.NewEncoder(w).Encode(map[string]interface{}{"dreams": []interface{}{}})
			return
		}
		// Build query for all friends' dreams
		query := "SELECT d.public_id, d.user_id, u.username, u.display_name, u.profile_image_url, d.title, d.text, d.public, d.created_at, d.updated_at, d.nightmare_rating, d.vividness_rating, d.clarity_rating, d.emotional_intensity_rating FROM dreams d JOIN users u ON d.user_id = u.id WHERE d.user_id = ANY($1) AND d.public=TRUE ORDER BY d.created_at DESC"
		rows2, err := dbpool.Query(context.Background(), query, friendIDs)
		if err != nil {
			http.Error(w, "Failed to fetch friends' dreams", http.StatusInternalServerError)
			return
		}
		defer rows2.Close()
		dreams := []map[string]interface{}{}
		for rows2.Next() {
			var publicID, userID, username, title, text string
			var displayName, profileImageURL sql.NullString
			var public bool
			var createdAt, updatedAt time.Time
			var nightmareRating, vividnessRating, clarityRating, emotionalIntensityRating sql.NullInt32
			if err := rows2.Scan(&publicID, &userID, &username, &displayName, &profileImageURL, &title, &text, &public, &createdAt, &updatedAt, &nightmareRating, &vividnessRating, &clarityRating, &emotionalIntensityRating); err == nil {
				dream := map[string]interface{}{
					"id":              publicID,
					"userId":          userID,
					"username":        username,
					"displayName":     displayName.String,
					"profileImageURL": profileImageURL.String,
					"title":           title,
					"text":            text,
					"public":          public,
					"createdAt":       createdAt,
					"updatedAt":       updatedAt,
				}
				if nightmareRating.Valid {
					dream["nightmare_rating"] = int(nightmareRating.Int32)
				}
				if vividnessRating.Valid {
					dream["vividness_rating"] = int(vividnessRating.Int32)
				}
				if clarityRating.Valid {
					dream["clarity_rating"] = int(clarityRating.Int32)
				}
				if emotionalIntensityRating.Valid {
					dream["emotional_intensity_rating"] = int(emotionalIntensityRating.Int32)
				}
				dreams = append(dreams, dream)
			}
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"dreams": dreams})
	}).Methods("GET")

	// Comments: Add, list, delete
	r.HandleFunc("/api/dreams/{dream_id}/comments", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		dreamID := vars["dream_id"]
		log.Printf("[COMMENTS][%s] Received request for dream public_id=%s", r.Method, dreamID)
		// Look up internal dream id from public_id for both POST and GET
		var dreamRowID int
		err := dbpool.QueryRow(context.Background(), "SELECT id FROM dreams WHERE public_id=$1", dreamID).Scan(&dreamRowID)
		if err != nil {
			log.Printf("[COMMENTS] Dream not found for public_id=%s", dreamID)
			http.Error(w, "Dream not found", http.StatusNotFound)
			return
		}
		log.Printf("[COMMENTS][%s] Resolved public_id=%s to dreamRowID=%d", r.Method, dreamID, dreamRowID)
		if r.Method == "POST" {
			userIDStr, err := extractUserIDFromJWT(r)
			if err != nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			userID, err := strconv.Atoi(userIDStr)
			if err != nil {
				log.Printf("[COMMENTS] Invalid userID in JWT: %v", err)
				http.Error(w, "Invalid user ID", http.StatusUnauthorized)
				return
			}
			var req struct {
				Text string `json:"text"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Text) == "" {
				http.Error(w, "Invalid comment text", http.StatusBadRequest)
				return
			}
			log.Printf("[COMMENTS] Inserting comment: dreamRowID=%d, userID=%d, text=%s", dreamRowID, userID, req.Text)
			var commentID int
			err = dbpool.QueryRow(context.Background(), "INSERT INTO comments (dream_id, user_id, text, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id", dreamRowID, userID, req.Text).Scan(&commentID)
			if err != nil {
				log.Printf("[COMMENTS] Failed to add comment: %v", err)
				http.Error(w, "Failed to add comment", http.StatusInternalServerError)
				return
			}
			// Fetch the full comment with user info
			var (
				id                           int
				text, username, userId       string
				displayName, profileImageURL sql.NullString
				createdAt, updatedAt         time.Time
			)
			err = dbpool.QueryRow(context.Background(),
				"SELECT c.id, c.text, c.created_at, c.updated_at, u.id::text, u.username, u.display_name, u.profile_image_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id=$1",
				commentID,
			).Scan(&id, &text, &createdAt, &updatedAt, &userId, &username, &displayName, &profileImageURL)
			if err != nil {
				log.Printf("[COMMENTS] Failed to fetch inserted comment: %v", err)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"error": "Failed to fetch comment",
					"debug": map[string]interface{}{
						"received_public_id":  dreamID,
						"resolved_dreamRowID": dreamRowID,
						"inserted_comment_id": commentID,
						"user_id":             userID,
					},
				})
				return
			}
			comment := map[string]interface{}{
				"id":        id,
				"text":      text,
				"createdAt": createdAt,
				"updatedAt": updatedAt,
				"user": map[string]interface{}{
					"id":                userId,
					"username":          username,
					"display_name":      displayName.String,
					"profile_image_url": profileImageURL.String,
				},
				"debug": map[string]interface{}{
					"received_public_id":  dreamID,
					"resolved_dreamRowID": dreamRowID,
					"inserted_comment_id": commentID,
					"user_id":             userID,
				},
			}
			log.Printf("[COMMENTS] Added comment id=%d for dreamRowID=%d", id, dreamRowID)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(comment)
			return
		}
		if r.Method == "GET" {
			rows, err := dbpool.Query(context.Background(), "SELECT c.id, c.text, c.created_at, c.updated_at, u.id::text, u.username, u.display_name, u.profile_image_url FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.dream_id=$1 ORDER BY c.created_at ASC", dreamRowID)
			if err != nil {
				log.Printf("[COMMENTS] Failed to fetch comments for dreamRowID=%d: %v", dreamRowID, err)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"error": "Failed to fetch comments",
					"debug": map[string]interface{}{
						"received_public_id":  dreamID,
						"resolved_dreamRowID": dreamRowID,
					},
				})
				return
			}
			defer rows.Close()
			comments := []map[string]interface{}{}
			count := 0
			for rows.Next() {
				var id int
				var userID, text, username string
				var displayName, profileImageURL sql.NullString
				var createdAt, updatedAt time.Time
				if err := rows.Scan(&id, &text, &createdAt, &updatedAt, &userID, &username, &displayName, &profileImageURL); err == nil {
					comments = append(comments, map[string]interface{}{
						"id":        id,
						"text":      text,
						"createdAt": createdAt,
						"updatedAt": updatedAt,
						"user": map[string]interface{}{
							"id":                userID,
							"username":          username,
							"display_name":      displayName.String,
							"profile_image_url": profileImageURL.String,
						},
					})
					count++
				}
			}
			log.Printf("[COMMENTS][GET] dreamRowID=%d, found %d comments", dreamRowID, count)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"comments": comments,
				"debug": map[string]interface{}{
					"received_public_id":  dreamID,
					"resolved_dreamRowID": dreamRowID,
					"comments_count":      count,
				},
			})
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}).Methods("GET", "POST")

	r.HandleFunc("/api/comments/{comment_id}", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "DELETE" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		userID, err := extractUserIDFromJWT(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		vars := mux.Vars(r)
		commentID := vars["comment_id"]
		var authorID int
		err = dbpool.QueryRow(context.Background(), "SELECT user_id FROM comments WHERE id=$1", commentID).Scan(&authorID)
		if err != nil {
			http.Error(w, "Comment not found", http.StatusNotFound)
			return
		}
		if fmt.Sprint(authorID) != userID {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		_, err = dbpool.Exec(context.Background(), "DELETE FROM comments WHERE id=$1", commentID)
		if err != nil {
			http.Error(w, "Failed to delete comment", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}).Methods("DELETE")

	// Add endpoint to update tags for a dream
	r.HandleFunc("/api/dreams/{public_id}/tags", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "PUT" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		vars := mux.Vars(r)
		publicID := vars["public_id"]
		userID, err := extractUserIDFromJWT(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		// Find dream and check ownership
		var dreamOwnerID string
		var dreamRowID int
		err = dbpool.QueryRow(context.Background(), "SELECT user_id, id FROM dreams WHERE public_id=$1", publicID).Scan(&dreamOwnerID, &dreamRowID)
		if err == pgx.ErrNoRows {
			http.Error(w, "Dream not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		// Check if user is admin
		var isAdmin bool
		err = dbpool.QueryRow(context.Background(), "SELECT is_admin FROM users WHERE id=$1", userID).Scan(&isAdmin)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		if dreamOwnerID != userID && !isAdmin {
			http.Error(w, "Forbidden: not your dream", http.StatusForbidden)
			return
		}
		var req struct {
			Tags []string `json:"tags"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		// Remove all existing tags for this dream
		_, err = dbpool.Exec(context.Background(), "DELETE FROM dream_tags WHERE dream_id=$1", dreamRowID)
		if err != nil {
			http.Error(w, "Failed to remove old tags", http.StatusInternalServerError)
			return
		}
		// Insert new tags
		for _, tag := range req.Tags {
			if strings.TrimSpace(tag) == "" {
				continue
			}
			_, err := dbpool.Exec(context.Background(), "INSERT INTO dream_tags (dream_id, tag) VALUES ($1, $2)", dreamRowID, tag)
			if err != nil {
				http.Error(w, "Failed to insert tag", http.StatusInternalServerError)
				return
			}
		}
		w.WriteHeader(http.StatusNoContent)
	}).Methods("PUT")

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://34.174.78.61", "https://sleeptalk.to", "http://sleeptalk.to"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	// Get port from environment variable or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "50051"
	}

	// Start the server
	handler := c.Handler(r)
	log.Printf("Server listening on :%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}

// Helper to extract user ID from JWT
func extractUserIDFromJWT(r *http.Request) (string, error) {
	header := r.Header.Get("Authorization")
	if header == "" {
		return "", fmt.Errorf("missing Authorization header")
	}
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", fmt.Errorf("invalid Authorization header format")
	}
	tokenStr := parts[1]
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return "", fmt.Errorf("invalid token: %v", err)
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("invalid token claims")
	}
	userID, ok := claims["user_id"].(string)
	if !ok {
		return "", fmt.Errorf("user_id not found in token")
	}
	return userID, nil
}

// Register/login: issue real JWT
func generateJWT(userID string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	// Log raw body for debugging
	bodyBytes, _ := io.ReadAll(r.Body)
	log.Printf("[REGISTER] Raw body: %s", string(bodyBytes))
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[REGISTER] Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	log.Printf("[REGISTER] Attempt for email: %s", req.Email)
	if req.Email == "" || req.Username == "" || req.Password == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}
	// Check if user already exists
	var exists bool
	err := dbpool.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", req.Email).Scan(&exists)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if exists {
		log.Printf("[REGISTER] User already exists: %s", req.Email)
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}
	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	// Insert user
	var userID int
	err = dbpool.QueryRow(context.Background(),
		"INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id",
		req.Email, req.Username, string(hash),
	).Scan(&userID)
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}
	log.Printf("[REGISTER] Success for email: %s", req.Email)
	var isAdmin bool
	err = dbpool.QueryRow(context.Background(), "SELECT is_admin FROM users WHERE id=$1", userID).Scan(&isAdmin)
	if err != nil {
		http.Error(w, "Failed to fetch admin status", http.StatusInternalServerError)
		return
	}
	token, err := generateJWT(fmt.Sprint(userID))
	if err != nil {
		http.Error(w, "Failed to generate JWT", http.StatusInternalServerError)
		return
	}
	resp := map[string]interface{}{
		"user": map[string]interface{}{
			"id":                fmt.Sprint(userID),
			"email":             req.Email,
			"username":          req.Username,
			"display_name":      req.Username,
			"description":       "",
			"profile_image_url": "",
			"created_at":        time.Now().Unix(),
		},
		"token":   token,
		"isAdmin": isAdmin,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	bodyBytes, _ := io.ReadAll(r.Body)
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "ERR_DECODE_JSON", http.StatusBadRequest)
		return
	}
	if req.Email == "" || req.Password == "" {
		http.Error(w, "ERR_MISSING_FIELDS", http.StatusBadRequest)
		return
	}
	// Fetch user
	var isAdmin bool
	var userID int
	var username, passwordHash string
	var createdAt time.Time
	err := dbpool.QueryRow(context.Background(),
		"SELECT id, username, password_hash, created_at, is_admin FROM users WHERE email=$1",
		req.Email,
	).Scan(&userID, &username, &passwordHash, &createdAt, &isAdmin)
	if err != nil {
		http.Error(w, "ERR_USER_NOT_FOUND", http.StatusUnauthorized)
		return
	}
	log.Printf("[LOGIN] DB returned: id=%d, username=%s, email=%s, passwordHash=%s, createdAt=%v", userID, username, req.Email, passwordHash, createdAt)
	if passwordHash == "" {
		http.Error(w, "ERR_EMPTY_HASH", http.StatusUnauthorized)
		return
	}
	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password))
	if err != nil {
		http.Error(w, "ERR_WRONG_PASSWORD", http.StatusUnauthorized)
		return
	}
	token, err := generateJWT(fmt.Sprint(userID))
	if err != nil {
		http.Error(w, "Failed to generate JWT", http.StatusInternalServerError)
		return
	}
	resp := map[string]interface{}{
		"user": map[string]interface{}{
			"id":         fmt.Sprint(userID),
			"email":      req.Email,
			"username":   username,
			"created_at": createdAt.Unix(),
		},
		"token":   token,
		"isAdmin": isAdmin,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// Helper to split and clean comma-separated tags and trim whitespace
func splitTags(s string) []string {
	// Remove triple backticks and single backticks
	cleaned := strings.ReplaceAll(s, "```", "")
	cleaned = strings.ReplaceAll(cleaned, "`", "")
	// Remove quotes
	cleaned = strings.ReplaceAll(cleaned, "\"", "")
	cleaned = strings.ReplaceAll(cleaned, "'", "")
	// Remove Markdown bullets
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	// Split by comma or newline
	re := regexp.MustCompile(`[\,\n]`)
	parts := re.Split(cleaned, -1)
	tags := []string{}
	for _, tag := range parts {
		t := strings.TrimSpace(tag)
		if t != "" {
			tags = append(tags, t)
		}
	}
	return tags
}
