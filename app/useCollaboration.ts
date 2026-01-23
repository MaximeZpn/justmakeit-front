import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export const useCollaboration = (projectId: string, onMessageReceived?: (msg: any) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const [myIdentity, setMyIdentity] = useState<string>("");
  const stompClient = useRef<Client | null>(null);

  // Génère ou récupère un ID unique pour ce navigateur (Device ID)
  const getDeviceId = () => {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem('justmakeit_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('justmakeit_device_id', id);
    }
    return id;
  };

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-justmakeit'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setIsConnected(true);

      // S'abonner aux mises à jour du projet spécifique
      client.subscribe(`/topic/project/${projectId}`, (payload) => {
        const message = JSON.parse(payload.body);
        
        // Si le message confirme notre propre arrivée, on enregistre notre nom "Maker X"
        if (message.type === 'JOIN' && message.deviceId === getDeviceId()) {
          setMyIdentity(message.sender);
        }

        if (onMessageReceived) {
          onMessageReceived(message);
        }
      });

      // Signaler notre arrivée au serveur
      client.publish({
        destination: `/app/sync/${projectId}`,
        body: JSON.stringify({
          type: 'JOIN',
          projectId,
          deviceId: getDeviceId(),
          payload: {}
        })
      });
    };

    client.onDisconnect = () => setIsConnected(false);
    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
    };
  }, [projectId]);

  const sendMessage = (type: string, payload: any) => {
    if (stompClient.current?.connected) {
      stompClient.current.publish({
        destination: `/app/sync/${projectId}`,
        body: JSON.stringify({ sender: myIdentity, type, projectId, deviceId: getDeviceId(), payload })
      });
    }
  };

  return { sendMessage, isConnected, myIdentity };
};