import { describe, it, expect, vi } from 'vitest';
import { type ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { Widget } from './Widget';
import type { WidgetLayout } from '@/lib/grid/types';

const w: WidgetLayout = { id: 'x1', x: 0, y: 0, w: 1, h: 1, category: 'finance', order: 0 };

function renderWidget(props: Partial<ComponentProps<typeof Widget>> = {}) {
  return render(
    <DndContext>
      <Widget widget={w} {...props} />
    </DndContext>,
  );
}

describe('Widget', () => {
  it('renders without crashing', () => {
    const { container } = renderWidget();
    expect(container.firstChild).toBeTruthy();
  });

  it('calls onMount with id and element on mount', () => {
    const onMount = vi.fn();
    renderWidget({ onMount });
    expect(onMount).toHaveBeenCalledWith('x1', expect.any(HTMLElement));
  });

  it('calls onUnmount with id on unmount', () => {
    const onUnmount = vi.fn();
    const { unmount } = renderWidget({ onUnmount });
    unmount();
    expect(onUnmount).toHaveBeenCalledWith('x1');
  });

  it('applies data-swap-target attribute when isSwapTarget is true', () => {
    const { container } = renderWidget({ isSwapTarget: true });
    const tile = container.querySelector('[data-swap-target="true"]');
    expect(tile).toBeTruthy();
  });

  it('does not apply data-swap-target when isSwapTarget is false (default)', () => {
    const { container } = renderWidget();
    const tile = container.querySelector('[data-swap-target="true"]');
    expect(tile).toBeNull();
  });
});
