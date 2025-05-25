# SleepTalk

SleepTalk is a modern, full-stack web application for recording, exploring, and sharing dreams. It features a Go backend, a React/TypeScript frontend, and AI-powered insights. The app is designed for privacy, creativity, and community sharing.

## Features

- **User Authentication:** Secure registration and login with JWT-based sessions.
- **Dream Recording:** Users can create, edit, and delete their own dreams, with support for titles, text, and public/private visibility.
- **Public Dream Sharing:** Share dreams publicly with unguessable URLs, or keep them private.
- **AI-Powered Insights:**
  - **Summarize Dreams:** Get concise AI-generated summaries of your dreams.
  - **Prophecy Generator:** Generate mystical, one-sentence interpretations.
  - **Tag Extraction:** Automatic keyword tagging of dreams using AI.
  - **Stats Dashboard:** Visualize your dream trends, tag clouds, and summaries.
- **User Profiles:**
  - Edit your display name, description, and profile picture.
  - View public profiles and all public posts by a user.
- **Tag Filtering:** Filter dreams by tags for easy exploration.
- **Modern UI:** Responsive, Reddit-inspired design with smooth navigation and user-friendly forms.
- **Dockerized:** Easy setup and deployment with Docker Compose.

## Tech Stack

- **Backend:** Go (Golang), Gorilla Mux, PostgreSQL, OpenAI/DeepSeek (via OpenRouter) for AI features
- **Frontend:** React, TypeScript, Chakra UI, Framer Motion, Axios, React Router
- **Database:** PostgreSQL
- **Containerization:** Docker, Docker Compose

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/get-started/) and Docker Compose
- (Optional) [Go](https://golang.org/) and [Node.js](https://nodejs.org/) for local development without Docker

### Quick Start (with Docker)

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Calrus/ourdreamjournal.git
   cd ourdreamjournal
   ```
2. **Set your OpenAI API key:**
   - Copy `.env.example` to `backend/.env` and add your OpenAI or OpenRouter API key.
3. **Start the app:**
   ```sh
   docker-compose up --build
   ```
4. **Access the app:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:50051](http://localhost:50051)

### Local Development (without Docker)

- **Backend:**
  1. `cd backend`
  2. Set up your `.env` file with database and API keys.
  3. Run migrations and start the server:
     ```sh
     go run cmd/server/main.go
     ```
- **Frontend:**
  1. `cd frontend/dream-journal`
  2. Install dependencies:
     ```sh
     npm install
     ```
  3. Start the dev server:
     ```sh
     npm start
     ```

## Project Structure

- `backend/` — Go backend, REST API, database, and AI integration
- `frontend/dream-journal/` — React frontend
- `docker-compose.yml` — Multi-service orchestration

## Customization
- **AI Provider:** Uses OpenAI/DeepSeek via OpenRouter. Set your API key in `backend/.env`.
- **Database Reset:** Set `RESET_DB=true` in Docker Compose to reset the database on next startup.

## License
MIT
