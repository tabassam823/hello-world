import React, { useState } from 'react';

const ShareForm = ({ onShare, currentSharedWith = [] }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentSharedWith.find(user => user.email === email)) {
      setError('Already shared with this user.');
      return;
    }
    onShare(email);
    setEmail('');
    setError('');
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
        <input
          type="email"
          placeholder="Enter user's email to share"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Share</button>
      </form>
      {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
    </div>
  );
};

export default ShareForm;
