import { useSelector } from 'react-redux';

import { RootState } from '../../reducers';
import ChatHeader from '../ChatHeader/ChatHeader';
import ChatInput from '../ChatInput/ChatInput';
import styles from './ChatContainer.module.scss';

const ChatContainer = () => {
  const { isConfigPanelOpen } = useSelector((state: RootState) => state.chat);

  return (
    <div
      className={`${styles.chatContainer} ${isConfigPanelOpen ? styles.configOpen : ''}`}
    >
      <ChatHeader />
      <ChatInput />
    </div>
  );
};

export default ChatContainer;
