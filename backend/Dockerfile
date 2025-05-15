# Build stage
FROM golang:1.21 AS builder

WORKDIR /app

# Install protoc and plugins
RUN apt-get update && apt-get install -y protobuf-compiler
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.28.1
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.2.0

# Copy go.mod and go.sum
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Generate proto files with correct module path
RUN protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    --proto_path=./proto ./proto/dream_journal.proto

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# Final stage
FROM alpine:latest

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/server .

# Create a non-root user and set permissions
RUN adduser -D -u 1000 appuser && \
    chown appuser:appuser /app/server && \
    chmod +x /app/server

# Switch to non-root user
USER appuser

# Expose the REST API port
EXPOSE 8080

# Run the REST API server
CMD ["./server"]
