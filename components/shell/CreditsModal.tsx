'use client';
import React, { useEffect, useRef, useState } from 'react';
import styles from './CreditsModal.module.css';

const LIBS = [
  { name: 'Next.js',  url: 'https://nextjs.org' },
  { name: 'React',    url: 'https://react.dev' },
  { name: 'Zustand',  url: 'https://zustand-demo.pmnd.rs' },
  { name: 'dnd-kit',  url: 'https://dndkit.com' },
  { name: 'Lucide',   url: 'https://lucide.dev' },
  { name: 'Motion',   url: 'https://motion.dev' },
];

export function CreditsModal({
  open,
  onClose,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (anchorRef?.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        // Set position synchronously before showModal so the dialog opens in the right place
        dialog.style.bottom = `${window.innerHeight - rect.bottom}px`;
        dialog.style.left = `${rect.right + 8}px`;
      }
      dialog.showModal();
      setEntering(true);
      setTimeout(() => setEntering(false), 160);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, anchorRef]);

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 120);
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === ref.current) handleClose();
  }

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog}${entering ? ` ${styles.open}` : ''}${closing ? ` ${styles.closing}` : ''}`}
      onCancel={(e) => { e.preventDefault(); handleClose(); }}
      onClick={handleBackdropClick}
      aria-label="Credits"
    >
      <div className={styles.content}>
        <p className={styles.heading}>Built with</p>
        <ul className={styles.list}>
          {LIBS.map((lib) => (
            <li key={lib.name}>
              <a
                href={lib.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {lib.name}
              </a>
            </li>
          ))}
        </ul>
        <div className={styles.divider} />
        <a
          href="https://github.com/ben-yeung/bento-dash"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.github}
        >
          github.com/ben-yeung/bento-dash
        </a>
      </div>
    </dialog>
  );
}
