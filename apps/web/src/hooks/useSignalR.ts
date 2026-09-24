import { useEffect, useRef, useState, useCallback } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { useAuth } from "@clerk/clerk-react";
import { useCurrentUser } from "./useCurrentUser";

export interface SignalRNotificationPayload {
  id?: string;
  title: string;
  message: string;
  type?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt?: string;
}

export type SignalREventHandler = (payload: SignalRNotificationPayload) => void;

export function useSignalR() {
  const { getToken } = useAuth();
  const { profile, isSignedIn } = useCurrentUser();
  const connectionRef = useRef<HubConnection | null>(null);
  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    HubConnectionState.Disconnected,
  );
  const [lastNotification, setLastNotification] =
    useState<SignalRNotificationPayload | null>(null);
  const listenersRef = useRef<Map<string, Set<SignalREventHandler>>>(new Map());

  const subscribe = useCallback(
    (eventName: string, handler: SignalREventHandler) => {
      if (!listenersRef.current.has(eventName)) {
        listenersRef.current.set(eventName, new Set());
      }
      listenersRef.current.get(eventName)!.add(handler);

      return () => {
        listenersRef.current.get(eventName)?.delete(handler);
      };
    },
    [],
  );

  useEffect(() => {
    if (!isSignedIn) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
        setConnectionState(HubConnectionState.Disconnected);
      }
      return;
    }

    let isMounted = true;

    const createAndStartConnection = async () => {
      try {
        const rawBase = import.meta.env.VITE_API_BASE_URL;
        const hubUrl = rawBase
          ? `${rawBase.replace(/\/+$/, "")}/hubs/notifications`
          : "/hubs/notifications";

        const connection = new HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: async () => {
              const token = await getToken();
              return token || "";
            },
          })
          .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
          .configureLogging(LogLevel.Warning)
          .build();

        const handleIncoming =
          (eventName: string) => (data: SignalRNotificationPayload) => {
            if (!isMounted) return;
            setLastNotification(data);

            // Trigger general listeners
            const generalListeners = listenersRef.current.get(
              "ReceiveNotification",
            );
            if (generalListeners && eventName !== "ReceiveNotification") {
              generalListeners.forEach((fn) => fn(data));
            }

            // Trigger specific event listeners
            const eventListeners = listenersRef.current.get(eventName);
            if (eventListeners) {
              eventListeners.forEach((fn) => fn(data));
            }
          };

        // Register default SignalR event channels
        connection.on(
          "ReceiveNotification",
          handleIncoming("ReceiveNotification"),
        );
        connection.on(
          "InterviewScheduled",
          handleIncoming("InterviewScheduled"),
        );
        connection.on("ApplicationUpdate", handleIncoming("ApplicationUpdate"));
        connection.on(
          "AiEvaluationComplete",
          handleIncoming("AiEvaluationComplete"),
        );
        connection.on("ApprovalRequired", handleIncoming("ApprovalRequired"));
        connection.on("FeedbackSubmitted", handleIncoming("FeedbackSubmitted"));
        connection.on(
          "WorkflowStepUpdate",
          handleIncoming("WorkflowStepUpdate"),
        );

        connection.onreconnecting(() => {
          if (isMounted) setConnectionState(HubConnectionState.Reconnecting);
        });

        connection.onreconnected(async () => {
          if (isMounted) {
            setConnectionState(HubConnectionState.Connected);
            if (profile?.companyId) {
              try {
                await connection.invoke("JoinCompanyGroup", profile.companyId);
              } catch (err) {
                console.warn(
                  "Failed to rejoin company group on reconnect",
                  err,
                );
              }
            }
          }
        });

        connection.onclose(() => {
          if (isMounted) setConnectionState(HubConnectionState.Disconnected);
        });

        await connection.start();

        if (isMounted) {
          connectionRef.current = connection;
          setConnectionState(HubConnectionState.Connected);

          // Join company group if user belongs to a company
          if (profile?.companyId) {
            try {
              await connection.invoke("JoinCompanyGroup", profile.companyId);
            } catch (err) {
              console.warn("Failed to join company group", err);
            }
          }
        }
      } catch (err) {
        console.warn("SignalR connection failed to start", err);
        if (isMounted) setConnectionState(HubConnectionState.Disconnected);
      }
    };

    createAndStartConnection();

    return () => {
      isMounted = false;
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [isSignedIn, profile?.companyId, getToken]);

  return {
    connectionState,
    isConnected: connectionState === HubConnectionState.Connected,
    lastNotification,
    subscribe,
  };
}
