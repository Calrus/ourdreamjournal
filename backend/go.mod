module github.com/Calrus/ourdreamjournal/backend

go 1.21

toolchain go1.23.9

require (
	github.com/gorilla/mux v1.8.1
	github.com/jackc/pgx/v5 v5.3.1
	github.com/pinecone-io/go-pinecone v1.1.1
	github.com/pinecone-io/go-pinecone/v3 v3.1.0
	github.com/rs/cors v1.10.1
	github.com/sashabaranov/go-openai v1.40.0
	google.golang.org/grpc v1.65.0
	google.golang.org/protobuf v1.34.1
)

replace github.com/rogpeppe/go-internal => github.com/rogpeppe/go-internal v1.10.0

require (
	github.com/apapsch/go-jsonmerge/v2 v2.0.0 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/puddle/v2 v2.2.0 // indirect
	github.com/kr/text v0.2.0 // indirect
	github.com/oapi-codegen/runtime v1.1.1 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/rogpeppe/go-internal v0.0.0-00010101000000-000000000000 // indirect
	github.com/stretchr/testify v1.8.4 // indirect
	golang.org/x/crypto v0.31.0 // indirect
	golang.org/x/net v0.33.0 // indirect
	golang.org/x/sync v0.11.0 // indirect
	golang.org/x/sys v0.30.0 // indirect
	golang.org/x/text v0.22.0 // indirect
	google.golang.org/genproto/googleapis/api v0.0.0-20240528184218-531527333157 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20240528184218-531527333157 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)
