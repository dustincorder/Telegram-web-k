// Runs the actual TypeScript controller/helpers with Node's native type stripping.
// Only the DOM root and event transport are stubbed; no app, workers or packages.
// Run: node --test scripts/design-system-controller.test.mjs (Node >=22.18)
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {after, beforeEach, test} from 'node:test';

const rootScopeUrl = 'data:text/javascript,' + encodeURIComponent(`
  import {EventEmitter} from 'node:events';
  const events = new EventEmitter();
  const rootScope = {
    addEventListener: events.on.bind(events),
    removeEventListener: events.off.bind(events),
    dispatchEventSingle: events.emit.bind(events)
  };
  Object.defineProperty(rootScope, 'managers', {
    get() { throw new Error('Design selection must not access account managers'); }
  });
  export default rootScope;
`);
const aliases = {
  '@lib/rootScope': rootScopeUrl,
  '@config/designSystem': new URL('../src/config/designSystem.ts', import.meta.url).href,
  '@helpers/hotModule': new URL('../src/helpers/hotModule.ts', import.meta.url).href,
  '@helpers/object/setDeepProperty': new URL('../src/helpers/object/setDeepProperty.ts', import.meta.url).href
};
const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    return aliases[specifier] ? {url: aliases[specifier], shortCircuit: true} : nextResolve(specifier, context);
  }
});
const {default: rootScope} = await import(rootScopeUrl);
const {joinDeepPath} = await import('../src/helpers/object/setDeepProperty.ts');
const {initializeDesignSystemController} = await import('../src/helpers/designSystemController.ts');
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');

beforeEach(() => {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {documentElement: {dataset: {}}}
  });
});

after(() => {
  hook.deregister();
  if(originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
  else delete globalThis.document;
});

function selectionChanged(value) {
  // Exact payload dispatched by AppStateManager.setByKey for RadioField.stateKey.
  const settings = {designSystem: value, theme: 'night'};
  rootScope.dispatchEventSingle('settings_updated', {
    key: joinDeepPath('settings', 'designSystem'),
    value,
    settings
  });
  assert.deepEqual(settings, {designSystem: value, theme: 'night'});
}

test('radio settings events switch all interfaces immediately, including back to Classic', () => {
  initializeDesignSystemController('classic');
  for(const value of ['cupertino', 'material3', 'classic', 'cupertino']) {
    selectionChanged(value);
    assert.equal(document.documentElement.dataset.designSystem, value);
  }
});

test('startup restores each persisted style without altering the saved theme', () => {
  for(const designSystem of ['cupertino', 'material3', 'classic']) {
    // Same input as bootstrap after reading commonStateStorage settings on reload.
    const persistedSettings = {designSystem, theme: 'night'};
    initializeDesignSystemController(persistedSettings.designSystem);
    assert.equal(document.documentElement.dataset.designSystem, designSystem);
    assert.deepEqual(persistedSettings, {designSystem, theme: 'night'});
  }
});

test('missing or invalid persisted values and update values fall back to Classic', () => {
  for(const invalid of [undefined, null, 'legacy', '', 42, {}]) {
    initializeDesignSystemController('cupertino');
    initializeDesignSystemController(invalid);
    assert.equal(document.documentElement.dataset.designSystem, 'classic');
    initializeDesignSystemController('material3');
    selectionChanged(invalid);
    assert.equal(document.documentElement.dataset.designSystem, 'classic');
  }
});

test('color theme and unrelated settings events do not change the interface', () => {
  initializeDesignSystemController('cupertino');
  for(const key of [joinDeepPath('settings', 'theme'), joinDeepPath('settings', 'messagesTextSize')]) {
    rootScope.dispatchEventSingle('settings_updated', {key, value: 'classic', settings: {}});
    assert.equal(document.documentElement.dataset.designSystem, 'cupertino');
  }
});
