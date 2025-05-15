import { grpc } from '@improbable-eng/grpc-web';
import { DreamJournalService } from '../../proto/dream_journal_pb_service';

// Create a gRPC client instance
const client = new DreamJournalService('http://localhost:3000/api', {
  transport: grpc.CrossBrowserHttpTransport({}),
});

export default client; 