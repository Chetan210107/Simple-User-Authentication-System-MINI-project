import React, { useState, useEffect } from 'react';
import { Menu, Dropdown, Icon, Button } from 'semantic-ui-react';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout, quizStats } = useUser();
  const [promptEvent, setPromptEvent] = useState(null);
  const [appAccepted, setAppAccepted] = useState(false);
  const navigate = useNavigate();

  let isAppInstalled = false;

  if (window.matchMedia('(display-mode: standalone)').matches || appAccepted) {
    isAppInstalled = true;
  }

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const installApp = () => {
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then(result => {
        if (result.outcome === 'accepted') {
          setAppAccepted(true);
        }
      });
    }
  };

  const handleLogout = () => {
    logout();
  };

  const goToDashboard = () => {
    if (user?.role === 'Teacher') {
      navigate('/teacher-dashboard');
    } else if (user?.role === 'Admin') {
      navigate('/admin-dashboard');
    }
  };

  return (
    <Menu stackable inverted className="glass-navbar" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
      <Menu.Item header onClick={() => navigate(user?.role === 'Admin' ? '/admin-dashboard' : '/')} style={{ cursor: 'pointer' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>CDS-Quiz_App</h1>
      </Menu.Item>

      <Menu.Menu position="right">
        {promptEvent && !isAppInstalled && (
          <Menu.Item>
            <Button
              color="teal"
              icon="download"
              size="small"
              content="Install"
              onClick={installApp}
            />
          </Menu.Item>
        )}

        {user && (
          <Dropdown
            item
            trigger={
              <span>
                <Icon name="bars" size="large" />
              </span>
            }
            icon={null}
            direction="left"
          >
            <Dropdown.Menu className="glass-dropdown">
              <Dropdown.Header>
                <Icon name="user circle" />
                {user.firstName} {user.lastName}
              </Dropdown.Header>
              <Dropdown.Divider />
              
              <Dropdown.Item>
                <Icon name="user" />
                <span>Profile</span>
                <span style={{ float: 'right', opacity: 0.7 }}>{user.role}</span>
              </Dropdown.Item>
              
              <Dropdown.Item>
                <Icon name="mail" />
                <span>Account</span>
                <span style={{ float: 'right', opacity: 0.7, fontSize: '0.85em' }}>{user.email}</span>
              </Dropdown.Item>
              
              {user.role === 'Student' && (
                <Dropdown.Item>
                  <Icon name="university" />
                  <span>Class/Division</span>
                  <span style={{ float: 'right', opacity: 0.7 }}>{user.classDivision || 'N/A'}</span>
                </Dropdown.Item>
              )}
              
              {user.role !== 'Admin' && (
                <>
                  <Dropdown.Divider />
                  
                  <Dropdown.Item>
                    <Icon name="trophy" />
                    <span>Quiz Score</span>
                    <span style={{ float: 'right', opacity: 0.7 }}>
                      {quizStats.totalQuizzes > 0 
                        ? `${Math.round(quizStats.totalScore / quizStats.totalQuizzes)}%` 
                        : 'N/A'}
                    </span>
                  </Dropdown.Item>
                  
                  <Dropdown.Item>
                    <Icon name="list ol" />
                    <span>Total Quizzes</span>
                    <span style={{ float: 'right', opacity: 0.7 }}>{quizStats.totalQuizzes}</span>
                  </Dropdown.Item>
                </>
              )}
              
              {(user.role === 'Teacher' || user.role === 'Admin') && (
                <>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={goToDashboard}>
                    <Icon name="dashboard" />
                    <span>Dashboard</span>
                  </Dropdown.Item>
                </>
              )}
              
              <Dropdown.Divider />
              
              <Dropdown.Item onClick={handleLogout} style={{ color: '#ff6b6b' }}>
                <Icon name="sign out" />
                <span>Logout</span>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </Menu.Menu>
    </Menu>
  );
};

export default Header;
