import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { Fab } from './Fab';
import { useDragStore } from '@/lib/state/dragStore';
import { useBoard } from '@/lib/state/boardStore';

vi.mock('./WidgetCarousel', () => ({
  WidgetCarousel: ({ onClose }: { cellSize: number; onClose: () => void }) => (
    <div data-testid="carousel">
      <button onClick={onClose}>close-carousel</button>
    </div>
  ),
}));

vi.mock('@/lib/state/boardStore', () => ({
  useBoard: vi.fn(),
}));

vi.mocked(useBoard).mockImplementation((sel: any) =>
  sel({ widgets: [], addWidget: vi.fn(), moveWidget: vi.fn(), removeWidget: vi.fn(), resizeWidget: vi.fn(), reResolve: vi.fn(), setWidgets: vi.fn() }),
);

function Wrapper({ children }: { children: React.ReactNode }) {
  return <DndContext>{children}</DndContext>;
}

describe('Fab', () => {
  beforeEach(() => {
    useDragStore.setState({ fabOpen: false });
  });

  it('renders the + button when closed', () => {
    render(<Wrapper><Fab cellSize={64} /></Wrapper>);
    expect(screen.getByRole('button', { name: /open widget menu/i })).toBeDefined();
    expect(screen.queryByTestId('carousel')).toBeNull();
  });

  it('opens the carousel when the FAB is clicked', async () => {
    render(<Wrapper><Fab cellSize={64} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: /open widget menu/i }));
    expect(useDragStore.getState().fabOpen).toBe(true);
    expect(screen.getByTestId('carousel')).toBeDefined();
  });

  it('closes the carousel when the close button inside it is clicked', async () => {
    useDragStore.setState({ fabOpen: true });
    render(<Wrapper><Fab cellSize={64} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'close-carousel' }));
    expect(useDragStore.getState().fabOpen).toBe(false);
  });

  it('closes when the backdrop is clicked', async () => {
    useDragStore.setState({ fabOpen: true });
    render(<Wrapper><Fab cellSize={64} /></Wrapper>);
    await userEvent.click(screen.getByTestId('fab-backdrop'));
    expect(useDragStore.getState().fabOpen).toBe(false);
  });
});
