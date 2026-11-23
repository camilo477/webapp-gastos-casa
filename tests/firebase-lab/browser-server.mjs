import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const server = await createServer({ configFile: false, root: fileURLToPath(new URL('.', import.meta.url)),
  server: { host: '127.0.0.1', port: 4186, strictPort: true }, logLevel: 'warn' });
await server.listen();
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await server.close(); process.exit(); });
