'use client';
import React, { useEffect, useRef, useState } from 'react';
import styles from './CreditsModal.module.css';

function NextjsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z" />
    </svg>
  );
}

function ReactIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="2.05" fill="#61DAFB" />
      <ellipse cx="12" cy="12" rx="10" ry="3.5" stroke="#61DAFB" strokeWidth="1.2" />
      <ellipse cx="12" cy="12" rx="10" ry="3.5" stroke="#61DAFB" strokeWidth="1.2" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="3.5" stroke="#61DAFB" strokeWidth="1.2" transform="rotate(120 12 12)" />
    </svg>
  );
}

function ZustandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="6" r="2.5" />
      <circle cx="16" cy="6" r="2.5" />
      <circle cx="12" cy="13" r="6.5" />
      <circle cx="10" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <path d="M10 15.5q2 1 4 0" />
    </svg>
  );
}

function DndKitIcon() {
  return (
    <svg viewBox="53 37 85 84" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M137.362 37V60.797H130.472V48.606L108.793 70L103.922 65.193L125.601 43.799H113.247V37H137.362ZM77.116 37V43.799H64.762L86.441 65.193L81.57 70L59.891 48.606V60.797H53V37H77.116ZM108.793 87.25L130.472 108.643V96.453H137.362V120.25H113.247V113.451H125.601L103.922 92.057L108.793 87.25ZM104.18 64.75L109.242 69.469L64.857 113.376H77.311V120.25H53V96.192H59.946V108.516L104.18 64.75Z" />
    </svg>
  );
}

function LucideIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path stroke="currentColor" d="M14 12C14 9.79 12.21 8 10 8C7.79 8 6 9.79 6 12C6 16.42 9.58 20 14 20C18.42 20 22 16.42 22 12C22 8.45 20.46 5.25 18 3.06" />
      <path stroke="#F56565" d="M10 12C10 14.21 11.79 16 14 16C16.21 16 18 14.21 18 12C18 7.58 14.42 4 10 4C5.58 4 2 7.58 2 12C2 15.58 3.57 18.8 6.06 21" />
    </svg>
  );
}

function MotionIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" />
    </svg>
  );
}

const LIBS = [
  { name: 'Next.js',  url: 'https://nextjs.org',               Icon: NextjsIcon  },
  { name: 'React',    url: 'https://react.dev',                 Icon: ReactIcon   },
  { name: 'Zustand',  url: 'https://zustand-demo.pmnd.rs',      Icon: ZustandIcon },
  { name: 'dnd-kit',  url: 'https://dndkit.com',                Icon: DndKitIcon  },
  { name: 'Lucide',   url: 'https://lucide.dev',                Icon: LucideIcon  },
  { name: 'Motion',   url: 'https://motion.dev',                Icon: MotionIcon  },
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
        dialog.style.left = `${rect.left}px`;
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
          {LIBS.map(({ name, url, Icon }) => (
            <li key={name} className={styles.item}>
              <Icon />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {name}
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
