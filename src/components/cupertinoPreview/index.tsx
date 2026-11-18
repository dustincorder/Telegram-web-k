import {createEffect, createSignal, For, onCleanup, onMount, Show} from 'solid-js';
import {render} from 'solid-js/web';
import {applyDesignSystem} from '@helpers/designSystemController';
import {normalizeDesignSystemId, DesignSystemId} from '@config/designSystem';
import Row from '@components/rowTsx';
import Section from '@components/section';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import styles from '@components/cupertinoPreview/preview.module.scss';

type Surface = 'chat' | 'settings' | 'menus' | 'dialogs';
type Theme = 'light' | 'dark';
type Viewport = 'desktop' | 'mobile';

const dialogs = [
  {name: 'Design Review', message: 'The new message composer is ready for review.', time: '10:42', unread: 2, active: true},
  {name: 'Saved Messages', message: 'A very long preview title that should remain readable.', time: '09:18', unread: 0},
  {name: 'Telegram Design Team', message: 'Alex: Let us keep the spacing calm and compact.', time: 'Yesterday', unread: 5},
  {name: 'Product Updates', message: 'Muted conversation', time: 'Mon', unread: 0, muted: true}
];

const messages = [
  {text: 'Welcome to the isolated Cupertino preview.', time: '10:38', outgoing: false},
  {text: 'It uses fixtures only and never opens a Telegram session.', time: '10:39', outgoing: true},
  {text: 'Try the theme, direction, viewport, menu and dialog controls.', time: '10:40', outgoing: false}
];

