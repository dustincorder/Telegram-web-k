import {createSignal, For, onCleanup, onMount, Show} from 'solid-js';
import {render} from 'solid-js/web';
import {applyDesignSystem} from '@helpers/designSystemController';
import {normalizeDesignSystemId, DesignSystemId} from '@config/designSystem';
import styles from './preview.module.scss';

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
          <div class={styles.Eyebrow}>Development-only fixture preview</div>
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
            View
            <select value={viewport()} onChange={(event) => setViewport(event.currentTarget.value as Viewport)}>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
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
        <aside class={styles.Sidebar}>
          <div class={`${styles.AppBar} sidebar-header`}>
            <button class="btn-icon" type="button" aria-label="Open navigation">☰</button>
            <strong>Messages</strong>
            <button class="btn-icon" type="button" aria-label="New message">＋</button>
          </div>
          <div class={styles.Search}>Search</div>
          <div class="folders-sidebar">
            <div class="folders-sidebar__folder-item folders-sidebar__folder-item--selected">All chats</div>
            <div class="folders-sidebar__folder-item">Unread</div>
          </div>
          <ul class="chatlist">
            <For each={dialogs}>
              {(dialog) => (
                <li class={`chatlist-chat ${dialog.active ? 'active' : ''}`}>
                  <div class={styles.Avatar}>{dialog.name.slice(0, 1)}</div>
                  <div class={styles.DialogCopy}>
                    <div class="dialog-title" dir="auto">{dialog.name}</div>
                    <div class="dialog-subtitle" dir="auto">{dialog.message}</div>
                  </div>
                  <div class={styles.DialogMeta}>
                    <time dir="ltr">{dialog.time}</time>
                    <Show when={dialog.unread}><span class="unread">{dialog.unread}</span></Show>
                    <Show when={dialog.muted}><span aria-label="Muted">◌</span></Show>
                  </div>
                </li>
              )}
            </For>
          </ul>
        </aside>

        <section class={styles.Conversation}>
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
                <div class={`bubble ${message.outgoing ? 'is-out' : 'is-in'}`}>
                  <div class="bubble-content">
                    <span dir="auto">{message.text}</span>
                    <time dir="ltr">{message.time} {message.outgoing ? '✓✓' : ''}</time>
                  </div>
                </div>
              )}
            </For>
          </div>
          <div class="chat-input-wrapper">
            <button class="chat-input-control-button" type="button" aria-label="Attach file">＋</button>
            <div class={styles.InputPlaceholder} contentEditable={true} role="textbox" aria-label="Message">Write a message</div>
            <button class="chat-input-secondary-button" type="button" aria-label="Add emoji">☺</button>
            <button class="btn-send" type="button" aria-label="Send message">↑</button>
          </div>
        </section>

        <Show when={surface() === 'settings'}>
          <section class={styles.SettingsPanel}>
            <div class={styles.SettingsTitle}>Settings</div>
            <div class="sidebar-left-section">
              <div class="sidebar-left-section-name">Account</div>
              <div class="sidebar-left-section-content">
                <div class="row row-clickable"><span class="row-title">Notifications</span><span class="row-right">›</span></div>
                <div class="row row-clickable"><span class="row-title">Privacy and Security</span><span class="row-right">›</span></div>
              </div>
            </div>
            <div class="sidebar-left-section">
              <div class="sidebar-left-section-name">Appearance</div>
              <div class="sidebar-left-section-content">
                <div class="row"><span class="row-title">Use Cupertino interface</span><input type="checkbox" checked aria-label="Use Cupertino interface" /></div>
                <div class="row row-clickable"><span class="row-title">Wallpaper</span><span class="row-right">Blue waves</span></div>
              </div>
            </div>
          </section>
        </Show>

        <Show when={menuOpen() || surface() === 'menus'}>
          <div class="btn-menu" role="menu">
            <button class="btn-menu-item" type="button" role="menuitem" onClick={() => setMenuOpen(false)}>Mute notifications</button>
            <button class="btn-menu-item" type="button" role="menuitem" onClick={() => setMenuOpen(false)}>Search in chat</button>
            <button class="btn-menu-item danger" type="button" role="menuitem" onClick={() => setDialogOpen(true)}>Delete conversation</button>
          </div>
        </Show>

        <Show when={dialogOpen() || surface() === 'dialogs'}>
          <div class="popup popup-confirmation" role="dialog" aria-modal="true" aria-labelledby="preview-dialog-title">
            <div class="popup-container">
              <div class="popup-header-background"><h2 id="preview-dialog-title">Delete conversation?</h2></div>
              <p class="popup-description">This fixture action does not contact Telegram.</p>
              <div class="popup-footer">
                <button class="popup-footer-button btn-primary" type="button" onClick={() => setDialogOpen(false)}>Cancel</button>
                <button class="popup-footer-button" type="button" onClick={() => setDialogOpen(false)}>Delete</button>
              </div>
            </div>
          </div>
        </Show>
      </section>
    </main>
  );
}

export function startCupertinoPreview() {
  applyDesignSystem('cupertino');
  const container = document.createElement('div');
  container.id = 'cupertino-preview-root';
  document.body.replaceChildren(container);
  const dispose = render(() => <CupertinoPreview />, container);
  let resolveReady: () => void;
  const ready = new Promise<void>((resolve) => { resolveReady = resolve; });
  const api = {
    ready: () => ready,
    show: () => container.removeAttribute('hidden'),
    setSystem: (value: DesignSystemId) => window.dispatchEvent(new CustomEvent('cupertino-preview-control', {detail: {key: 'system', value}})),
    setTheme: (value: Theme) => window.dispatchEvent(new CustomEvent('cupertino-preview-control', {detail: {key: 'theme', value}})),
    setDirection: (value: 'ltr' | 'rtl') => window.dispatchEvent(new CustomEvent('cupertino-preview-control', {detail: {key: 'direction', value}})),
    setViewport: (value: Viewport) => window.dispatchEvent(new CustomEvent('cupertino-preview-control', {detail: {key: 'viewport', value}})),
    open: (value: Surface) => window.dispatchEvent(new CustomEvent('cupertino-preview-control', {detail: {key: 'surface', value}})),
    close: () => { dispose(); container.remove(); }
  };
  (window as any).cupertinoPreview = api;
  resolveReady();
  return api;
}
