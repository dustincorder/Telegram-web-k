// No Vite server, compiler, installed packages or real child processes.
// Run: node --experimental-test-module-mocks --test scripts/dev-checks.test.mjs
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import assert from 'node:assert/strict';
import {mock, test} from 'node:test';

const children = [];
mock.module('node:child_process', {
  namedExports: {
    spawn(binary) {
      const child = new EventEmitter();
      child.binary = binary;
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      child.kill = () => { child.killed = true; };
      children.push(child);
      return child;
    }
  }
});
const {default: devChecks} = await import('./dev-checks.mjs');

function setup() {
  children.length = 0;
  const plugin = devChecks('/fixture');
  const messages = [];
  const server = {watcher: new EventEmitter(), ws: new EventEmitter()};
  server.ws.send = (message) => messages.push(message);
  // No httpServer: exercise the middleware lifecycle too.
  plugin.configureServer(server);
  const typecheck = children.find((child) => child.binary.endsWith('/tsc'));
  return {plugin, server, messages, typecheck};
}

test('watcher failure keeps fatal output and the termination signal', () => {
  const {plugin, messages, typecheck} = setup();
  try {
    typecheck.stderr.write('FATAL ERROR: fixture heap exhausted\n');
    typecheck.emit('close', null, 'SIGABRT');
    const error = messages.at(-1).err;
    assert.equal(error.message, 'TypeScript watcher stopped');
    assert.match(error.stack, /signal SIGABRT/);
    assert.match(error.stack, /fixture heap exhausted/);
    assert.doesNotMatch(error.stack, /code 1/);
  } finally {
    plugin.closeBundle();
  }
});

test('spawn errors reach the overlay and reconnecting clients', () => {
  const {plugin, server, messages, typecheck} = setup();
  try {
    typecheck.emit('error', new Error('spawn ENOENT'));
    typecheck.emit('close', -2, null);
    assert.match(messages.at(-1).err.stack, /Failed to start tsc: spawn ENOENT/);
    let replay;
    server.ws.emit('tweb:dev-checks:ready', {}, {send: (value) => { replay = value; }});
    assert.deepEqual(replay, messages.at(-1));
  } finally {
    plugin.closeBundle();
  }
});

test('successful compilation clears errors; shutdown stops children without an error overlay', () => {
  const {plugin, server, messages, typecheck} = setup();
  try {
    typecheck.stdout.write('Starting compilation in watch mode\n');
    typecheck.stdout.write('file.ts(1,1): error TS0000: fixture error\n');
    typecheck.stdout.write('Found 1 error. Watching for file changes.\n');
    assert.match(messages.at(-1).err.stack, /fixture error/);
    typecheck.stdout.write('File change detected. Starting incremental compilation\n');
    typecheck.stdout.write('Found 0 errors. Watching for file changes.\n');
    assert.equal(messages.at(-1), 'tweb:dev-checks:clear');
    plugin.closeBundle();
    assert.ok(children.every((child) => child.killed));
    assert.equal(server.watcher.listenerCount('all'), 0);
    const count = messages.length;
    typecheck.emit('close', null, 'SIGTERM');
    assert.equal(messages.length, count);
  } finally {
    plugin.closeBundle();
  }
});
