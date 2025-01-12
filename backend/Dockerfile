# Use the official Go image as the base
FROM golang:1.20-alpine

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum first for dependency download
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the Go application
RUN go build -o server ./cmd/server

# Expose port 8080 (if that's what your Go server uses)
EXPOSE 8080

# Run the server
CMD ["./server"]
