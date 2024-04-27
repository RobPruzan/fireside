import { useEffect, useState } from 'react';

const YourComponent = ({ campId }) => {
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    const subscription = new WebSocket(
      `${import.meta.env.PROD ? 'wss://' : 'ws://'}${
        import.meta.env.PROD ? 'fireside.ninja' : 'localhost:8080'
      }/api/protected/camp/connectedUsers/${campId}`
    );

    subscription.addEventListener('message', (event) => {
      const { type, payload } = JSON.parse(event.data);

      if (type === 'connected-users') {
        setActiveUsers(payload);
      }
    });

    return () => {
      subscription.close();
    };
  }, [campId]);

  return (
    <div>
      <h2>Active Users</h2>
      <ul>
        {activeUsers.map((userId) => (
          <li key={userId}>{userId}</li>
        ))}
      </ul>
    </div>
  );
};