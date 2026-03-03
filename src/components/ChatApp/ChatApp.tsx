import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { RootState, useAppDispatch } from '../../reducers';
import {
  addMessage,
  loadConfiguration,
  showQueryHistory,
} from '../../reducers/chat/slice';
import { SnowflakeConfig } from '../../services/configService';
import ChatContainer from '../ChatContainer/ChatContainer';
import ConfigPanel from '../ConfigPanel/ConfigPanel';
import QueryResultsPanel from '../QueryResultsPanel/QueryResultsPanel';
import RecentQueries from '../RecentQueries/RecentQueries';
import styles from './ChatApp.module.scss';

const ChatApp = () => {
  const dispatch = useAppDispatch();
  const { isConfigPanelOpen, showQueryResults, currentTableData } = useSelector(
    (state: RootState) => state.chat,
  );

  const handleCloseResults = () => {
    dispatch(showQueryHistory());
  };

  useEffect(() => {
    // Load configuration on mount
    dispatch(loadConfiguration()).then((result) => {
      if (result.type === loadConfiguration.fulfilled.type && result.payload) {
        const config = result.payload as SnowflakeConfig | null;
        if (!config || Object.keys(config).length === 0) {
          dispatch(
            addMessage({
              sender: 'bot',
              content:
                'Welcome! To get started, please configure your Snowflake settings by clicking the Settings button above. ' +
                "You'll need to provide your database, schema, role, warehouse, and view information.",
            }),
          );
        } else {
          dispatch(
            addMessage({
              sender: 'bot',
              content:
                `Configuration loaded! Connected to ${config.snowflake_database}.${config.snowflake_schema} ` +
                `with role ${config.snowflake_role}. How can I help you analyze your data?`,
            }),
          );
        }
      } else {
        dispatch(
          addMessage({
            sender: 'bot',
            content:
              'Welcome! To get started, please configure your Snowflake settings by clicking the Settings button above. ' +
              "You'll need to provide your database, schema, role, warehouse, and view information.",
          }),
        );
      }
    });
  }, [dispatch]);

  return (
    <div className={styles.appContainer}>
      <ChatContainer />
      <div style={{ display: showQueryResults ? 'none' : 'flex', flex: 1 }}>
        <RecentQueries />
      </div>
      {currentTableData && (
        <div style={{ display: showQueryResults ? 'flex' : 'none', flex: 1 }}>
          <QueryResultsPanel
            queryText={currentTableData?.queryText}
            onClose={handleCloseResults}
          />
        </div>
      )}
      {isConfigPanelOpen && <ConfigPanel />}
    </div>
  );
};

export default ChatApp;
