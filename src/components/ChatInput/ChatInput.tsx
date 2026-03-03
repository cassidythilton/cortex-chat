import { Loader2, Send } from 'lucide-react';
import { KeyboardEvent, useState } from 'react';
import { useSelector } from 'react-redux';

import { RootState, useAppDispatch } from '../../reducers';
import {
  addMessage,
  openTableModal,
  saveRecentQuery,
  sendMessage,
} from '../../reducers/chat/slice';
import { AnalystResponse } from '../../services/domoService';
import ExampleQuestions from '../ExampleQuestions/ExampleQuestions';
import { ProcessAnimation } from '../ProcessAnimation/ProcessAnimation';
import styles from './ChatInput.module.scss';

const ChatInput = () => {
  const dispatch = useAppDispatch();
  const { isTyping, config, messages } = useSelector(
    (state: RootState) => state.chat,
  );
  const [message, setMessage] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);

  const handleExampleClick = (question: string) => {
    setMessage(question);
    // Auto-submit after a brief delay
    setTimeout(() => {
      handleSend(question);
    }, 100);
  };

  const handleSend = async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || message;
    if (!messageToSend.trim() || isTyping) return;

    const userMessage = messageToSend.trim();
    setMessage('');

    // Add user message
    dispatch(addMessage({ sender: 'user', content: userMessage }));

    // Show processing animation
    setShowAnimation(true);

    // Send message and handle response
    const result = await dispatch(sendMessage(userMessage));

    if (result.type === sendMessage.fulfilled.type) {
      const response = result.payload as AnalystResponse;

      // Add analyst interpretation
      if (response.analyst?.message?.content) {
        const textContents = response.analyst.message.content.filter(
          (c) => c.type === 'text',
        );
        if (textContents.length > 0) {
          const combinedText = textContents
            .map((c) => {
              const escaped = (c.text || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
              return escaped.replace(/\n\n+/g, '<br><br>').replace(/\n/g, ' ');
            })
            .join('<br><br>');

          dispatch(
            addMessage({
              sender: 'bot',
              content: `<strong>Analyst:</strong><br>${combinedText}`,
              isHTML: true,
            }),
          );
        }

        // Add suggestions if available
        const suggestionsContent = response.analyst.message.content.find(
          (c) => c.type === 'suggestions',
        );
        if (suggestionsContent && suggestionsContent.suggestions) {
          const suggestionsHTML = `
            <strong>Suggested questions:</strong>
            <div class="suggestions-container">
              ${suggestionsContent.suggestions.map((s) => `<button class="suggestion-button" onclick="window.handleSuggestionClick('${s.replace(/'/g, "\\'")}')">${s}</button>`).join('')}
            </div>
          `;
          dispatch(
            addMessage({
              sender: 'bot',
              content: suggestionsHTML,
              isHTML: true,
            }),
          );
        }
      }

      // Add SQL query (use logicalSql for display if available, otherwise use sql)
      const sqlToDisplay = response.logicalSql || response.sql;
      if (sqlToDisplay) {
        dispatch(
          addMessage({
            sender: 'bot',
            content: `**📝 Generated SQL:**\n\`\`\`sql\n${sqlToDisplay}\n\`\`\``,
          }),
        );
      }

      // Add results table
      if (response.columns && response.rows && response.rows.length > 0) {
        const tablePreviewHTML = `
          <div style="margin: 16px 0;">
            <strong>Query Results (${response.rows.length} rows):</strong>
            <div style="margin-top: 8px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0;">
                <strong>Columns:</strong> ${response.columns.join(', ')}
              </p>
              <p style="margin: 0;">
                Click to view full results in table →
              </p>
            </div>
          </div>
        `;

        dispatch(
          addMessage({
            sender: 'bot',
            content: tablePreviewHTML,
            isHTML: true,
          }),
        );

        // Open the table modal automatically
        const analystMessage =
          response.analyst?.message?.content
            ?.filter((c) => c.type === 'text')
            .map((c) => c.text || '')
            .join(' ') || '';

        dispatch(
          openTableModal({
            columns: response.columns,
            rows: response.rows,
            sql: response.sql, // Physical SQL for rerun functionality
            logicalSql: response.logicalSql || response.sql, // Logical SQL for display
            queryText: userMessage,
            analystMessage,
          }),
        );
      } else if (response.sql && response.columns) {
        dispatch(
          addMessage({
            sender: 'bot',
            content: 'Query executed successfully but returned no results.',
          }),
        );
      }

      // Save query to recent queries collection
      if (response.sql) {
        const analystMessage =
          response.analyst?.message?.content
            ?.filter((c) => c.type === 'text')
            .map((c) => c.text || '')
            .join(' ') || '';

        const queryToSave = {
          query_text: userMessage,
          sql_generated: response.sql, // Save physical SQL for execution
          logical_sql: response.logicalSql, // Save logical SQL for display
          result_columns: JSON.stringify(response.columns || []),
          result_row_count: response.rows?.length || 0,
          created_at: new Date().toISOString(),
          analyst_message: analystMessage,
        };

        console.log('Saving query to recent queries:', queryToSave);

        // Await the save operation to ensure it completes
        dispatch(saveRecentQuery(queryToSave))
          .unwrap()
          .then((savedQuery) => {
            console.log('Query saved successfully:', savedQuery);
          })
          .catch((error) => {
            console.error('Failed to save query:', error);
          });
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <ProcessAnimation
        isVisible={showAnimation}
        database={config?.snowflake_database}
        schema={config?.snowflake_schema}
        onComplete={() => setShowAnimation(false)}
      />
      <div className={styles.chatInputContainer}>
        <div className={styles.inputSection}>
          <h1 className={styles.title}>Ask a question</h1>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., What were our total sales in Q1 2025?"
              className={styles.chatInput}
              disabled={isTyping}
            />
            <button
              onClick={() => handleSend()}
              disabled={!message.trim() || isTyping}
              className={`${styles.sendButton} ${isTyping ? styles.loading : ''}`}
              aria-label={isTyping ? 'Sending message' : 'Send message'}
            >
              {isTyping ? (
                <Loader2 className={styles.spinIcon} />
              ) : (
                <Send className={styles.sendIcon} />
              )}
            </button>
          </div>
          <p className={styles.helperText}>
            Ask any question about your data in natural language or select an
            example below.
          </p>
        </div>
        {!isTyping &&
          messages.filter((m) => m.sender === 'user').length === 0 && (
            <ExampleQuestions onSelectQuestion={handleExampleClick} />
          )}
      </div>
    </>
  );
};

export default ChatInput;
