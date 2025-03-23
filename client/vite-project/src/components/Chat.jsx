import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

const Chat = ({ socket, username, room, onLogout }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
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

    return () => {
      socket.off('message');
      socket.off('messageHistory');
      socket.off('roomUsers');
      socket.off('userTyping');
    };
  }, [socket]);

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

  return (
    <div className="app-container">
      <div className="sidebar">
        <div style={{ padding: '1rem' }}>
          <h2>ICG chat</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Room: {room}</p>
        </div>
        
        <div className="user-list">
          <h3 style={{ marginBottom: '1rem' }}>Online Users</h3>
          <ul style={{ listStyle: 'none' }}>
            {users.map((user) => (
              <li
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success-color)',
                  }}
                />
                {user.username} {user.username === username && '(you)'}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="main-content">
        <div className="chat-header">
          <button
            onClick={onLogout}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              padding: '0.25rem 0.5rem',
            }}
          >
            Leave Room
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.user === username ? 'sent' : 'received'
              }`}
            >
              <div style={{ marginBottom: '0.25rem' }}>
                {msg.type === 'info' ? (
                  <em>{msg.content}</em>
                ) : (
                  <>
                    <strong>{msg.user === username ? 'You' : msg.user}</strong>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8em', color: 'var(--text-secondary)' }}>
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
            <button type="submit">Send</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat; 