import styles from './WidgetSkeleton.module.css';
import type { Category } from '@/lib/grid/types';

export interface WidgetContentProps {
  category: Category;
  w: number;
  h: number;
}

export function WidgetSkeleton({ category }: WidgetContentProps) {
  return (
    <div className={styles.body}>
      <span className={styles.dot} />
      {category}
    </div>
  );
}
