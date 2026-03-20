import React, { useState, useEffect } from 'react';

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [info, setInfo] = useState({
    route: window.location.pathname,
    userAgent: navigator.userAgent,
    windowSize: `${window.innerWidth}x${window.innerHeight}`,
    errors: []
  });

  useEffect(() => {
    // Capture JavaScript errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      setInfo(prevInfo => ({
        ...prevInfo,
        errors: [...prevInfo.errors, args.join(' ')]
      }));
      originalConsoleError.apply(console, args);
    };

    // Listen for window resize
    const handleResize = () => {
      setInfo(prevInfo => ({
        ...prevInfo,
        windowSize: `${window.innerWidth}x${window.innerHeight}`
      }));
    };
    window.addEventListener('resize', handleResize);

    // Update route on navigation
    const handleRouteChange = () => {
      setInfo(prevInfo => ({
        ...prevInfo,
        route: window.location.pathname
      }));
    };
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }  // Styles for the debug panel
  const styles = {
    button: {
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      zIndex: 9999,
      background: '#007BFF',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 16px',
      cursor: 'pointer'
    },
    panel: {
      position: 'fixed',
      bottom: '50px',
      right: '10px',
      width: '300px',
      background: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '4px',
      padding: '15px',
      zIndex: 9998,
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      maxHeight: '80vh',
      overflowY: 'auto'
    },
    infoItem: {
      marginBottom: '10px'
    },
    errorList: {
      color: 'red',
      fontSize: '12px',
      maxHeight: '200px',
      overflowY: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }
  };

  return (
    <>
      <button 
        style={styles.button}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Close Debug' : 'Debug'}
      </button>
      
      {isOpen && (
        <div style={styles.panel}>
          <h4>Debug Information</h4>
          <div style={styles.infoItem}>
            <strong>Current Route:</strong> {info.route}
          </div>
          <div style={styles.infoItem}>
            <strong>Window Size:</strong> {info.windowSize}
          </div>
          <div style={styles.infoItem}>
            <strong>User Agent:</strong> 
            <div style={{ fontSize: '11px', wordBreak: 'break-all' }}>
              {info.userAgent}
            </div>
          </div>
          <div style={styles.infoItem}>
            <strong>Errors:</strong> 
            <div style={styles.errorList}>
              {info.errors.length > 0 
                ? info.errors.map((err, i) => <div key={i}>{err}</div>)
                : 'No errors detected'}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel;
