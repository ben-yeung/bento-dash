import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScaledWidgetContent } from './ScaledWidgetContent';
import type { WidgetContentProps } from './WidgetSkeleton';

function Stub({ category, w, h }: WidgetContentProps) {
  return <div data-testid="stub">{`${category}-${w}x${h}`}</div>;
}

describe('ScaledWidgetContent', () => {
  it('renders the given ContentComponent with the passed category, w, h', () => {
    render(
      <ScaledWidgetContent category="finance" w={3} h={2} ContentComponent={Stub} />,
    );
    expect(screen.getByTestId('stub')).toHaveTextContent('finance-3x2');
  });

  it('applies cell-size-relative scale tokens on its wrapper', () => {
    render(
      <ScaledWidgetContent category="finance" w={1} h={1} ContentComponent={Stub} />,
    );
    const wrapper = screen.getByTestId('stub').parentElement!;
    expect(wrapper.style.getPropertyValue('--w-font-title')).toContain('var(--cell-size');
  });
});
