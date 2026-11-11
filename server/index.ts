import express from 'express';
import { resolve } from 'node:path';
import { createApp } from './app';
const app = createApp({ region: process.env.AWS_REGION, functionName: process.env.LAMBDA_FUNCTION_NAME });
app.use(express.static(resolve('dist/client')));
app.get('/', (_req, res) => res.sendFile(resolve('dist/client/index.html')));
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`API Lambda Event Lab: http://${process.env.HOST || '127.0.0.1'}:${port}`));
server.on('error', error => { console.error('Não foi possível iniciar a API:', error.message); process.exit(1); });
