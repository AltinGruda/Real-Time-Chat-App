import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import Login from './components/Login'
import Chat from './components/Chat'

const SOCKET_URL = 'http://localhost:3000'

function App() {
  const [socket, setSocket] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const newSocket = io(SOCKET_URL)
    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const handleLogin = ({ username, room }) => {
    setUser({ username, room })
    socket.emit('join', { username, room })
  }

  const handleLogout = () => {
    socket.disconnect()
    setUser(null)
    const newSocket = io(SOCKET_URL)
    setSocket(newSocket)
  }

  if (!socket) {
    return <div>Connecting to server...</div>
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Chat
      socket={socket}
      username={user.username}
      room={user.room}
      onLogout={handleLogout}
    />
  )
}

export default App
