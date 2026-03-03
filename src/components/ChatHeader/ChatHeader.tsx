import { RotateCcw, Settings } from 'lucide-react';
import { useSelector } from 'react-redux';

import { RootState, useAppDispatch } from '../../reducers';
import { clearConversation, openConfigPanel } from '../../reducers/chat/slice';
import ConfigStatus from '../ConfigStatus/ConfigStatus';
import styles from './ChatHeader.module.scss';

const ChatHeader = () => {
  const dispatch = useAppDispatch();
  const { config, messages } = useSelector((state: RootState) => state.chat);

  const handleConfigClick = () => {
    dispatch(openConfigPanel());
  };

  const handleClearConversation = () => {
    if (
      confirm(
        'Clear conversation history? This will reset the context for Cortex Analyst.',
      )
    ) {
      dispatch(clearConversation());
    }
  };

  const isConfigured = config && Object.keys(config).length > 0;
  const hasMessages = messages.length > 0;

  return (
    <div className={styles.chatHeader}>
      <ConfigStatus />
      <div className={styles.headerButtons}>
        {hasMessages && (
          <button
            className={styles.clearButton}
            onClick={handleClearConversation}
            aria-label="Clear conversation"
            title="Clear conversation history and reset context"
          >
            <RotateCcw className={styles.clearIcon} />
          </button>
        )}
        <button
          className={`${styles.configButton} ${!isConfigured ? styles.unconfigured : ''}`}
          onClick={handleConfigClick}
          aria-label={
            isConfigured
              ? 'Settings - Configuration loaded'
              : 'Settings - Configuration required'
          }
          title={
            isConfigured
              ? 'Configuration loaded - Click to modify'
              : 'Configuration required - Click to configure'
          }
        >
          <Settings className={styles.settingsIcon} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
