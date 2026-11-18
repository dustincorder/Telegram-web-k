import {Show} from 'solid-js';
import {i18n, LangPackKey} from '@lib/langPack';
import useDesignSystem from '@stores/designSystem';
import classNames from '@helpers/string/classNames';

/**
 * iOS-style large navigation title. Structural Cupertino chrome: a full-width
 * 30px/700 title above the content it names, rendered only while the
 * Cupertino design system is active (it is unmounted otherwise, so Classic
 * and Material 3 never carry it). The chat list hides it together with itself
 * during search and tab navigation by being the parent transition item.
 */
export default function CupertinoLargeTitle(props: {
  key: LangPackKey,
  class?: string
}) {
  const [designSystem] = useDesignSystem();

  return (
    <Show when={designSystem() === 'cupertino'}>
      <div class={classNames('cupertino-large-title', props.class)} aria-hidden="true">
        <span class="cupertino-large-title-text">{i18n(props.key)}</span>
      </div>
    </Show>
  );
}
