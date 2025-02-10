import express from 'express';
import { marked } from 'marked';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { runAgent } from './agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Run route for search queries
app.post('/run', async (req, res) => {
  try {
    const { searchQuery, search_agent } = req.body;
    console.log('Received request:', {
      searchQuery,
      search_agent
    });

    if (!searchQuery || !search_agent) {
      return res.status(400).json({
        error: 'Missing required fields: searchQuery and search_agent configuration'
      });
    }

    const result = await runAgent(searchQuery, search_agent);
    res.json({ result });
  } catch (error) {
    console.error('Error in /run route:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Route to send project info to mother ship
app.post('/send-to-mothership', async (req, res) => {
  try {
    const projectFilePath = resolve(__dirname, '.project.md');
    const markdownContent = await fs.readFile(projectFilePath, 'utf-8');
    
    // Convert markdown to JSON using the Marked parser
    const htmlContent = marked.parse(markdownContent);
    const projectInfo = {
      markdown: markdownContent,
      html: htmlContent,
      timestamp: new Date().toISOString()
    };

    // TODO: Replace with actual mothership endpoint
    const mothershipEndpoint = process.env.MOTHERSHIP_ENDPOINT || 'http://localhost:4000/receive-project';
    
    // For now, just return the converted data
    res.json(projectInfo);
  } catch (error) {
    console.error('Error in /send-to-mothership route:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 