function CupertinoPreview() {
  const [system, setSystem] = createSignal<DesignSystemId>('cupertino');
  const [theme, setTheme] = createSignal<Theme>('light');
  const [direction, setDirection] = createSignal<'ltr' | 'rtl'>('ltr');
  const [viewport, setViewport] = createSignal<Viewport>('desktop');
  const [surface, setSurface] = createSignal<Surface>('chat');
  const [menuOpen, setMenuOpen] = createSignal(false);
  const [dialogOpen, setDialogOpen] = createSignal(false);

  createEffect(() => {
    // The real selectors use .night and .is-rtl on the root, not just dir on
    // the fixture. Theme fixture variables are also defined at that boundary.
    document.documentElement.classList.toggle('night', theme() === 'dark');
    document.documentElement.classList.toggle('is-rtl', direction() === 'rtl');
    document.documentElement.dir = direction();
  });

  onMount(() => {
    const onControl = (event: Event) => {
      const {key, value} = (event as CustomEvent<{key: string, value: string}>).detail;
      if(key === 'system') updateSystem(value as DesignSystemId);
      if(key === 'theme') setTheme(value as Theme);
      if(key === 'direction') setDirection(value as 'ltr' | 'rtl');
      if(key === 'viewport') setViewport(value as Viewport);
      if(key === 'surface') openSurface(value as Surface);
    };
    window.addEventListener('cupertino-preview-control', onControl);
    onCleanup(() => window.removeEventListener('cupertino-preview-control', onControl));
  });

  const updateSystem = (value: DesignSystemId) => {
    const normalized = normalizeDesignSystemId(value);
    setSystem(normalized);
    applyDesignSystem(normalized);
  };

  const openSurface = (value: Surface) => {
    setSurface(value);
    setMenuOpen(false);
    setDialogOpen(false);
  };

  return (
    <main
      class={`${styles.Preview} ${styles[theme()]} ${styles[viewport()]}`}
      dir={direction()}
      data-preview-surface={surface()}
    >
      <header class={styles.PreviewToolbar}>
        <div>
          <div class={styles.Eyebrow}>Structural fixtures · resize the browser to test breakpoints</div>
          <h1>Cupertino interface</h1>
        </div>
        <div class={styles.ToolbarControls}>
          <label>
            Style
            <select value={system()} onChange={(event) => updateSystem(event.currentTarget.value as DesignSystemId)}>
              <option value="classic">Telegram Classic</option>
              <option value="cupertino">Cupertino</option>
              <option value="material3">Material 3</option>
            </select>
          </label>
          <label>
            Theme
            <select value={theme()} onChange={(event) => setTheme(event.currentTarget.value as Theme)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>
            Frame width
            <select value={viewport()} onChange={(event) => setViewport(event.currentTarget.value as Viewport)}>
              <option value="desktop">Desktop</option>
              <option value="mobile">Narrow frame</option>
            </select>
          </label>
          <button type="button" onClick={() => setDirection(direction() === 'ltr' ? 'rtl' : 'ltr')}>
            {direction().toUpperCase()}
          </button>
        </div>
      </header>

      <nav class={styles.SurfaceTabs} aria-label="Preview surfaces">
        <For each={[
          ['chat', 'Chat'],
          ['settings', 'Settings'],
          ['menus', 'Menus'],
          ['dialogs', 'Dialogs']
        ] as [Surface, string][]}>
          {([id, label]) => (
            <button data-surface={id} type="button" classList={{[styles.Selected]: surface() === id}} onClick={() => openSurface(id)}>
              {label}
            </button>
          )}
        </For>
      </nav>

      <section class={styles.AppFrame} aria-label="Telegram interface fixture">
        <aside id="column-left" class={styles.Sidebar}>
          <div class={`${styles.AppBar} sidebar-header`}>
            <button class="btn-icon" type="button" aria-label="Open navigation">☰</button>
            <strong>Messages</strong>
            <button class="btn-icon" type="button" aria-label="New message">＋</button>
          </div>
          <div class={styles.Search}>Search</div>
          <div class="menu-horizontal-scrollable">
            <div class="menu-horizontal-div">
              <button class="menu-horizontal-div-item active" type="button">All chats</button>
              <button class="menu-horizontal-div-item" type="button">Unread</button>
            </div>
          </div>
          <ul class="chatlist">
            <For each={dialogs}>
              {(dialog) => (
                <li class={`row row-big row-with-padding chatlist-chat chatlist-chat-bigger ${dialog.active ? 'active' : ''}`}>
                  <div class={`${styles.Avatar} avatar dialog-avatar row-media row-media-bigger`}>{dialog.name.slice(0, 1)}</div>
                  <div class="row-row row-title-row dialog-title">
                    <div class="row-title user-title" dir="auto">{dialog.name}</div>
                    <time class="dialog-title-details" dir="ltr">{dialog.time}</time>
                  </div>
                  <div class="row-row row-subtitle-row dialog-subtitle">
                    <div class="row-subtitle" dir="auto">{dialog.message}</div>
                    <Show when={dialog.unread}><span class="badge badge-20 badge-primary unread">{dialog.unread}</span></Show>
                    <Show when={dialog.muted}><span class="dialog-muted-icon" aria-label="Muted">◌</span></Show>
                  </div>
                </li>
              )}
            </For>
          </ul>
          <Show when={surface() === 'settings'}>
            <section class={styles.SettingsPanel}>
              <div class="sidebar-slider">
                <div class="sidebar-slider-item">
                  <h2 class={styles.SettingsTitle}>Settings</h2>
                  <Section name={<span>Account</span>}>
                    <Row clickable><Row.Title>Notifications</Row.Title><Row.Right>›</Row.Right></Row>
                    <Row clickable><Row.Title>Privacy and Security</Row.Title><Row.Right>›</Row.Right></Row>
                  </Section>
                  <Section name={<span>Appearance</span>}>
                    <Row>
                      <Row.Title>Use Cupertino interface</Row.Title>
                      <Row.CheckboxFieldToggle><CheckboxFieldTsx toggle checked /></Row.CheckboxFieldToggle>
                    </Row>
                    <Row clickable><Row.Title>Wallpaper</Row.Title><Row.Right>Blue waves</Row.Right></Row>
                  </Section>
                </div>
              </div>
            </section>
          </Show>

        </aside>

        <section class={`${styles.Conversation} chat`}>
          <div class="topbar">
            <button class="btn-icon" type="button" aria-label="Back to chats">‹</button>
            <div class="chat-info">
              <strong>Design Review</strong>
              <span>online</span>
            </div>
            <div class="chat-utils">
              <button class="btn-icon" type="button" aria-label="Search messages">⌕</button>
              <button class="btn-icon" type="button" aria-label="More actions" onClick={() => setMenuOpen(!menuOpen())}>•••</button>
            </div>
          </div>
          <div class="bubbles">
            <div class={styles.DateSeparator}>Today</div>
            <For each={messages}>
              {(message) => (
                <div class={`bubble is-group-first is-group-last ${message.outgoing ? 'is-out' : 'is-in'}`}>
                  <div class="bubble-content">
                    <div class="message" dir="auto">{message.text}<span class="time is-inline" dir="ltr">{message.time} {message.outgoing ? '✓✓' : ''}</span></div>
                  </div>
                </div>
              )}
            </For>
          </div>
          <div class="chat-input">
            <div class={`${styles.Composer} chat-input-wrapper`}>
              <button class="btn-icon chat-input-control-button" type="button" aria-label="Attach file">＋</button>
              <div class="input-message-container"><div class="input-message-input" contentEditable={true} role="textbox" aria-label="Message">Write a message</div></div>
              <button class="btn-icon chat-input-secondary-button" type="button" aria-label="Add emoji">☺</button>
              <button class="btn-send" type="button" aria-label="Send message">↑</button>
            </div>
          </div>
        </section>

        <Show when={menuOpen() || surface() === 'menus'}>
          <div class="btn-menu active" role="menu">
            <button class="btn-menu-item" type="button" role="menuitem" onClick={() => openSurface('chat')}>Mute notifications</button>
            <button class="btn-menu-item" type="button" role="menuitem" onClick={() => openSurface('chat')}>Search in chat</button>
            <button class="btn-menu-item danger" type="button" role="menuitem" onClick={() => setDialogOpen(true)}>Delete conversation</button>
          </div>
        </Show>

        <Show when={dialogOpen() || surface() === 'dialogs'}>
          <div class="popup popup-confirmation active" role="dialog" aria-modal="true" aria-labelledby="preview-dialog-title">
            <div class="popup-container">
              <div class="popup-header"><h2 class="popup-title" id="preview-dialog-title">Delete conversation?</h2></div>
              <p class="popup-description">This fixture action does not contact Telegram.</p>
              <div class="popup-footer">
                <button class="popup-footer-button btn-primary" type="button" onClick={() => openSurface('chat')}>Cancel</button>
                <button class="popup-footer-button" type="button" onClick={() => openSurface('chat')}>Delete</button>
              </div>
            </div>
          </div>
        </Show>
      </section>
    </main>
  );
}

export function startCupertinoPreview() {
  const root = document.documentElement;
  const previousSystem = root.dataset.designSystem;
  const previousDirection = root.getAttribute('dir');
  const previousNight = root.classList.contains('night');
  const previousRtl = root.classList.contains('is-rtl');
  applyDesignSystem('cupertino');
  const container = document.createElement('div');
  container.id = 'cupertino-preview-root';
  // Preserve an existing Vite diagnostic; replacing the body would hide it
  // and let ready() approve a fixture while the development checks are failing.
  for(const child of Array.from(document.body.children)) {
    if(child.tagName !== 'VITE-ERROR-OVERLAY') child.remove();
  }
  document.body.append(container);
  const dispose = render(() => <CupertinoPreview />, container);
  const api = {
    ready: async() => {
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if(document.querySelector('vite-error-overlay')) {
        throw new Error('Preview blocked by a Vite error overlay. Inspect the dev-server diagnostics.');
      }
      // This is only fixture readiness. It is not a typecheck/build/test result.
    },
    show: () => container.removeAttribute('hidden'),
    setSystem: (value: DesignSystemId) => window.dispatchEvent(new CustomEvent('cupertino-preview-control', {detail: {key: 'system', value}})),
    setTheme: (value: Theme) => window.dispatchEvent(new CustomEvent('cupertino-preview-control', {detail: {key: 'theme', value}})),
    setDirection: (value: 'ltr' | 'rtl') => window.dispatchEvent(new CustomEvent('cupertino-preview-control', {detail: {key: 'direction', value}})),
    setViewport: (value: Viewport) => window.dispatchEvent(new CustomEvent('cupertino-preview-control', {detail: {key: 'viewport', value}})),
    open: (value: Surface) => window.dispatchEvent(new CustomEvent('cupertino-preview-control', {detail: {key: 'surface', value}})),
    close: () => {
      dispose();
      container.remove();
      applyDesignSystem(previousSystem);
      if(previousSystem === undefined) delete root.dataset.designSystem;
      if(previousDirection === null) root.removeAttribute('dir');
      else root.setAttribute('dir', previousDirection);
      root.classList.toggle('night', previousNight);
      root.classList.toggle('is-rtl', previousRtl);
      delete (window as any).cupertinoPreview;
    }
  };
  (window as any).cupertinoPreview = api;
  return api;
}
