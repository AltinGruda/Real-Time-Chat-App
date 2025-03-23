import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { IoSend, IoExitOutline } from 'react-icons/io5';
import './Chat.css';
import PrivateChat from './PrivateChat';

const Chat = ({ socket, username, room, onLogout }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState('');
  const [privateChat, setPrivateChat] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [unreadMessages, setUnreadMessages] = useState({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      
      if (message.user !== username && 
          (privateChat?.username !== message.user)) {
        setUnreadMessages(prev => ({
          ...prev,
          [message.user]: (prev[message.user] || 0) + 1
        }));
      }
    });

    socket.on('messageHistory', (history) => {
      setMessages(history);
    });

    socket.on('roomUsers', (roomUsers) => {
      setUsers(roomUsers);
    });

    socket.on('userTyping', ({ username: typingUser, isTyping }) => {
      if (isTyping) {
        setTyping(`${typingUser} is typing...`);
      } else {
        setTyping('');
      }
    });

    socket.on('private-message', ({ from, content }) => {
      if (privateChat?.username !== from) {
        setUnreadMessages(prev => ({
          ...prev,
          [from]: (prev[from] || 0) + 1
        }));
      }
    });

    return () => {
      socket.off('message');
      socket.off('messageHistory');
      socket.off('roomUsers');
      socket.off('userTyping');
      socket.off('private-message');
    };
  }, [socket, username, privateChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('chatMessage', message);
      setMessage('');
      socket.emit('typing', false);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    socket.emit('typing', true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', false);
    }, 1000);
  };

  const handleUserClick = (user) => {
    if (user.username !== username) {
      setPrivateChat(user);
      setUnreadMessages(prev => ({
        ...prev,
        [user.username]: 0
      }));
    }
  };

  const handleMainChatFocus = () => {
    if (privateChat) {
      const updatedUnread = { ...unreadMessages };
      users.forEach(user => {
        if (user.username !== username) {
          delete updatedUnread[user.username];
        }
      });
      setUnreadMessages(updatedUnread);
    }
    setPrivateChat(null);
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>{room}</h2>
          <p>{users.length} members</p>
        </div>
        
        <div className="user-list">
          <h3>Members</h3>
          <ul>
            {users.map((user) => (
              <li 
                key={user.id}
                onClick={() => handleUserClick(user)}
                className={user.username !== username ? 'clickable' : ''}
              >
                <div className="user-avatar-container">
                  <div className="user-avatar">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="user-status" />
                </div>
                <div className="user-info">
                  <span>{user.username}</span>
                  {user.username === username && (
                    <span className="user-you">(you)</span>
                  )}
                  {unreadMessages[user.username] > 0 && (
                    <span className="new-message-badge">
                      {unreadMessages[user.username]}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="main-content">
        {privateChat ? (
          <PrivateChat
            socket={socket}
            username={username}
            otherUser={privateChat}
            onClose={handleMainChatFocus}
          />
        ) : (
          <>
            <div className="chat-header">
              <h2>{room}</h2>
              <button onClick={onLogout} className="leave-button">
                <IoExitOutline size={20} />
                <span>Leave Room</span>
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.user === username ? 'sent' : 'received'}`}
                >
                  <div>
                    {msg.type === 'info' ? (
                      <em>{msg.content}</em>
                    ) : (
                      <>
                        <strong>{msg.user === username ? 'You' : msg.user}</strong>
                        <span className="timestamp">
                          {format(new Date(msg.timestamp), 'HH:mm')}
                        </span>
                      </>
                    )}
                  </div>
                  {msg.type !== 'info' && <div>{msg.content}</div>}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {typing && <div className="typing-indicator">{typing}</div>}

            <form className="message-input" onSubmit={handleSendMessage}>
              <div className="input-container">
                <input
                  type="text"
                  value={message}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                />
                <button type="submit">
                  <IoSend size={20} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat; 