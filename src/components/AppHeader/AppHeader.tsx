import { useEffect, useState } from 'react';

import styles from './AppHeader.module.scss';

const AppHeader = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    setIsDark(savedTheme === 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.branding}>
          <div className={styles.logos}>
            <img
              src="https://cdn.brandfetch.io/idJz-fGD_q/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B"
              alt="Domo"
              className={styles.logo}
            />
            <span className={styles.separator}>+</span>
            <img
              src="https://cdn.brandfetch.io/idvpz8K3OK/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B"
              alt="Snowflake"
              className={styles.logo}
            />
          </div>
          <h1 className={styles.title}>CORTEX ANALYST</h1>
        </div>

        <button
          onClick={toggleTheme}
          className={styles.themeToggle}
          aria-label="Toggle dark mode"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 3V1M10 19V17M17 10H19M1 10H3M15.657 4.343L17.071 2.929M2.929 17.071L4.343 15.657M15.657 15.657L17.071 17.071M2.929 2.929L4.343 4.343M14 10C14 12.2091 12.2091 14 10 14C7.79086 14 6 12.2091 6 10C6 7.79086 7.79086 6 10 6C12.2091 6 14 7.79086 14 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
