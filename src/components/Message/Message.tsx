import { ChatMessage } from '../../reducers/chat/slice';
import styles from './Message.module.scss';

interface MessageProps {
  message: ChatMessage;
}

const Message = ({ message }: MessageProps) => {
  const className = `${styles.message} ${styles[message.sender]} ${message.isError ? styles.error : ''}`;

  return (
    <div className={className}>
      {message.isHTML ? (
        <div dangerouslySetInnerHTML={{ __html: message.content }} />
      ) : (
        <div>{message.content}</div>
      )}
    </div>
  );
};

export default Message;
