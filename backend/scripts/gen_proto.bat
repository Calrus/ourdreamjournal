@echo off
set PROTODIR=%~dp0..\proto
set OUTDIR=%~dp0..\proto
protoc --go_out=%OUTDIR% --go-grpc_out=%OUTDIR% --proto_path=%PROTODIR% %PROTODIR%\dream_journal.proto
