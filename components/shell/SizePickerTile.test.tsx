import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SizePickerTile } from './SizePickerTile';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import { SIZE_PRESETS } from '@/lib/grid/sizes';

const def    = WIDGET_REGISTRY.find((d) => d.type === 'budget-summary')!;
const size2x2 = SIZE_PRESETS.find((s) => s.name === '2×2')!;
const size4x2 = SIZE_PRESETS.find((s) => s.name === '4×2')!;

function Wrapper({ children }: { children: React.ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  return <DndContext sensors={sensors}>{children}</DndContext>;
}

describe('SizePickerTile', () => {
  it('renders the dimension label', () => {
    render(
      <Wrapper>
        <SizePickerTile definition={def} size={size2x2} onAdd={vi.fn()} cellSize={120} gap={12} />
      </Wrapper>,
    );
    expect(screen.getByText('2 × 2')).toBeDefined();
  });

  it('applies proportional width and height for a 2×2 tile at cellSize=120 gap=12', () => {
    render(
      <Wrapper>
        <SizePickerTile definition={def} size={size2x2} onAdd={vi.fn()} cellSize={120} gap={12} />
      </Wrapper>,
    );
    const tile = screen.getByRole('button', { name: /2 × 2/i });
    // width = 2*120 + (2-1)*12 = 252
    expect(tile.style.width).toBe('252px');
    // height = 2*120 + (2-1)*12 = 252
    expect(tile.style.height).toBe('252px');
  });

  it('applies correct width and height for a 4×2 tile at cellSize=120 gap=12', () => {
    render(
      <Wrapper>
        <SizePickerTile definition={def} size={size4x2} onAdd={vi.fn()} cellSize={120} gap={12} />
      </Wrapper>,
    );
    const tile = screen.getByRole('button', { name: /4 × 2/i });
    // width = 4*120 + (4-1)*12 = 516
    expect(tile.style.width).toBe('516px');
    // height = 2*120 + (2-1)*12 = 252
    expect(tile.style.height).toBe('252px');
  });

  it('calls onAdd with correct w and h when clicked', async () => {
    const onAdd = vi.fn();
    render(
      <Wrapper>
        <SizePickerTile definition={def} size={size2x2} onAdd={onAdd} cellSize={120} gap={12} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole('button', { name: /2 × 2/i }));
    expect(onAdd).toHaveBeenCalledWith(2, 2);
  });
});
