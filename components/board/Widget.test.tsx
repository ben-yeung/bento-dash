import { describe, it, expect, beforeEach } from 'vitest';
import { type ComponentProps } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { Widget } from './Widget';
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';
import type { WidgetLayout } from '@/lib/grid/types';

const w: WidgetLayout = { id: 'x1', x: 0, y: 0, w: 1, h: 1, category: 'finance', widgetType: 'budget-summary', order: 0 };

function renderWidget(props: Partial<ComponentProps<typeof Widget>> = {}) {
  return render(
    <DndContext>
      <Widget widget={w} {...props} />
    </DndContext>,
  );
}

describe('Widget delete control', () => {
  beforeEach(() => {
    useSettings.setState({ layoutMode: 'autoPack', activeTags: [] });
    useBoard.setState({ widgets: [w] });
  });

  it('does not render the × outside manage mode', () => {
    renderWidget({ manageMode: false });
    expect(screen.queryByRole('button', { name: 'Delete widget' })).toBeNull();
  });

  it('renders the × in manage mode and removes the widget on click', async () => {
    renderWidget({ manageMode: true });
    const close = screen.getByRole('button', { name: 'Delete widget' });
    await userEvent.click(close);
    expect(useBoard.getState().widgets.find((x) => x.id === 'x1')).toBeUndefined();
  });

  it('stops pointer-down propagation on the × (so it cannot start a drag)', () => {
    let parentSawPointerDown = false;
    render(
      <DndContext>
        <div onPointerDown={() => { parentSawPointerDown = true; }}>
          <Widget widget={w} manageMode />
        </div>
      </DndContext>,
    );
    const close = screen.getByRole('button', { name: 'Delete widget' });
    fireEvent.pointerDown(close);
    expect(parentSawPointerDown).toBe(false);
  });
});

describe('Widget swap target', () => {
  it('renders without crashing', () => {
    const { container } = renderWidget();
    expect(container.firstChild).toBeTruthy();
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
