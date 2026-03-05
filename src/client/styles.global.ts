import { css } from "lit";

export const globalStyles = css`
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
