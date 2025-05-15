package main

import (
	"log"
	"net"

	"google.golang.org/grpc"
	pb "github.com/devse/dreamjournal/ourdreamjournal/backend/proto"
)

type server struct {
	pb.UnimplementedDreamJournalServer
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterDreamJournalServer(s, &server{})

	log.Printf("Server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
