import React, { useCallback, useEffect, useState } from 'react';
import {
  IpcEventListener,
  MessageType,
  NodeStatus,
  NodeStatusMessage,
} from '../global/types';
import {
  Alert,
  Button,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  InputBase,
  Snackbar,
  useTheme,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import reactStringReplace from 'react-string-replace';
import { Box } from '@mui/system';

const Dashboard = () => {
  const theme = useTheme();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarType, setSnackbarType] = useState<MessageType>('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [directory, setDirectory] = useState('');
  const [nodeRunning, setNodeRunning] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<NodeStatus>('idle');
  const [nodeLog, setNodeLog] = useState<Array<NodeStatusMessage>>([
    { status: 'idle', message: 'cardano-node-ui:~$', id: -1, timestamp: 0 },
  ]);

  useEffect(() => {
    const getDefaultDirectory: () => Promise<string> = (window as any).electron
      ?.getDefaultDirectory;
    if (typeof getDefaultDirectory === 'function') {
      getDefaultDirectory().then((defaultDirectory) =>
        setDirectory(defaultDirectory)
      );
    }
  }, []);

  useEffect(() => {
    const addEventListener: IpcEventListener = (window as any).electron
      ?.addEventListener;

    const removeAllListeners: (channel: string) => void = (window as any)
      .electron?.removeAllListeners;

    if (typeof addEventListener === 'function') {
      addEventListener('node-status', (nodeMessage: NodeStatusMessage) => {
        setNodeStatus(nodeMessage.status);
        setNodeLog((previousMessages) => [...previousMessages, nodeMessage]);
      });

      return () => {
        removeAllListeners('node-status');
      };
    }
  }, []);

  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setSnackbarOpen(false);
  };

  const showSnackbar = useCallback(
    (message: string, variant: MessageType = 'success') => {
      setSnackbarOpen(true);
      setSnackbarMessage(message);
      setSnackbarType(variant);
    },
    []
  );

  const openDirectoryDialog = () => {
    const openDialog = (window as any).electron?.openDialog;
    if (typeof openDialog === 'function') {
      const selectedDirectories = openDialog();
      if (selectedDirectories) {
        setDirectory(selectedDirectories[0]);
      }
    }
  };

  const invokeStartNode = () => {
    if (nodeRunning) {
      showSnackbar('Node already running', 'info');
    }

    const startNode = (window as any).electron?.startNode;
    if (typeof startNode === 'function') {
      startNode(directory);
      setNodeRunning(true);
    }
  };

  const format = (logLines: Array<NodeStatusMessage>) => {
    if (logLines.length > 1) {
      const messages: { [timestamp: number]: { text: string; id: number } } =
        {};
      const ids: Array<number> = [];

      for (const line of logLines) {
        if (line.timestamp > 0) {
          let formattedMessage = line.message;
          formattedMessage = formattedMessage.replaceAll(
            '#{:white_check_mark:}',
            '✅'
          );
          formattedMessage = formattedMessage.replaceAll('#{:x:}', '❌');

          if (ids.includes(line.id)) {
            const timestamp = Object.keys(messages).find(
              (key) => messages[key as unknown as number].id === line.id
            ) as unknown as number;
            messages[timestamp].text = `cardano-node-ui:~$ ${formattedMessage}`;
          } else {
            messages[line.timestamp] = {
              text: `cardano-node-ui:~$ ${formattedMessage}`,
              id: line.id,
            };
            ids.push(line.id);
          }
        }
      }

      let text: Array<any> = [];
      const timestamps: Array<number> = Object.keys(
        messages
      ).sort() as unknown as number[];
      for (const timestamp of timestamps) {
        text = [
          ...text,
          <div>
            {reactStringReplace(
              messages[timestamp].text,
              '#{...}',
              (match, i) => (
                <>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </>
              )
            )}
          </div>,
        ];
      }

      return text;
    } else {
      return logLines[0].message;
    }
  };

  const getStatusColor = (status: NodeStatus) => {
    if (status === 'error') {
      return 'error';
    } else if (status === 'running') {
      return 'success';
    }
    return 'info';
  };

  return (
    <Grid
      container
      sx={{
        p: 2,
        justifyContent: 'center',
        alignItems: 'center',
        background: 'transparent',
      }}
    >
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarType}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Grid
        container
        sx={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
        }}
      >
        <Grid item>
          <InputBase
            sx={{
              minWidth: 500,
              background: 'white',
              p: 2,
              borderRadius: '4px',
            }}
            spellCheck={false}
            value={directory}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setDirectory(event.target.value);
            }}
            endAdornment={
              <InputAdornment position="end">
                <IconButton onClick={openDirectoryDialog} edge="end">
                  <FolderOpenIcon />
                </IconButton>
              </InputAdornment>
            }
          />

          <Button
            sx={{ ml: 1, p: 2.5 }}
            variant="contained"
            color="secondary"
            disableElevation
            onClick={invokeStartNode}
          >
            Start
          </Button>
        </Grid>

        <Grid
          item
          container
          sx={{
            flexDirection: 'column',
            borderRadius: '4px',
            background: '#46525D',
          }}
        >
          <Grid item sx={{ pl: 2, pr: 2, pt: 2, pb: 1 }}>
            <Chip label={nodeStatus} color={getStatusColor(nodeStatus)} />
          </Grid>
          <Box
            sx={{
              background: '#46525D',
              color: 'white',
              minWidth: 600,
              height: 200,
              pl: 2,
              pr: 2,
              pb: 2,
              verticalAlign: 'top',
            }}
          >
            {format(nodeLog)}
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
