import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreditsModal } from './CreditsModal';

// jsdom does not implement showModal/close on HTMLDialogElement
let originalShowModal: any;
let originalClose: any;

beforeAll(() => {
  originalShowModal = HTMLDialogElement.prototype.showModal;
  originalClose = HTMLDialogElement.prototype.close;
  HTMLDialogElement.prototype.showModal = vi.fn(function(this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function(this: HTMLDialogElement) {
    this.open = false;
  });
});

afterEach(() => {
  // Restore original mocks after each test
  HTMLDialogElement.prototype.showModal = vi.fn(function(this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function(this: HTMLDialogElement) {
    this.open = false;
  });
});

describe('CreditsModal', () => {
  it('renders all library links when open', () => {
    render(<CreditsModal open onClose={() => {}} />);
    expect(screen.getByRole('link', { name: 'Next.js' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'React' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Zustand' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'dnd-kit' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Lucide' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Motion' })).toBeTruthy();
  });

  it('each library link opens in a new tab with rel', () => {
    render(<CreditsModal open onClose={() => {}} />);
    const link = screen.getByRole('link', { name: 'Next.js' });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('calls showModal when open is true', () => {
    const showModal = vi.fn();
    HTMLDialogElement.prototype.showModal = showModal;
    render(<CreditsModal open onClose={() => {}} />);
    expect(showModal).toHaveBeenCalled();
  });

  it('includes the GitHub repository link', () => {
    render(<CreditsModal open onClose={() => {}} />);
    const link = screen.getByRole('link', { name: /github\.com\/ben-yeung\/bento-dash/i });
    expect(link.getAttribute('href')).toBe('https://github.com/ben-yeung/bento-dash');
    expect(link.getAttribute('target')).toBe('_blank');
  });
});
