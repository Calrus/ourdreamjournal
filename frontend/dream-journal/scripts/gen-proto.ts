const { execSync } = require('child_process');
const path = require('path');

const protoDir = path.join(__dirname, '../../../backend/proto');
const outputDir = path.join(__dirname, '../src/proto');

// Generate JavaScript proto files
execSync(`protoc \
  --js_out=import_style=commonjs,binary:${outputDir} \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:${outputDir} \
  -I=${protoDir} \
  ${protoDir}/dream_journal.proto`, {
  stdio: 'inherit'
});

// Generate TypeScript proto files
execSync(`protoc \
  --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
  --ts_out=service=grpc-web:${outputDir} \
  -I=${protoDir} \
  ${protoDir}/dream_journal.proto`, {
  stdio: 'inherit'
});