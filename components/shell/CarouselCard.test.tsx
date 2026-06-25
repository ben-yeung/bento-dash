import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CarouselCard } from './CarouselCard';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';

const def = WIDGET_REGISTRY.find((d) => d.type === 'budget-summary')!;

// Mirror the production sensor: a 4px activation distance lets a click (no
// pointer movement) fall through to the preview's onClick instead of starting
// a drag.
function Wrapper({ children }: { children: React.ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  return <DndContext sensors={sensors}>{children}</DndContext>;
}

describe('CarouselCard', () => {
  it('renders the card label', () => {
    render(
      <Wrapper>
        <CarouselCard definition={def} isOpen={false} onToggle={vi.fn()} onAdd={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.getByText('Budget Summary')).toBeDefined();
  });

  it('calls onToggle when the card preview is clicked', async () => {
    const onToggle = vi.fn();
    render(
      <Wrapper>
        <CarouselCard definition={def} isOpen={false} onToggle={onToggle} onAdd={vi.fn()} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Budget Summary/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('shows size chips when isOpen is true', () => {
    render(
      <Wrapper>
        <CarouselCard definition={def} isOpen={true} onToggle={vi.fn()} onAdd={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.getByRole('button', { name: '1×1' })).toBeDefined();
    expect(screen.getByRole('button', { name: '2×2' })).toBeDefined();
  });

  it('hides size chips when isOpen is false', () => {
    render(
      <Wrapper>
        <CarouselCard definition={def} isOpen={false} onToggle={vi.fn()} onAdd={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.queryByRole('button', { name: '1×1' })).toBeNull();
  });

  it('calls onAdd with correct w,h when a size chip is clicked', async () => {
    const onAdd = vi.fn();
    render(
      <Wrapper>
        <CarouselCard definition={def} isOpen={true} onToggle={vi.fn()} onAdd={onAdd} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole('button', { name: '2×2' }));
    expect(onAdd).toHaveBeenCalledWith(2, 2);
  });
});
