import { css } from "lit";

export const globalStyles = css`
  /* Style guide:
   * - Prefer composing these shared card/modal/button utility classes before creating component-local variants.
   * - Keep customizations as variable overrides or small modifier classes near the component.
   */
  :host {
    display: block;
  }

  h1 {
    font-family: var(--font-family-display);
    font-size: var(--font-xl);
    color: var(--color-primary-text-bold);
    margin: 0 0 1rem 0;
    letter-spacing: 0.02em;
  }

  h2 {
    font-family: var(--font-family-display);
    font-size: var(--font-large);
    color: var(--color-primary-text-bold);
    margin: 0 0 0.75rem 0;
  }

  h3 {
    font-size: var(--font-medium);
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  p {
    font-size: var(--font-medium);
    line-height: var(--line-height);
    margin: 0 0 1rem 0;
  }

  a {
    color: var(--color-2);
    text-decoration: none;
    transition: var(--transition-fast);
  }

  a:hover {
    color: var(--color-1);
  }

  main {
    max-width: var(--content-width);
    margin: 0 auto;
    padding: var(--size-large);
  }

  .card {
    background: var(--color-primary-surface-raised);
    border: var(--border-normal);
    border-radius: var(--border-radius-medium);
    padding: var(--size-large);
    transition: var(--transition-all);
  }

  .card:hover {
    border-color: rgba(201, 168, 76, 0.35);
    box-shadow: var(--shadow-glow);
    transform: translateY(-2px);
  }

  .card-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  .card-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    min-height: 48px;
  }

  .card-row-body {
    flex: 1;
  }

  .card-row-title {
    font-family: var(--font-family-display);
    font-size: var(--font-medium);
    color: var(--color-primary-text);
    margin: 0;
    font-weight: 600;
  }

  .card-row-count {
    font-size: var(--font-small);
    color: var(--color-primary-text-muted);
  }

  .card-row-arrow {
    color: var(--color-primary-text-muted);
    transition: var(--transition-fast);
  }

  .card-row:hover .card-row-arrow {
    color: var(--color-1);
    transform: translateX(4px);
  }

  .card-row:hover .card-row-title {
    color: var(--color-1);
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: var(--modal-overlay-bg, rgba(0, 0, 0, 0.65));
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal-surface {
    width: min(var(--modal-max-width, 760px), 100%);
    background: var(--color-primary-surface-raised);
    border: var(--modal-border, var(--border-normal));
    border-radius: var(--border-radius-medium);
    padding: var(--modal-padding, var(--size-large));
    box-shadow: var(--modal-shadow, var(--shadow-medium));
    display: grid;
    gap: var(--modal-gap, var(--size-medium));
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--size-small);
  }

  .modal-close {
    border: none;
    background: none;
    color: var(--color-primary-text-muted);
    cursor: pointer;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--size-small);
  }

  .form-input {
    width: 100%;
    box-sizing: border-box;
    padding: var(--form-input-padding, 10px 12px);
    border-radius: var(--border-radius-small);
    border: var(--form-input-border, var(--border-normal));
    background: var(--color-primary-surface-overlay);
    color: var(--color-primary-text);
    font-family: var(--font-family);
    font-size: var(--font-medium);
    outline: none;
    transition: var(--transition-fast);
  }

  .form-input:focus {
    border-color: var(--color-1);
    box-shadow: var(--shadow-glow);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: var(--border-radius-small);
    border: 1px solid var(--color-1);
    background: transparent;
    color: var(--color-1);
    font-family: var(--font-family);
    font-size: var(--font-small);
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition-fast);
    text-decoration: none;
  }

  .btn:hover {
    background: var(--color-1);
    color: var(--color-primary-surface);
  }

  .btn-primary {
    background: var(--color-1);
    color: var(--color-primary-surface);
  }

  .btn-primary:hover {
    background: #d4b555;
    border-color: #d4b555;
  }

  .muted {
    color: var(--color-primary-text-muted);
    font-size: var(--font-small);
  }
`;
