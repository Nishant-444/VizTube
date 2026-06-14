import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function runIntegrationTest() {
  const NODE_SERVER_URL = 'http://localhost:5000/api/v2/videos/ingest-test';

  // FIX: Using process.cwd() to bypass the ESM __dirname limitation
  const sampleFilePath = path.join(process.cwd(), 'denver_extract.mp3');

  if (!fs.existsSync(sampleFilePath)) {
    console.error(
      `[ERROR] Put a test file named 'denver_extract.mp3' in your root folder before running.`
    );
    process.exit(1);
  }

  console.log('🚀 Initializing local cross-service integration test...');

  const form = new FormData();
  form.append('videoFile', fs.createReadStream(sampleFilePath));

  try {
    const response = await axios.post(NODE_SERVER_URL, form, {
      headers: {
        ...form.getHeaders(),
      },
      // Override Axios default limits for large local files
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log('✅ Ingestion Pipeline Verified Output:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('❌ Integration pipe failed:');
    console.error(error?.response?.data || error.message);
  }
}

runIntegrationTest();
