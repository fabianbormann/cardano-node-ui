import React, { useCallback, useEffect, useState } from 'react';
import { IpcEventListener, MessageType, NodeStatus } from '../global/types';
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

const Dashboard = () => {
  const theme = useTheme();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarType, setSnackbarType] = useState<MessageType>('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [directory, setDirectory] = useState('');
  const [nodeRunning, setNodeRunning] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<NodeStatus>('idle');
  const [nodeMessage, setNodeMessage] = useState('');
  const [nodeLog, setNodeLog] = useState(
    'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.'
  );

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

    if (typeof addEventListener === 'function') {
      addEventListener('node-status', ({ status, message }) => {
        setNodeStatus(status);
        setNodeMessage(message);
      });
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
          <Grid item sx={{ p: 2 }}>
            <Chip label={nodeStatus} color="info" />
          </Grid>
          <InputBase
            sx={{
              background: '#46525D',
              color: 'white',
              minWidth: 600,
              height: 200,
              p: 2,
            }}
            multiline
            readOnly
            spellCheck={false}
            minRows={3}
            value={nodeLog}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setNodeLog(event.target.value);
            }}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
