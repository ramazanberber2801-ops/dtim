import { useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { LanguageSelector } from './LanguageSelector';

const roots = new WeakMap<Element, Root>();

function setReactInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function enhanceOwnerLanguageField() {
  const labels = Array.from(document.querySelectorAll('p'));
  const languageLabel = labels.find((element) => element.textContent?.trim().toLowerCase() === 'språk');
  if (!languageLabel) return;

  const field = languageLabel.parentElement;
  const input = field?.querySelector('input');
  if (!(input instanceof HTMLInputElement) || input.dataset.languageEnhanced === 'true') return;

  input.dataset.languageEnhanced = 'true';
  input.classList.add('hidden');

  const mount = document.createElement('div');
  mount.dataset.ownerLanguageSelector = 'true';
  input.insertAdjacentElement('afterend', mount);

  const root = createRoot(mount);
  roots.set(mount, root);

  const render = () => {
    root.render(
      <LanguageSelector
        compact
        value={input.value}
        onChange={(code) => {
          setReactInputValue(input, code);
          render();
        }}
      />,
    );
  };

  render();
  input.addEventListener('change', render);
}

export function OwnerLanguageSelectorEnhancer() {
  useEffect(() => {
    enhanceOwnerLanguageField();
    const observer = new MutationObserver(() => enhanceOwnerLanguageField());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
