document.addEventListener('DOMContentLoaded', () => {
  const noteInput = document.getElementById('complaint-note');
  const submitBtn = document.getElementById('btn-submit');
  const statusText = document.getElementById('status-text');

  submitBtn.addEventListener('click', async () => {
    const note = noteInput.value.trim();
    if (!note) {
      statusText.textContent = 'Please describe what looks wrong.';
      statusText.style.color = '#DC2626';
      return;
    }

    submitBtn.disabled = true;
    statusText.textContent = 'Mapping evidence & generating draft...';
    statusText.style.color = '#4B5563';

    try {
      const response = await fetch('http://localhost:3000/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'active_session',
          note,
          submitted_at: Date.now(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        statusText.textContent = '✓ Draft created! Open workspace to review.';
        statusText.style.color = '#16A34A';
        noteInput.value = '';
      } else {
        statusText.textContent = data?.error || 'Failed to submit flag.';
        statusText.style.color = '#DC2626';
      }
    } catch {
      statusText.textContent = 'Cannot reach API at localhost:3000';
      statusText.style.color = '#DC2626';
    } finally {
      submitBtn.disabled = false;
    }
  });
});
