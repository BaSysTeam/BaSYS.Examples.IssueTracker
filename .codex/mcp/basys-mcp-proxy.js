#!/usr/bin/env node
/**
 * BaSYS MCP stdio to HTTPS proxy for Codex.
 *
 * It reads JSON-RPC messages from stdin, forwards them to the BaSYS HTTP MCP
 * endpoint with a fresh JWT token, and writes MCP responses to stdout.
 *
 * Configuration:
 * - .codex/mcp/basys-credentials.json
 * - or BASYS_URL, BASYS_DB_NAME, BASYS_LOGIN, BASYS_PASSWORD env variables
 */
'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const rl = require('readline');

const CREDS_FILE = path.join(__dirname, 'basys-credentials.json');
const REFRESH_BEFORE_MS = 60_000;

let currentToken = null;
let tokenExpiresAt = 0;

function log(msg) {
  process.stderr.write(`[basys-mcp-proxy] ${msg}\n`);
}

function loadCredentialsFromEnv() {
  const creds = {
    url: process.env.BASYS_URL,
    dbName: process.env.BASYS_DB_NAME,
    login: process.env.BASYS_LOGIN,
    password: process.env.BASYS_PASSWORD,
  };

  if (Object.values(creds).every(Boolean)) {
    return creds;
  }

  return null;
}

function loadCredentials() {
  const envCreds = loadCredentialsFromEnv();
  if (envCreds) {
    return envCreds;
  }

  if (fs.existsSync(CREDS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
    } catch (e) {
      log(`Could not read credentials file: ${e.message}`);
      process.exit(1);
    }
  }

  log(`Credentials file not found: ${CREDS_FILE}`);
  log('Create .codex/mcp/basys-credentials.json from .codex/mcp/basys-credentials.example.json');
  log('Alternatively set BASYS_URL, BASYS_DB_NAME, BASYS_LOGIN, BASYS_PASSWORD');
  process.exit(1);
}

function request(urlStr, options, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'https:' ? https : http;
    const port = u.port || (u.protocol === 'https:' ? 443 : 80);

    const reqOptions = {
      hostname: u.hostname,
      port,
      path: u.pathname + (u.search || ''),
      method: options.method || 'POST',
      headers: { ...(options.headers || {}) },
      rejectUnauthorized: false,
    };

    if (body) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = lib.request(reqOptions, (res) => resolve(res));
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function readBody(res) {
  return new Promise((resolve, reject) => {
    let data = '';
    res.on('data', chunk => (data += chunk));
    res.on('end', () => resolve(data));
    res.on('error', reject);
  });
}

async function fetchToken(creds) {
  log('Requesting JWT token...');

  const body = JSON.stringify({ Login: creds.login, Password: creds.password });
  const res = await request(
    `${creds.url}/api/public/v1/Auth/${creds.dbName}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    body,
  );

  const data = await readBody(res);

  if (res.statusCode !== 200) {
    throw new Error(`Authentication failed (${res.statusCode}): ${data}`);
  }

  const parsed = JSON.parse(data);
  currentToken = parsed.token ?? parsed.Token;
  const expiresAt = parsed.expiresAtUtc ?? parsed.ExpiresAtUtc;
  tokenExpiresAt = new Date(expiresAt).getTime();
  log(`Token received, expires at: ${expiresAt}`);
  return currentToken;
}

async function ensureToken(creds) {
  if (currentToken && Date.now() < tokenExpiresAt - REFRESH_BEFORE_MS) {
    return currentToken;
  }
  return fetchToken(creds);
}

function parseSseMessages(res) {
  return new Promise((resolve, reject) => {
    const messages = [];
    let buffer = '';

    res.on('data', chunk => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim();
          if (payload) messages.push(payload);
        }
      }
    });

    res.on('end', () => {
      if (buffer.startsWith('data: ')) {
        const payload = buffer.slice(6).trim();
        if (payload) messages.push(payload);
      }
      resolve(messages);
    });

    res.on('error', reject);
  });
}

async function forwardToMcp(messageBody, creds) {
  const jwt = await ensureToken(creds);

  const res = await request(
    `${creds.url}/mcp`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${jwt}`,
      },
    },
    messageBody,
  );

  if (res.statusCode === 401) {
    currentToken = null;
    throw new Error('401 Unauthorized');
  }

  const contentType = res.headers['content-type'] || '';

  if (contentType.includes('text/event-stream')) {
    return parseSseMessages(res);
  }

  const data = await readBody(res);
  return data.trim() ? [data.trim()] : [];
}

function writeError(rawMessage, errorMessage) {
  try {
    const req = JSON.parse(rawMessage);
    const out = JSON.stringify({
      jsonrpc: '2.0',
      id: req.id ?? null,
      error: { code: -32603, message: errorMessage },
    });
    process.stdout.write(out + '\n');
  } catch {
    // If the input is not JSON-RPC, there is no valid id to reply to.
  }
}

async function main() {
  const creds = loadCredentials();

  await fetchToken(creds);

  const reader = rl.createInterface({ input: process.stdin, terminal: false });

  reader.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const messages = await forwardToMcp(trimmed, creds);
      for (const msg of messages) {
        process.stdout.write(msg + '\n');
      }
    } catch (err) {
      if (err.message.includes('401')) {
        try {
          await fetchToken(creds);
          const messages = await forwardToMcp(trimmed, creds);
          for (const msg of messages) {
            process.stdout.write(msg + '\n');
          }
        } catch (retryErr) {
          log(`Retry after 401 failed: ${retryErr.message}`);
          writeError(trimmed, retryErr.message);
        }
        return;
      }
      log(`Error: ${err.message}`);
      writeError(trimmed, err.message);
    }
  });

  reader.on('close', () => process.exit(0));
}

main().catch(err => {
  log(`Fatal: ${err.message}`);
  process.exit(1);
});
