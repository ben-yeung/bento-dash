import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { CarouselCard } from './CarouselCard';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import type { GridMetrics } from '@/lib/grid/collision';

const metrics: GridMetrics = { cellSize: 100, gap: 12, cols: 6 };
const def = WIDGET_REGISTRY.find((d) => d.type === 'finance')!;

function Wrapper({ children }: { children: React.ReactNode }) {
  return <DndContext>{children}</DndContext>;
}

describe('CarouselCard', () => {
  it('renders the card label', () => {
    render(
      <Wrapper>
        <CarouselCard definition={def} metrics={metrics} isOpen={false} onToggle={vi.fn()} onAdd={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.getByText('Finance')).toBeDefined();
  });

  it('calls onToggle when the card preview is clicked', async () => {
    const onToggle = vi.fn();
    render(
      <Wrapper>
        <CarouselCard definition={def} metrics={metrics} isOpen={false} onToggle={onToggle} onAdd={vi.fn()} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Finance/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('shows size chips when isOpen is true', () => {
    render(
      <Wrapper>
        <CarouselCard definition={def} metrics={metrics} isOpen={true} onToggle={vi.fn()} onAdd={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.getByRole('button', { name: '1×1' })).toBeDefined();
    expect(screen.getByRole('button', { name: '2×2' })).toBeDefined();
  });

  it('hides size chips when isOpen is false', () => {
    render(
      <Wrapper>
        <CarouselCard definition={def} metrics={metrics} isOpen={false} onToggle={vi.fn()} onAdd={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.queryByRole('button', { name: '1×1' })).toBeNull();
  });

  it('calls onAdd with correct w,h when a size chip is clicked', async () => {
    const onAdd = vi.fn();
    render(
      <Wrapper>
        <CarouselCard definition={def} metrics={metrics} isOpen={true} onToggle={vi.fn()} onAdd={onAdd} />
      </Wrapper>,
    );
    // Find the 2×2 size chip button
    const allButtons = screen.getAllByRole('button', { name: '2×2' });
    const sizeChipButton = allButtons.find(btn => btn.hasAttribute('data-dragging'));
    if (sizeChipButton) {
      sizeChipButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
    expect(onAdd).toHaveBeenCalledWith(2, 2);
  });
});
