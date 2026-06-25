import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { WidgetCarousel } from './WidgetCarousel';
import { useDragStore } from '@/lib/state/dragStore';
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';

vi.mock('@/lib/state/boardStore', () => ({
  useBoard: vi.fn(),
}));

const mockAddWidget = vi.fn();

// Mirror the production sensor: a 4px activation distance lets a card click
// (no pointer movement) open the size picker instead of starting a drag.
function Wrapper({ children }: { children: React.ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  return <DndContext sensors={sensors}>{children}</DndContext>;
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

  it('renders all 10 widget cards', () => {
    render(<Wrapper><WidgetCarousel cellSize={64} onClose={vi.fn()} /></Wrapper>);
    // Cards have aria-label with their names, cards have no "Filter:" prefix
    expect(screen.getByRole('button', { name: 'Budget Summary' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Activity Rings' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Calories' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Steps' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Upcoming Events' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Mini Calendar' })).toBeDefined();
    expect(screen.getByRole('button', { name: "Today's Schedule" })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Habit Tracker' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Weather' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Daily Note' })).toBeDefined();
  });

  it('clicking a card opens its size picker', async () => {
    render(<Wrapper><WidgetCarousel cellSize={64} onClose={vi.fn()} /></Wrapper>);
    // Click card button with aria-expanded
    const budgetCard = screen.getByRole('button', { name: 'Budget Summary' });
    await userEvent.click(budgetCard);
    expect(screen.getByRole('button', { name: '1×1' })).toBeDefined();
  });

  it('clicking a second card closes the first picker and opens the new one', async () => {
    render(<Wrapper><WidgetCarousel cellSize={64} onClose={vi.fn()} /></Wrapper>);
    // Activity Rings has 2×1; Budget Summary does not.
    // Open Activity Rings first (has 2×1), then switch to Budget Summary (2×1 disappears).
    await userEvent.click(screen.getByRole('button', { name: 'Activity Rings' }));
    expect(screen.getByRole('button', { name: '2×1' })).toBeDefined();
    const budgetButton = screen.getByRole('button', { name: 'Budget Summary' });
    await userEvent.click(budgetButton);
    // Activity Rings size chips gone (Activity Rings has 2×1 which Budget Summary doesn't)
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '2×1' })).toBeNull();
    });
    expect(screen.getByRole('button', { name: '1×1' })).toBeDefined(); // budget-summary also has 1×1
  });

  it('clicking a size chip calls addWidget and then onClose', async () => {
    const onClose = vi.fn();
    render(<Wrapper><WidgetCarousel cellSize={64} onClose={onClose} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'Budget Summary' }));
    await userEvent.click(screen.getByRole('button', { name: '1×1' }));
    expect(mockAddWidget).toHaveBeenCalledWith('finance', 'budget-summary', 1, 1);
    expect(onClose).toHaveBeenCalled();
  });

  it('filter chip "Health" shows only Health cards', async () => {
    render(<Wrapper><WidgetCarousel cellSize={64} onClose={vi.fn()} /></Wrapper>);
    // Click filter chip with aria-label containing "Filter:"
    await userEvent.click(screen.getByRole('button', { name: /Filter: Health/i }));
    // Finance card button should be gone
    expect(screen.queryByRole('button', { name: 'Budget Summary' })).toBeNull();
    // Health card buttons should still be there
    expect(screen.getByRole('button', { name: 'Activity Rings' })).toBeDefined();
  });
});
