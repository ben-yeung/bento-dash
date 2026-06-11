import { describe, it, expect, beforeEach } from 'vitest';
import { useBoard } from './boardStore';
import { useSettings } from './settingsStore';

describe('boardStore', () => {
  beforeEach(() => {
    useSettings.setState({ layoutMode: 'autoPack' });
    useBoard.setState({ widgets: [] });
  });

  it('adds a widget and resolves a non-overlapping layout', () => {
    useBoard.getState().addWidget('finance', 2, 2);
    useBoard.getState().addWidget('health', 2, 2);
    const ws = useBoard.getState().widgets;
    expect(ws).toHaveLength(2);
    expect(ws[0]).toMatchObject({ x: 0, y: 0 });
    expect(ws[1]).toMatchObject({ x: 2, y: 0 });
  });

  it('removes a widget and heals the layout', () => {
    useBoard.getState().addWidget('finance', 1, 1);
    useBoard.getState().addWidget('health', 1, 1);
    const id = useBoard.getState().widgets[0].id;
    useBoard.getState().removeWidget(id);
    expect(useBoard.getState().widgets).toHaveLength(1);
    expect(useBoard.getState().widgets[0]).toMatchObject({ x: 0, y: 0 });
  });

  it('resizes a widget through the active strategy', () => {
    useBoard.getState().addWidget('finance', 1, 1);
    const id = useBoard.getState().widgets[0].id;
    useBoard.getState().resizeWidget(id, 3, 3);
    expect(useBoard.getState().widgets[0]).toMatchObject({ w: 3, h: 3 });
  });

  it('places a widget at the target cell when targetCell is provided (pushCompact)', () => {
    useSettings.setState({ layoutMode: 'pushCompact' });
    useBoard.getState().addWidget('calendar', 1, 1, { x: 4, y: 0 });
    const ws = useBoard.getState().widgets;
    expect(ws).toHaveLength(1);
    expect(ws[0]).toMatchObject({ x: 4, y: 0 });
  });

  it('prunes activeTags when the last widget of an active tag is removed', () => {
    useSettings.setState({ activeTags: ['finance', 'health'] });
    useBoard.getState().addWidget('finance', 1, 1);
    useBoard.getState().addWidget('health', 1, 1);
    const healthId = useBoard.getState().widgets.find((w) => w.category === 'health')!.id;
    useBoard.getState().removeWidget(healthId);
    expect(useSettings.getState().activeTags).toEqual(['finance']);
  });

  it('leaves activeTags untouched when the removed widget tag still has siblings', () => {
    useSettings.setState({ activeTags: ['finance'] });
    useBoard.getState().addWidget('finance', 1, 1);
    useBoard.getState().addWidget('finance', 1, 1);
    const id = useBoard.getState().widgets[0].id;
    useBoard.getState().removeWidget(id);
    expect(useSettings.getState().activeTags).toEqual(['finance']);
  });

  it('swapWidgets exchanges the positions of two widgets', () => {
    useBoard.getState().addWidget('finance', 2, 1);
    useBoard.getState().addWidget('health', 2, 1);
    const before = useBoard.getState().widgets;
    const [a, b] = before;
    // autoPack places them at x:0,y:0 and x:2,y:0
    useBoard.getState().swapWidgets(a.id, b.id);
    const after = useBoard.getState().widgets;
    expect(after.find((w) => w.id === a.id)).toMatchObject({ x: b.x, y: b.y });
    expect(after.find((w) => w.id === b.id)).toMatchObject({ x: a.x, y: a.y });
  });
});
