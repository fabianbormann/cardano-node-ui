export type MessageType = 'success' | 'error' | 'warning' | 'info';

export type NodeStatus = 'idle' | 'download' | 'running' | 'error';
export type IpcEventListener = (
  channel: string,
  callback: (argument: any) => void
) => void;

export type densityOptions = 'low' | 'medium' | 'high';
export type ContainerSize = {
  height: number;
  width: number;
};

export type ParticleNetworkOptions = {
  color?: string;
  background?: string;
  interactive?: boolean;
  velocity?: number;
  density?: number;
  useWindowForMouseEvents?: boolean;
};

export type NodeStatusMessage = {
  timestamp: number;
  status: NodeStatus;
  message: string;
  id: number;
};
