package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
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
}

type CreateDreamRequest struct {
	UserID string `json:"userId"`
	Text   string `json:"text"`
	Public bool   `json:"public"`
}

// In-memory storage for dreams
var dreams []Dream

func main() {
	r := mux.NewRouter()

	// Register REST API handlers
	r.HandleFunc("/api/register", func(w http.ResponseWriter, r *http.Request) {
		var req RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// TODO: Implement actual user registration with database
		// For now, return a mock response
		resp := AuthResponse{
			User: User{
				ID:        "1",
				Email:     req.Email,
				Username:  req.Username,
				CreatedAt: time.Now().Unix(),
			},
			Token: "mock-jwt-token",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}).Methods("POST")

	r.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// TODO: Implement actual user login with database
		// For now, return a mock response
		resp := AuthResponse{
			User: User{
				ID:        "1",
				Email:     req.Email,
				Username:  "testuser",
				CreatedAt: time.Now().Unix(),
			},
			Token: "mock-jwt-token",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}).Methods("POST")

	// Dream endpoints
	r.HandleFunc("/api/dreams", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "POST":
			var req CreateDreamRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}

			// Create new dream
			now := time.Now()
			dream := Dream{
				ID:        time.Now().Format("20060102150405"), // Use timestamp as ID
				UserID:    req.UserID,
				Text:      req.Text,
				Public:    req.Public,
				CreatedAt: now,
				UpdatedAt: now,
			}

			// Add to in-memory storage
			dreams = append(dreams, dream)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(dream)

		case "GET":
			// Get query parameters
			userID := r.URL.Query().Get("userId")
			publicOnly := r.URL.Query().Get("public") == "true"

			// Filter dreams based on parameters
			var filteredDreams []Dream
			for _, dream := range dreams {
				if userID != "" && dream.UserID != userID {
					continue
				}
				if publicOnly && !dream.Public {
					continue
				}
				filteredDreams = append(filteredDreams, dream)
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(filteredDreams)
		}
	}).Methods("POST", "GET")

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
