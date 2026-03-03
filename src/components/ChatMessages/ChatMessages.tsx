import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '../../reducers';
import Message from '../Message/Message';
import TypingIndicator from '../TypingIndicator/TypingIndicator';
import styles from './ChatMessages.module.scss';

const ChatMessages = () => {
  const { messages, isTyping } = useSelector((state: RootState) => state.chat);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className={styles.chatMessages}>
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
