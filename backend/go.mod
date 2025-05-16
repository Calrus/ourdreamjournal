module github.com/Calrus/ourdreamjournal/backend

go 1.21

toolchain go1.23.9

require (
	github.com/gorilla/mux v1.8.1
	github.com/jackc/pgx/v5 v5.3.1
	github.com/joho/godotenv v1.5.1
	github.com/rs/cors v1.10.1
	github.com/sashabaranov/go-openai v1.40.0
	golang.org/x/crypto v0.31.0
	google.golang.org/genproto/googleapis/api v0.0.0-20240528184218-531527333157
	google.golang.org/grpc v1.65.0
	google.golang.org/protobuf v1.34.1
)

replace github.com/rogpeppe/go-internal => github.com/rogpeppe/go-internal v1.10.0

require (
	github.com/golang-jwt/jwt/v5 v5.2.2 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/puddle/v2 v2.2.0 // indirect
	github.com/stretchr/testify v1.8.4 // indirect
	golang.org/x/net v0.33.0 // indirect
	golang.org/x/sync v0.11.0 // indirect
	golang.org/x/sys v0.30.0 // indirect
	golang.org/x/text v0.22.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20240528184218-531527333157 // indirect
)
