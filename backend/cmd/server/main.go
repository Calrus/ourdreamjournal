package main

import (
	"bytes"
	"context"
	crand "crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"os"
	"time"

	"github.com/Calrus/ourdreamjournal/backend/config"
	"github.com/Calrus/ourdreamjournal/backend/db"

	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"github.com/sashabaranov/go-openai"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Username  string `json:"username"`
	CreatedAt int64  `json:"created_at"`
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
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Text      string    `json:"text"`
	Public    bool      `json:"public"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Tags      []string  `json:"tags,omitempty"`
}

type CreateDreamRequest struct {
	UserID string `json:"userId"`
	Text   string `json:"text"`
	Public bool   `json:"public"`
}

// In-memory storage for dreams
var dreams []Dream
var dbpool *pgxpool.Pool

const base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

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
	_ = godotenv.Load(".env") // Load environment variables from .env file if present
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

	// Dream endpoints
	r.HandleFunc("/api/dreams", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "POST":
			var req CreateDreamRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
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
			err = dbpool.QueryRow(context.Background(),
				"INSERT INTO dreams (user_id, text, public, created_at, updated_at, public_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
				req.UserID, req.Text, req.Public, now, now, shortcode,
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
						{Role: openai.ChatMessageRoleSystem, Content: "Extract 3-5 keyword tags from this dream. Return only a comma-separated list of tags, no extra text."},
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
				ID:        shortcode, // Use shortcode as ID for frontend
				UserID:    req.UserID,
				Text:      req.Text,
				Public:    req.Public,
				CreatedAt: now,
				UpdatedAt: now,
				Tags:      tags,
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
						"SELECT public_id, user_id, text, public, created_at, updated_at FROM dreams WHERE user_id=$1 AND public=TRUE", userID)
				} else {
					rows, err = dbpool.Query(context.Background(),
						"SELECT public_id, user_id, text, public, created_at, updated_at FROM dreams WHERE user_id=$1", userID)
				}
			} else if publicOnly {
				rows, err = dbpool.Query(context.Background(),
					"SELECT public_id, user_id, text, public, created_at, updated_at FROM dreams WHERE public=TRUE")
			} else {
				rows, err = dbpool.Query(context.Background(),
					"SELECT public_id, user_id, text, public, created_at, updated_at FROM dreams")
			}
			if err != nil {
				http.Error(w, "Failed to fetch dreams", http.StatusInternalServerError)
				return
			}
			defer rows.Close()

			var dreams []Dream
			for rows.Next() {
				var d Dream
				var publicID string
				if err := rows.Scan(&publicID, &d.UserID, &d.Text, &d.Public, &d.CreatedAt, &d.UpdatedAt); err != nil {
					http.Error(w, "Failed to scan dream", http.StatusInternalServerError)
					return
				}
				d.ID = publicID
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
		var d Dream
		var id int
		var createdAt, updatedAt time.Time
		err := dbpool.QueryRow(context.Background(),
			"SELECT id, user_id, text, public, created_at, updated_at FROM dreams WHERE public_id=$1",
			publicID,
		).Scan(&id, &d.UserID, &d.Text, &d.Public, &createdAt, &updatedAt)
		if err != nil {
			http.Error(w, "Dream not found", http.StatusNotFound)
			return
		}
		d.ID = publicID
		d.CreatedAt = createdAt
		d.UpdatedAt = updatedAt
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
	}).Methods("GET")

	// Add new endpoint for prophecy
	r.HandleFunc("/api/dreams/prophecy", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Id string `json:"id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		if req.Id == "" {
			http.Error(w, "Missing dream id", http.StatusBadRequest)
			return
		}
		// Look up dream text and prophecy by public_id
		var text, prophecy string
		err := dbpool.QueryRow(context.Background(), "SELECT text, prophecy FROM dreams WHERE public_id=$1", req.Id).Scan(&text, &prophecy)
		if err != nil {
			http.Error(w, "Dream not found", http.StatusNotFound)
			return
		}
		if prophecy != "" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"prophecy": prophecy})
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
				{Role: openai.ChatMessageRoleSystem, Content: "Based on this dream narrative, write a short mystical prophecy:"},
				{Role: openai.ChatMessageRoleUser, Content: text},
			},
			MaxTokens: 120,
		})
		if err != nil {
			log.Printf("[PROPHECY] OpenAI error: %v", err)
			http.Error(w, "Failed to generate prophecy", http.StatusInternalServerError)
			return
		}
		prophecy = ""
		if len(resp.Choices) > 0 {
			prophecy = resp.Choices[0].Message.Content
		}
		// Cache prophecy in DB
		_, _ = dbpool.Exec(context.Background(), "UPDATE dreams SET prophecy=$1 WHERE public_id=$2", prophecy, req.Id)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"prophecy": prophecy})
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
		if req.Id == "" {
			http.Error(w, "Missing dream id", http.StatusBadRequest)
			return
		}
		// Look up dream text and summary by public_id
		var text, summary string
		err := dbpool.QueryRow(context.Background(), "SELECT text, summary FROM dreams WHERE public_id=$1", req.Id).Scan(&text, &summary)
		if err != nil {
			http.Error(w, "Dream not found", http.StatusNotFound)
			return
		}
		if summary != "" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"summary": summary})
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
				{Role: openai.ChatMessageRoleSystem, Content: "Summarize the following dream in one concise paragraph:"},
				{Role: openai.ChatMessageRoleUser, Content: text},
			},
			MaxTokens: 120,
		})
		if err != nil {
			log.Printf("[SUMMARY] OpenAI error: %v", err)
			http.Error(w, "Failed to summarize dream", http.StatusInternalServerError)
			return
		}
		summary = ""
		if len(resp.Choices) > 0 {
			summary = resp.Choices[0].Message.Content
		}
		// Cache summary in DB
		_, _ = dbpool.Exec(context.Background(), "UPDATE dreams SET summary=$1 WHERE public_id=$2", summary, req.Id)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"summary": summary})
	}).Methods("POST")

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
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
	resp := AuthResponse{
		User: User{
			ID:        fmt.Sprint(userID),
			Email:     req.Email,
			Username:  req.Username,
			CreatedAt: time.Now().Unix(),
		},
		Token: "mock-jwt-token", // TODO: implement JWT
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
	var userID int
	var username, passwordHash string
	var createdAt time.Time
	err := dbpool.QueryRow(context.Background(),
		"SELECT id, username, password_hash, created_at FROM users WHERE email=$1",
		req.Email,
	).Scan(&userID, &username, &passwordHash, &createdAt)
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
	resp := AuthResponse{
		User: User{
			ID:        fmt.Sprint(userID),
			Email:     req.Email,
			Username:  username,
			CreatedAt: createdAt.Unix(),
		},
		Token: "mock-jwt-token",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// Helper to split comma-separated tags and trim whitespace
func splitTags(s string) []string {
	tags := []string{}
	for _, tag := range bytes.Split([]byte(s), []byte{','}) {
		t := string(bytes.TrimSpace(tag))
		if t != "" {
			tags = append(tags, t)
		}
	}
	return tags
}
