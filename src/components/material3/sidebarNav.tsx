import {onCleanup, onMount} from 'solid-js';
import I18n, {i18n, LangPackKey} from '@lib/langPack';
import Icon from '@components/icon';

/**
 * Material 3 sidebar navigation block: the top app bar label and the search
 * row under it — the M3 vertical slice for the sidebar. It is the structural
 * M3 replacement for Web K's single header bar that crams the menu button
 * and the search field into one row.
 *
 * Only mounted while the Material 3 design system is active (AppSidebarLeft
 * owns mounting and restoring). The search field is the app's real
 * InputSearch instance, adopted (moved) out of the nav bar for the duration
 * and restored to it on dispose, so Classic keeps its original header. The
 * trailing icon button is an official `@material/web` component
 * (`md-outlined-icon-button`, lazily registered by
 * `lib/designSystems/material3.ts`): it focuses the adopted field, i.e. the
 * M3 search affordance of the app bar.
 */
export default function Material3SidebarNav(props: {
  titleKey: LangPackKey,
  searchContainer: HTMLElement,
  onSearchTrigger: () => void
}) {
  let searchRow: HTMLDivElement | undefined;
  let triggerIcon: HTMLSpanElement | undefined;

  onMount(() => {
    searchRow?.append(props.searchContainer);
    triggerIcon?.append(Icon('search', 'md3-nav-trigger-icon'));
    onCleanup(() => {
      props.searchContainer.remove();
    });
  });

  return (
    <div class="md3-nav">
      <h2 class="md3-nav-title">{i18n(props.titleKey)}</h2>
      <div class="md3-nav-search" ref={searchRow}>
        <md-outlined-icon-button
          class="md3-nav-search-trigger"
          aria-label={I18n.format('Search', true)}
          onClick={() => props.onSearchTrigger()}
        >
          <span ref={triggerIcon} aria-hidden="true" />
        </md-outlined-icon-button>
      </div>
    </div>
  );
}
