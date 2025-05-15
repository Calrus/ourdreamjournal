const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../../backend/proto');
const targetDir = path.join(__dirname, '../src/proto');

// Create proto directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy proto files
const files = ['dream_journal_pb.js', 'dream_journal_pb_service.js'];
files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Copied ${file} to frontend proto directory`);
}); 