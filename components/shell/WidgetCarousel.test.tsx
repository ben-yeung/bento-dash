import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { WidgetCarousel } from './WidgetCarousel';
import { useBoard } from '@/lib/state/boardStore';

vi.mock('@/lib/state/boardStore', () => ({ useBoard: vi.fn() }));

const mockAddWidget = vi.fn();

function Wrapper({ children }: { children: React.ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  return <DndContext sensors={sensors}>{children}</DndContext>;
}

describe('WidgetCarousel', () => {
  beforeEach(() => {
    vi.mocked(useBoard).mockImplementation((sel: any) =>
      sel({ widgets: [], addWidget: mockAddWidget, moveWidget: vi.fn(), removeWidget: vi.fn(), resizeWidget: vi.fn(), reResolve: vi.fn(), setWidgets: vi.fn() }),
    );
    mockAddWidget.mockClear();
  });

  it('renders all 10 widget tiles in browse state', () => {
    render(<Wrapper><WidgetCarousel cellSize={120} onClose={vi.fn()} /></Wrapper>);
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

  it('filter chip "Health" shows only Health widget tiles', async () => {
    render(<Wrapper><WidgetCarousel cellSize={120} onClose={vi.fn()} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: /Filter: Health/i }));
    expect(screen.queryByRole('button', { name: 'Budget Summary' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Activity Rings' })).toBeDefined();
  });

  it('clicking a tile transitions to size-picker for that widget', async () => {
    render(<Wrapper><WidgetCarousel cellSize={120} onClose={vi.fn()} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'Budget Summary' }));
    // Size-picker header shows "Budget Summary" as the title
    expect(screen.getByText('Budget Summary')).toBeDefined();
    // Back button is present
    expect(screen.getByRole('button', { name: /Widgets/i })).toBeDefined();
    // Browse tiles are gone
    expect(screen.queryByRole('button', { name: 'Activity Rings' })).toBeNull();
  });

  it('back button in size-picker returns to browse state', async () => {
    render(<Wrapper><WidgetCarousel cellSize={120} onClose={vi.fn()} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'Budget Summary' }));
    await userEvent.click(screen.getByRole('button', { name: /Widgets/i }));
    // Browse tiles are back
    expect(screen.getByRole('button', { name: 'Activity Rings' })).toBeDefined();
  });

  it('clicking a size tile in size-picker calls addWidget and onClose', async () => {
    const onClose = vi.fn();
    render(<Wrapper><WidgetCarousel cellSize={120} onClose={onClose} /></Wrapper>);
    // Enter size-picker for Budget Summary
    await userEvent.click(screen.getByRole('button', { name: 'Budget Summary' }));
    // Click the 2×2 size tile
    await userEvent.click(screen.getByRole('button', { name: '2 × 2' }));
    expect(mockAddWidget).toHaveBeenCalledWith('finance', 'budget-summary', 2, 2);
    expect(onClose).toHaveBeenCalled();
  });
});
