// v1
'use client';
import { useEffect, useState } from 'react';
import { getRealtime } from '../lib/ablyClient';

export default function ConnBadge() {
  const rt = getRealtime();

  /* 
    * SDK Connection states:  * The channel has been initialized but no attach has yet been attempted.
      ? type INITIALIZED = 'initialized';
      An attach has been initiated by sending a request to Ably. This is a transient state, followed either by a transition to `ATTACHED`, `SUSPENDED`, or `FAILED`.
      ? type ATTACHING = 'attaching';
      The attach has succeeded. In the `ATTACHED` state a client may publish and subscribe to messages, or be present on the channel.
      ? type ATTACHED = 'attached';
      A detach has been initiated on an `ATTACHED` channel by sending a request to Ably. This is a transient state, followed either by a transition to `DETACHED` or `FAILED`.
      ? type DETACHING = 'detaching';
      The channel, having previously been `ATTACHED`, has been detached by the user.
      ? type DETACHED = 'detached';
      The channel, having previously been `ATTACHED`, has lost continuity, usually due to the client being disconnected from Ably for longer than two minutes. It will automatically attempt to reattach as soon as connectivity is restored.
      ? type SUSPENDED = 'suspended';
      An indefinite failure condition. This state is entered if a channel error has been received from the Ably service, such as an attempt to attach without the necessary access rights. 
      ? type FAILED = 'failed';
  */

  const [state, setState] = useState<'initialized' | 'connecting' | 'connected' | 'disconnected' | 'suspended' | 'closed' | 'failed'>('connecting');

  // 'connected', etc.
  useEffect(() => {
    const listener = (change: any) => {
      console.log('Connection state changed:', change);

      if (change === 'connected') {
        // show a toast here
        alert('Reconnected — continuity restored');
      }

      if (change === 'suspended') {
        // show a toast here
        alert('Suspended — connection lost');
      }

      if (change === 'failed') {
        // show a toast here
        alert('Failed — connection failed');
      }
      setState(change.current);
    };
    rt.connection.on(listener);
    return () => { rt.connection.off(listener); };
  }, [rt]);



  const color = state === 'connected' ? 'bg-green-500'
    : state === 'connecting' ? 'bg-yellow-500'
      : 'bg-red-500';


  return <span className={`inline-block px-2 py-1 text-white text-xs rounded ${color}`}>{state}</span>;
}