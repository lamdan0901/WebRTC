import React, { useContext } from 'react';
import { Button } from '@material-ui/core';

import { SocketContext } from '../Context';

const Notifications = () => {
  const { answerCall, call, refuseCall } = useContext(SocketContext);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
      <h1>{call.name} is calling:</h1>
      <Button variant="contained" color="primary" onClick={answerCall}>
        Answer
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={refuseCall}
      >
        Refuse
      </Button>
    </div>
  );
};

export default Notifications;
