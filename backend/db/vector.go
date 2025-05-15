package db

import (
	"context"
	"fmt"
	"os"

	"github.com/pinecone-io/go-pinecone/pinecone"
	"github.com/sashabaranov/go-openai"
)

// VectorDB represents a connection to Pinecone
type VectorDB struct {
	client    *pinecone.Client
	index     pinecone.Index
	embedding *openai.Client
}

// NewVectorDB creates a new connection to Pinecone
func NewVectorDB() (*VectorDB, error) {
	apiKey := os.Getenv("PINECONE_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("PINECONE_API_KEY environment variable is required")
	}

	openaiKey := os.Getenv("OPENAI_API_KEY")
	if openaiKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY environment variable is required")
	}

	// Initialize Pinecone client
	config := pinecone.Config{
		APIKey: apiKey,
		Host:   "dreamjournal-xxxxx-xxxxx.svc.gcp-starter.pinecone.io", // Replace with your index host
	}

	client, err := pinecone.NewClient(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Pinecone client: %v", err)
	}

	// Get the index
	index, err := client.Index("dreamjournal") // Replace with your index name
	if err != nil {
		return nil, fmt.Errorf("failed to get Pinecone index: %v", err)
	}

	// Initialize OpenAI client for embeddings
	embedding := openai.NewClient(openaiKey)

	return &VectorDB{
		client:    client,
		index:     index,
		embedding: embedding,
	}, nil
}

// EmbedAndUpsert generates embeddings for the text and upserts them to Pinecone
func (v *VectorDB) EmbedAndUpsert(ctx context.Context, id string, text string, metadata map[string]interface{}) error {
	// Generate embedding using OpenAI
	resp, err := v.embedding.CreateEmbedding(
		ctx,
		openai.EmbeddingRequest{
			Input: []string{text},
			Model: openai.AdaEmbeddingV2,
		},
	)
	if err != nil {
		return fmt.Errorf("failed to generate embedding: %v", err)
	}

	if len(resp.Data) == 0 {
		return fmt.Errorf("no embedding data received")
	}

	// Prepare vector for upsert
	vector := pinecone.Vector{
		ID:       id,
		Values:   resp.Data[0].Embedding,
		Metadata: metadata,
	}

	// Upsert to Pinecone
	_, err = v.index.Upsert(ctx, []pinecone.Vector{vector})
	if err != nil {
		return fmt.Errorf("failed to upsert vector: %v", err)
	}

	return nil
}

// Close closes the Pinecone client
func (v *VectorDB) Close() error {
	if v.client != nil {
		return v.client.Close()
	}
	return nil
} 