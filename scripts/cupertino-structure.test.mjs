/**
 * Dependency-free structural regression guards for the Cupertino interface.
 *
 * These are source-level assertions (this checkout has no node_modules, so
 * no bundler, DOM or component runtime is available): they pin the structural
 * decisions that make Cupertino a different interface rather than a restyle
 * of Web K — the cascade position of the design-system boundary, the
 * design-system-aware Solid components, the chat-list row variant, and the
 * search-field adoption/restore contract.
 *
 * Run: node --test scripts/cupertino-structure.test.mjs
 */
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {strict as assert} from 'node:assert';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the cupertino boundary is the last import in style.scss', () => {
  const scss = read('src/scss/style.scss');
  const lastUse = scss.split('\n').filter((line) => line.startsWith('@use')).pop();
  assert.match(lastUse, /designSystemCupertino/,
    'the cupertino partial must be imported after every app partial to win the cascade');
});

test('the reactive design-system store follows the controller event', () => {
  const store = read('src/stores/designSystem.ts');
  assert.match(store, /addEventListener\('design_system_changed'/,
    'the store must react to design_system_changed');
  assert.match(store, /normalizeDesignSystemId/,
    'event values must be normalized');
});

test('the sidebar nav component unmounts outside Cupertino and adopts the real search field', () => {
  const nav = read('src/components/cupertino/sidebarNav.tsx');
  assert.match(nav, /cupertino-nav-title/, 'large title row');
  assert.match(nav, /cupertino-nav-search/, 'search row');
  assert.match(nav, /searchContainer/, 'the app InputSearch instance is adopted, not duplicated');
});

test('AppSidebarLeft mounts the nav block only under cupertino and restores the header on dispose', () => {
  const sidebar = read('src/components/sidebarLeft/index.ts');
  assert.match(sidebar, /useDesignSystem/,
    'mounting must follow the reactive design system');
  assert.match(sidebar, /designSystem === 'cupertino'[\s\S]*?mountCupertinoNav/,
    'the nav block mounts only while Cupertino is active');
  assert.match(sidebar, /mountCupertinoNav\(\)[\s\S]*?inputSearch\.container/,
    'the nav block adopts the real InputSearch container');
  assert.match(sidebar, /inputSearchContainer[\s\S]*?header\.append\(inputSearchContainer\)|inputSearchContainer[\s\S]*?anchor\.before\(inputSearchContainer\)/,
    'the disposer must restore the search field to the nav bar for Classic');
});

test('the chat-list row builder renders a pill-free pinned timestamp under Cupertino', () => {
  const row = read('src/components/dialogElement.ts');
  const pill = row.slice(row.indexOf('public createTimePill'), row.indexOf('public createSortableIcon'));
  assert.match(pill, /useDesignSystem/, 'the pill decision must follow the design system');
  assert.match(pill, /cupertino[\s\S]*?cupertino-time-pin/, 'cupertino renders an inline pin');
  assert.match(pill, /dialog-time-pill/, 'classic keeps the pill');
});

test('cupertino scss defines the hairline token once and styles the nav block', () => {
  const tokens = read('src/scss/designSystems/cupertino/_tokens.scss');
  assert.equal((tokens.match(/--cupertino-hairline:/g) || []).length, 1,
    'the hairline token is defined in tokens only');
  const navigation = read('src/scss/designSystems/cupertino/_navigation.scss');
  assert.match(navigation, /\.cupertino-nav \{/, 'the nav block is styled');
  assert.doesNotMatch(navigation, /border-radius: \d+px/,
    'navigation chrome stays square');
});

test('no default-hide rule for the nav block: the component unmounts instead', () => {
  const boundary = read('src/scss/partials/_designSystemCupertino.scss');
  assert.doesNotMatch(boundary, /\.cupertino-nav \{[\s\S]*?display: none/,
    'the nav block must not exist outside Cupertino');
  assert.match(boundary, /html\[data-design-system='cupertino'\]/,
    'all cupertino rules stay inside the opt-in boundary');
});
