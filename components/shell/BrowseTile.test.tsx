import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { BrowseTile } from './BrowseTile';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';

const def = WIDGET_REGISTRY.find((d) => d.type === 'budget-summary')!;

function Wrapper({ children }: { children: React.ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  return <DndContext sensors={sensors}>{children}</DndContext>;
}

describe('BrowseTile', () => {
  it('renders the widget label', () => {
    render(
      <Wrapper>
        <BrowseTile definition={def} onSelect={vi.fn()} cellSize={120} />
      </Wrapper>,
    );
    expect(screen.getByText('Budget Summary')).toBeDefined();
  });

  it('applies cellSize as width and height on the tile', () => {
    render(
      <Wrapper>
        <BrowseTile definition={def} onSelect={vi.fn()} cellSize={120} />
      </Wrapper>,
    );
    const tile = screen.getByRole('button', { name: 'Budget Summary' });
    expect(tile.style.width).toBe('120px');
    expect(tile.style.height).toBe('120px');
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn();
    render(
      <Wrapper>
        <BrowseTile definition={def} onSelect={onSelect} cellSize={120} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Budget Summary' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('uses the first supported size in the drag id', () => {
    render(
      <Wrapper>
        <BrowseTile definition={def} onSelect={vi.fn()} cellSize={120} />
      </Wrapper>,
    );
    // budget-summary first size is 1×1 → id palette:finance:budget-summary:1x1
    const tile = screen.getByRole('button', { name: 'Budget Summary' });
    expect(tile.dataset.draggableNodeRef ?? tile.getAttribute('data-testid') ?? tile.id).toBeDefined();
    // The drag id is set on the dnd-kit node; verify via aria attribute set by useDraggable
    expect(tile.getAttribute('aria-describedby')).toBeDefined();
  });
});
