import { spawn } from 'node:child_process';
const children = ['dev:server', 'dev:client'].map(script => spawn('npm', ['run', script], { stdio: 'inherit', detached: true }));
let stopping = false;
function stop(code = 0) { if (stopping) return; stopping = true; for (const child of children) { if (child.pid) { try { process.kill(-child.pid, 'SIGTERM'); } catch {} } } process.exit(code); }
process.on('SIGINT', () => stop()); process.on('SIGTERM', () => stop());
children.forEach(child => { child.on('error', () => stop(1)); child.on('exit', code => stop(code ?? 1)); });
