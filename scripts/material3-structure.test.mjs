/**
 * Dependency-free structural regression guards for the Material 3 design
 * system (this checkout has no node_modules, so no bundler, DOM or component
 * runtime is available): they pin the decisions that make Material 3 a
 * token-driven slice on official `@material/web` components rather than
 * another collection of CSS overrides.
 *
 * Run: node --test scripts/material3-structure.test.mjs
 */
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {test} from 'node:test';
import {strict as assert} from 'node:assert';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const walk = (dir, acc = []) => {
  for(const entry of readdirSync(new URL(`../${dir}`, import.meta.url))) {
    const path = `${dir}/${entry}`;
    if(statSync(new URL(`../${path}`, import.meta.url)).isDirectory()) walk(path, acc);
    else acc.push(path);
  }
  return acc;
};

test('Cupertino is fully retired from the source tree', () => {
  // The popup-sandbox vCard fixture names the *city* Cupertino (Apple's
  // address) — fixture data, not design-system code.
  const leftovers = walk('src')
  .filter((path) => !path.includes('popupSandbox/stories/'))
  .filter((path) => /cupertino/i.test(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')));
  assert.deepEqual(leftovers, [], 'no cupertino code may remain in src/');
  assert.ok(!readdirSync(new URL('../src/components', import.meta.url)).includes('cupertino'),
    'no cupertino component folder');
  assert.ok(!readdirSync(new URL('../src/scss/designSystems', import.meta.url)).includes('cupertino'),
    'no cupertino scss folder');
});

test('the design system ids are exactly classic and material3', () => {
  const config = read('src/config/designSystem.ts');
  assert.match(config, /\['classic', 'material3'\]/);
  assert.doesNotMatch(config, /'cupertino'/);
  // A persisted legacy value must not be selectable again.
  assert.match(config, /normalizeDesignSystemId/);
});

test('@material/web is the selected library, loaded lazily per design system', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.dependencies['@material/web'], '@material/web is a runtime dependency');
  const loader = read('src/lib/designSystems/material3.ts');
  assert.match(loader, /import\('@material\/web\//, 'components load as per-component ESM modules');
  assert.match(loader, /!== 'material3'/, 'classic must not pull the library');
  const controller = read('src/helpers/designSystemController.ts');
  assert.match(controller, /loadMaterial3Components/, 'the controller triggers the lazy load');
});

test('the material3 boundary is the last import in style.scss', () => {
  const scss = read('src/scss/style.scss');
  const lastUse = scss.split('\n').filter((line) => line.startsWith('@use')).pop();
  assert.match(lastUse, /designSystemMaterial3/,
    'the material3 partial must be imported after every app partial to win the cascade');
});

test('M3 system tokens are mapped from the live Telegram theme (dynamic color)', () => {
  const tokens = read('src/scss/designSystems/material3/_tokens.scss');
  assert.match(tokens, /--md-sys-color-primary: var\(--primary-color/, 'primary follows the Telegram accent');
  assert.match(tokens, /--md-sys-color-surface: var\(--surface-color/, 'surface follows the theme');
  assert.match(tokens, /--md-sys-typescale-/, 'the typography scale is mapped');
  assert.match(tokens, /--md-shape-corner-/, 'the shape scale is mapped');
});

test('the M3 sidebar nav slice uses a real Material web component and adopts the real search field', () => {
  const nav = read('src/components/material3/sidebarNav.tsx');
  assert.match(nav, /md-outlined-icon-button/, 'an official @material/web component is used');
  assert.match(nav, /searchContainer/, 'the app InputSearch instance is adopted, not duplicated');
  assert.match(nav, /onSearchTrigger/, 'the M3 affordance drives the adopted field');
});

test('AppSidebarLeft mounts the M3 nav block only under material3 and restores the header on dispose', () => {
  const sidebar = read('src/components/sidebarLeft/index.ts');
  assert.match(sidebar, /useDesignSystem/, 'mounting must follow the reactive design system');
  assert.match(sidebar, /designSystem === 'material3'[\s\S]*?mountMaterial3Nav/,
    'the nav block mounts only while Material 3 is active');
  assert.match(sidebar, /mountMaterial3Nav\(\)[\s\S]*?inputSearch\.container/,
    'the nav block adopts the real InputSearch container');
  assert.match(sidebar, /anchor\.before\(inputSearchContainer\)|header\.append\(inputSearchContainer\)/,
    'the disposer must restore the search field to the nav bar for Classic');
});

test('all material3 rules stay inside the opt-in boundary', () => {
  const boundary = read('src/scss/partials/_designSystemMaterial3.scss');
  assert.match(boundary, /html\[data-design-system='material3'\]/);
  const outside = boundary.replace(/html\[data-design-system='material3'\] \{[\s\S]*?\n\}/, '');
  assert.doesNotMatch(outside, /^\s*\.[a-z]/m, 'no material3 rule may leak outside the boundary');
});

test('the chat-list presentation rides on M3 tokens, not arbitrary colors', () => {
  const sidebar = read('src/scss/designSystems/material3/_sidebar.scss');
  assert.match(sidebar, /--md-sys-color-secondary-container/, 'selection state');
  assert.match(sidebar, /--md-sys-color-outline-variant/, 'list dividers');
  assert.match(sidebar, /--md-sys-state-hover-state-layer-opacity/, 'state-layer hover');
  assert.doesNotMatch(sidebar, /#[0-9a-fA-F]{3,8}\b/, 'no hardcoded colors');
});
