document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-btn');
  const statusCard = document.getElementById('status-card');
  const statusText = document.getElementById('status-text');
  const nameInput = document.getElementById('qa-name');
  const nameGroup = document.getElementById('name-group');
  const statsSection = document.getElementById('stats-section');
  const sessionIdDisplay = document.getElementById('session-id-display');

  let isMonitoring = false;

  // Restore saved name
  chrome.storage.local.get(['qaName'], (result) => {
    if (result.qaName) {
      nameInput.value = result.qaName;
    }
  });

  // Check current status
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (response) {
      updateUI(response.isMonitoring, response.sessionId);
    }
  });

  toggleBtn.addEventListener('click', () => {
    if (isMonitoring) {
      // Stop
      chrome.runtime.sendMessage({ type: 'STOP_SESSION' }, (response) => {
        if (response && response.success) {
          updateUI(false, null);
        }
      });
    } else {
      // Start
      const qaName = nameInput.value.trim() || 'Anonymous QA';
      chrome.storage.local.set({ qaName });
      
      chrome.runtime.sendMessage({ type: 'START_SESSION', qaEngineer: qaName }, (response) => {
        if (response && response.success) {
          updateUI(true, null); // Session ID will be fetched on next GET_STATUS if we poll
          // Poll for session ID
          setTimeout(pollStatus, 2000);
        }
      });
    }
  });

  function pollStatus() {
    if (!isMonitoring) return;
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
      if (response && response.sessionId) {
        sessionIdDisplay.textContent = response.sessionId.substring(0, 8) + '...';
      } else {
        setTimeout(pollStatus, 2000);
      }
    });
  }

  function updateUI(monitoring, sessionId) {
    isMonitoring = monitoring;
    
    if (monitoring) {
      statusCard.className = 'card active';
      statusText.textContent = 'Monitoring Active';
      
      toggleBtn.className = 'btn btn-danger';
      toggleBtn.textContent = 'Stop Monitoring';
      
      nameGroup.style.display = 'none';
      statsSection.style.display = 'block';
      
      if (sessionId) {
        sessionIdDisplay.textContent = sessionId.substring(0, 8) + '...';
      } else {
        sessionIdDisplay.textContent = 'Pending...';
      }
    } else {
      statusCard.className = 'card inactive';
      statusText.textContent = 'Not Monitoring';
      
      toggleBtn.className = 'btn btn-primary';
      toggleBtn.textContent = 'Start Monitoring';
      
      nameGroup.style.display = 'flex';
      statsSection.style.display = 'none';
    }
  }
});
