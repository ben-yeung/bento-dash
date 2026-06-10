import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { WidgetCarousel } from './WidgetCarousel';
import { useDragStore } from '@/lib/state/dragStore';
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';

vi.mock('@/lib/state/boardStore', () => ({
  useBoard: vi.fn(),
}));

const mockAddWidget = vi.fn();

function Wrapper({ children }: { children: React.ReactNode }) {
  return <DndContext>{children}</DndContext>;
}

describe('WidgetCarousel', () => {
  beforeEach(() => {
    vi.mocked(useBoard).mockImplementation((sel: any) =>
      sel({ widgets: [], addWidget: mockAddWidget, moveWidget: vi.fn(), removeWidget: vi.fn(), resizeWidget: vi.fn(), reResolve: vi.fn(), setWidgets: vi.fn() }),
    );
    useSettings.setState({ layoutMode: 'autoPack' });
    useDragStore.setState({ fabOpen: true });
    mockAddWidget.mockClear();
  });

  it('renders all 4 widget cards', () => {
    render(<Wrapper><WidgetCarousel onClose={vi.fn()} /></Wrapper>);
    // Cards have aria-label with their names, cards have no "Filter:" prefix
    expect(screen.getByRole('button', { name: 'Finance' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Health' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Calendar' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Lifestyle' })).toBeDefined();
  });

  it('clicking a card opens its size picker', async () => {
    render(<Wrapper><WidgetCarousel onClose={vi.fn()} /></Wrapper>);
    // Click card button with aria-expanded
    const financeCard = screen.getByRole('button', { name: 'Finance' });
    await userEvent.click(financeCard);
    expect(screen.getByRole('button', { name: '1×1' })).toBeDefined();
  });

  it('clicking a second card closes the first picker and opens the new one', async () => {
    render(<Wrapper><WidgetCarousel onClose={vi.fn()} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'Finance' }));
    expect(screen.getByRole('button', { name: '1×1' })).toBeDefined();
    const healthButton = screen.getByRole('button', { name: 'Health' });
    await userEvent.click(healthButton);
    // Finance size chips gone (Finance has 2×1 which Health doesn't), Health chips appear
    // Wait for the 2×1 button to disappear from the DOM
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '2×1' })).toBeNull();
    });
    expect(screen.getByRole('button', { name: '1×1' })).toBeDefined(); // health also has 1x1
  });

  it('clicking a size chip calls addWidget and then onClose', async () => {
    const onClose = vi.fn();
    render(<Wrapper><WidgetCarousel onClose={onClose} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'Finance' }));
    // Size chips are draggable, so we need to dispatch a click event
    const allButtons = screen.getAllByRole('button', { name: '1×1' });
    const sizeChipButton = allButtons.find(btn => btn.hasAttribute('data-dragging'));
    if (sizeChipButton) {
      sizeChipButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
    expect(mockAddWidget).toHaveBeenCalledWith('finance', 1, 1);
    expect(onClose).toHaveBeenCalled();
  });

  it('filter chip "Health" shows only Health card', async () => {
    render(<Wrapper><WidgetCarousel onClose={vi.fn()} /></Wrapper>);
    // Click filter chip with aria-label containing "Filter:"
    await userEvent.click(screen.getByRole('button', { name: /Filter: Health/i }));
    // Finance card button should be gone
    expect(screen.queryByRole('button', { name: 'Finance' })).toBeNull();
    // Health card button should still be there
    expect(screen.getByRole('button', { name: 'Health' })).toBeDefined();
  });
});
