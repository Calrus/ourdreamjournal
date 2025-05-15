<#
  .SYNOPSIS
    Generate Go code from .proto files on Windows.
#>
param(
  [string]$ProtoDir = "$PSScriptRoot\..\proto",
  [string]$OutDir   = "$PSScriptRoot\.."
)

# Ensure protoc is on PATH
& protoc `
  --go_out="$OutDir" `
  --go-grpc_out="$OutDir" `
  --proto_path="$ProtoDir" `
  "$ProtoDir\dream_journal.proto"
