import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Live Proxy to ACLEDA Toanchet Pay UAT / Sandbox
  app.post('/api/acleda/proxy', async (req: Request, res: Response) => {
    const { targetUrl, payload, headers } = req.body;

    if (!targetUrl || typeof targetUrl !== 'string') {
      res.status(400).json({ error: 'Missing or invalid targetUrl parameter' });
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers || {}),
      };

      const startTime = Date.now();
      const bankResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: typeof payload === 'string' ? payload : JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const durationMs = Date.now() - startTime;
      const responseText = await bankResponse.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      res.status(bankResponse.status).json({
        success: bankResponse.ok,
        status: bankResponse.status,
        statusText: bankResponse.statusText,
        durationMs,
        data: responseData,
        headers: Object.fromEntries(bankResponse.headers.entries()),
      });
    } catch (err: any) {
      const isAbort = err.name === 'AbortError';
      res.status(502).json({
        success: false,
        isNetworkError: true,
        error: isAbort
          ? 'Connection to ACLEDA UAT Gateway timed out after 12s.'
          : err.message || 'Failed to reach ACLEDA UAT Host',
        code: err.code || (isAbort ? 'ETIMEDOUT' : 'NETWORK_ERROR'),
        suggestion:
          'ACLEDA UAT (port 8443) may block foreign Cloud IPs or require private merchant VPN/whitelisting. You can toggle "ACLEDA Sandbox Simulator" to test full request flows, payload changes, and response handling.',
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Mount Vite or serve built dist
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ACLEDA Developer Studio server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
