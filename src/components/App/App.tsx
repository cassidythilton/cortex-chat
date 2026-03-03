import { FC } from 'react';

import AppHeader from '../AppHeader/AppHeader';
import ChatApp from '../ChatApp/ChatApp';
import styles from './App.module.scss';

export const App: FC = () => (
  <div className={styles.App}>
    <AppHeader />
    <ChatApp />
  </div>
);
