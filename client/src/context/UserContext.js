import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [quizStats, setQuizStats] = useState({
    totalQuizzes: 0,
    totalScore: 0,
  });

  // Fetch user data on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Setup socket connection when user is loaded
  useEffect(() => {
    if (user && !socket) {
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        // Join room based on role
        newSocket.emit('joinRoom', { role: user.role, userId: user._id });
      });

      // Handle being kicked
      newSocket.on('kicked', (data) => {
        toast.error(data.msg || 'You have been kicked!');
        logout();
      });

      // Handle global quiz stop
      newSocket.on('globalStop', (data) => {
        toast.warning(data.msg || 'Quiz has been stopped by administrator');
        // Dispatch event for Quiz component to handle
        window.dispatchEvent(new CustomEvent('quizStopped'));
      });

      // Handle force logout due to suspicious activity
      newSocket.on('forceLogout', (data) => {
        // Only force logout Student users
        if (user && user.role === 'Student') {
          toast.error(data.msg || 'You have been automatically logged out due to suspicious activity.');
          logout();
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const fetchUser = async (token) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'x-auth-token': token,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        
        // Load quiz stats from localStorage
        const savedStats = localStorage.getItem('quizStats');
        if (savedStats) {
          setQuizStats(JSON.parse(savedStats));
        }
      } else if (res.status === 401) {
        // Only clear token if explicitly unauthorized
        console.log('Token invalid, clearing...');
        localStorage.removeItem('token');
        setUser(null);
      } else {
        // Server error - keep token, just set user to null
        console.error('Server error fetching user');
        setUser(null);
      }
    } catch (err) {
      // Network error - keep token, might be temporary
      console.error('Error fetching user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (token) => {
    localStorage.setItem('token', token);
    await fetchUser(token);
  };

  const logout = (reason = null) => {
    // Set flag if logout is due to cheating
    if (reason === 'cheating') {
      localStorage.setItem('cheatingLogout', 'true');
    }

    // Clear all storage
    localStorage.removeItem('token');
    localStorage.removeItem('quizStats');
    sessionStorage.clear();

    // Disconnect socket
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }

    // Reset state
    setUser(null);
    setQuizStats({ totalQuizzes: 0, totalScore: 0 });

    // Redirect to login
    window.location.href = '/login';
  };

  const updateQuizStats = (score, total) => {
    const newStats = {
      totalQuizzes: quizStats.totalQuizzes + 1,
      totalScore: quizStats.totalScore + Math.round((score / total) * 100),
    };
    setQuizStats(newStats);
    localStorage.setItem('quizStats', JSON.stringify(newStats));
  };

  const value = {
    user,
    loading,
    socket,
    quizStats,
    login,
    logout,
    fetchUser,
    updateQuizStats,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
