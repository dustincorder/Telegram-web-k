import {i18n, LangPackKey} from '@lib/langPack';

/**
 * Cupertino sidebar navigation block: the large navigation title and the
 * search row under it — the pieces iOS puts below the nav bar (Mail /
 * Messages). It is the structural replacement for Web K's single header bar
 * that crams the menu button and the search field into one row.
 *
 * Only mounted while the Cupertino design system is active (AppSidebarLeft
 * owns mounting and restoring). The search field is the app's real
 * InputSearch instance, adopted (moved) out of the nav bar for the duration
 * and restored to it on dispose, so Classic and Material 3 keep their
 * original header untouched.
 */
export default function CupertinoSidebarNav(props: {
  titleKey: LangPackKey,
  searchContainer: HTMLElement
}) {
  return (
    <div class="cupertino-nav">
      <h2 class="cupertino-nav-title">
        <span class="cupertino-large-title-text">{i18n(props.titleKey)}</span>
      </h2>
      <div
        class="cupertino-nav-search"
        ref={(el: HTMLElement) => el.append(props.searchContainer)}
      />
    </div>
  );
}
