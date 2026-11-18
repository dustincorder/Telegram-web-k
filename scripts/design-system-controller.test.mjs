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
  '@helpers/mediaSizes': 'data:text/javascript,export default {isMobile:false,isLessThanFloatingLeftSidebar:false,addEventListener(){}}',
  '@helpers/number/clamp': new URL('../src/helpers/number/clamp.ts', import.meta.url).href,
  '@helpers/schedulers/throttle': 'data:text/javascript,export default function throttle(callback){return callback}',
  '@helpers/appWindow': 'data:text/javascript,export const viewport={innerWidth:1440};export function getAppWindow(){return viewport}',
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


test('layout notification follows the root marker and skips repeated selections', () => {
  const changes = [];
  const listener = (value) => changes.push([value, document.documentElement.dataset.designSystem]);
  rootScope.addEventListener('design_system_changed', listener);
  try {
    initializeDesignSystemController('cupertino');
    initializeDesignSystemController('cupertino');
    initializeDesignSystemController('classic');
    assert.deepEqual(changes, [['cupertino', 'cupertino'], ['classic', 'classic']]);
  } finally {
    rootScope.removeEventListener('design_system_changed', listener);
  }
});

test('live layout switching removes Cupertino gutters and restores Classic geometry', async() => {
  const originals = new Map(['localStorage', 'getComputedStyle'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const properties = new Map();
  const centerProperties = new Map();
  document.documentElement.style = {setProperty: (key, value) => properties.set(key, value)};
  document.getElementById = () => ({style: {setProperty: (key, value) => centerProperties.set(key, value)}});
  const bodyClasses = new Map();
  document.body = {classList: {toggle: (name, value) => bodyClasses.set(name, value)}};
  Object.defineProperty(globalThis, 'localStorage', {configurable: true, value: {getItem: () => null, setItem() {}}});
  Object.defineProperty(globalThis, 'getComputedStyle', {configurable: true, value: () => ({paddingLeft: '0', paddingRight: '0'})});
  try {
    const {default: updateColumnWidths, setFoldersSidebarShown, setUserPreferredLeft, setOpenTabsLeftSidebar} = await import('../src/helpers/updateColumnWidths.ts');
    const {default: mediaSizes} = await import(aliases['@helpers/mediaSizes']);
    const {viewport} = await import(aliases['@helpers/appWindow']);
    const {getDesignSystemLayout} = await import('../src/config/designSystem.ts');
    initializeDesignSystemController('classic');
    assert.equal(properties.get('--page-chats-padding'), '16px');
    assert.equal(centerProperties.get('--page-chats-padding'), '16px');
    assert.equal(properties.get('--middle-column-width'), '1408px');
    setFoldersSidebarShown(true);
    assert.equal(properties.get('--folders-sidebar-offset'), '80px');

    // Emit the real setting update: controller -> marker -> geometry listener.
    selectionChanged('cupertino');
    assert.equal(properties.get('--page-chats-padding'), '0px');
    assert.equal(centerProperties.get('--page-chats-padding'), '0px');
    assert.equal(properties.get('--middle-column-width'), '1440px');
    assert.equal(properties.get('--folders-sidebar-offset'), '72px');
    assert.equal(getDesignSystemLayout('cupertino', false).topbarPlateGap, 0);
    assert.equal(getDesignSystemLayout('cupertino', false).historyTop, 48);
    assert.equal(getDesignSystemLayout('cupertino', false).historyBottom, 56);
    setFoldersSidebarShown(false);
    assert.equal(bodyClasses.get('right-column-floats'), false);
    setUserPreferredLeft(0);
    assert.equal(properties.get('--left-column-width'), '80px');
    setOpenTabsLeftSidebar(true);
    assert.equal(properties.get('--left-column-visual-width'), '360px');
    assert.equal(properties.get('--left-column-width'), '80px');
    setOpenTabsLeftSidebar(false);
    setUserPreferredLeft(360);
    setFoldersSidebarShown(true);
    // Reclaim only the available space, even with a user-resized docked sidebar.
    viewport.innerWidth = 1000;
    setUserPreferredLeft(480);
    assert.equal(properties.get('--chat-width'), '448px');
    setUserPreferredLeft(360);
    viewport.innerWidth = 1440;
    selectionChanged('material3');
    assert.equal(properties.get('--page-chats-padding'), '16px');
    assert.equal(centerProperties.get('--page-chats-padding'), '16px');
    assert.equal(properties.get('--folders-sidebar-offset'), '80px');
    assert.equal(getDesignSystemLayout('material3', false).topbarPlateGap, 8);
    assert.equal(getDesignSystemLayout('material3', false).historyTop, 72);
    assert.equal(getDesignSystemLayout('material3', false).historyBottom, 64);

    mediaSizes.isMobile = true;
    viewport.innerWidth = 390;
    updateColumnWidths();
    assert.equal(properties.get('--page-chats-padding'), '0px');
    assert.equal(centerProperties.get('--page-chats-padding'), '8px');
    selectionChanged('cupertino');
    assert.equal(centerProperties.get('--page-chats-padding'), '0px');
    assert.equal(properties.get('--chat-width'), '390px');
    selectionChanged('classic');
    assert.equal(centerProperties.get('--page-chats-padding'), '8px');
    assert.equal(getDesignSystemLayout('invalid', false).columnGutter, 16);
    assert.equal(getDesignSystemLayout('classic', true).historyTop, 56);
    assert.equal(getDesignSystemLayout('classic', true).historyBottom, 56);
  } finally {
    for(const [key, descriptor] of originals) {
      if(descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
