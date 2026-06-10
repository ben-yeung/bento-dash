import styles from './WidgetSkeleton.module.css';
import type { Category } from '@/lib/grid/types';

export function WidgetSkeleton({ category }: { category: Category }) {
  return (
    <div className={styles.body}>
      <span className={styles.dot} />
      {category}
    </div>
  );
}
