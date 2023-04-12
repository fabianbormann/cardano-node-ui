const {
  app,
  BrowserWindow,
  nativeImage,
  ipcMain,
  dialog,
} = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Downloader = require('nodejs-file-downloader');
const spawn = require('child_process').spawn;
const os = require('os');
const fs = require('fs/promises');
const ip = require('ip');

const networks = {
  mainnet: {
    protocolMagic: 764824073,
  },
  preprod: {
    protocolMagic: 1,
  },
  preview: {
    protocolMagic: 2,
  },
};

const nodeBinaries = {
  darwin: 'cardano-node-1.35.7-macos.tar.gz',
  win32: 'cardano-node-1.35.7-win64.zip',
  linux: 'cardano-node-1.35.7-linux.tar.gz',
};

const nodeBaseUrl =
  'https://update-cardano-mainnet.iohk.io/cardano-node-releases/';

const downloadNodeBinary = async (directory, feedbackFunction) => {
  const nodeBinary = nodeBinaries[process.platform];
  if (nodeBinary) {
    const downloader = new Downloader({
      url: `${nodeBaseUrl}${nodeBinary}`,
      directory: directory,
      cloneFiles: false,
      skipExistingFileName: true,
      onProgress: (percentage) => {
        feedbackFunction(
          `download cardano-node binary ${Math.round(percentage)}%`
        );
      },
    });

    try {
      await downloader.download();
    } catch (error) {
      console.log('Download failed', error);
      throw error;
    }
  }
};

const unpackArchive = (directory) =>
  new Promise((resolve, reject) => {
    const nodeBinary = nodeBinaries[process.platform];
    const binaryPath = path.join(
      directory,
      nodeBinary.replace('.tar.gz', '').replace('.zip', '')
    );

    fs.mkdir(binaryPath, { recursive: true })
      .then(() => {
        const child = spawn('tar', [
          '-xzf',
          path.join(directory, nodeBinary),
          '-C',
          binaryPath,
        ]);
        child.on('close', (code) => {
          console.log(`child process exited with code ${code}`);
          if (code === 0) {
            resolve();
          } else {
            reject();
          }
        });

        child.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        child.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
        });
      })
      .catch((error) => reject(error));
  });

const startNode = (directory, network) =>
  new Promise((resolve, reject) => {
    const nodeBinary = nodeBinaries[process.platform];
    const configDirectory = path.join(directory, `${network}-config`);
    const databaseDirectory = path.join(directory, `${network}-db`);
    const binaryPath = path.join(
      directory,
      nodeBinary.replace('.tar.gz', '').replace('.zip', '')
    );

    const child = spawn(path.join(binaryPath, 'cardano-node'), [
      'run',
      '--topology',
      path.join(configDirectory, 'topology.json'),
      '--database-path',
      databaseDirectory,
      '--socket-path',
      path.join(databaseDirectory, 'node.socket'),
      '--host-addr',
      ip.address(),
      '--port',
      '3001',
      '--config',
      path.join(configDirectory, 'config.json'),
    ]);
    child.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });

    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
  });

const downloadConfig = async (directory, network) => {
  const configDirectory = path.join(directory, `${network}-config`);
  const databaseDirectory = path.join(directory, `${network}-db`);
  await fs.mkdir(configDirectory, { recursive: true });
  await fs.mkdir(databaseDirectory, { recursive: true });

  const filenames = [
    `https://book.world.dev.cardano.org/environments/${network}/config.json`,
    `https://book.world.dev.cardano.org/environments/${network}/db-sync-config.json`,
    `https://book.world.dev.cardano.org/environments/${network}/submit-api-config.json`,
    `https://book.world.dev.cardano.org/environments/${network}/topology.json`,
    `https://book.world.dev.cardano.org/environments/${network}/byron-genesis.json`,
    `https://book.world.dev.cardano.org/environments/${network}/shelley-genesis.json`,
    `https://book.world.dev.cardano.org/environments/${network}/alonzo-genesis.json`,
  ];

  for (const filename of filenames) {
    const downloader = new Downloader({
      url: filename,
      cloneFiles: false,
      directory: configDirectory,
    });
    try {
      const { filePath, downloadStatus } = await downloader.download();
      console.log('All done');
    } catch (error) {
      console.log('Download failed', error);
      throw error;
    }
  }
};

function createWindow() {
  const image = nativeImage.createFromPath(
    path.join(__dirname, 'icons', 'icon.png')
  );

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 760,
    minHeight: 500,
    title: 'Cardano Node UI',
    frame: false,
    icon: image,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setMenu(null);
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, 'index.html')}`
  );
  mainWindow.maximize();
  return mainWindow;
}

let intervalId = -1;

app.whenReady().then(() => {
  const mainWindow = createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  ipcMain.on('open-dialog', (event) => {
    event.returnValue = dialog.showOpenDialogSync({
      properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
    });
  });

  ipcMain.on('start-node', async (event, directory, network = 'mainnet') => {
    mainWindow.webContents.send('node-status', {
      id: 0,
      timestamp: new Date().getTime(),
      status: 'download',
      message: 'download cardano-node binary #{...}',
    });

    try {
      const updateDownloadStatus = (message) => {
        mainWindow.webContents.send('node-status', {
          id: 0,
          timestamp: new Date().getTime(),
          status: 'download',
          message: message,
        });
      };

      await downloadNodeBinary(directory, updateDownloadStatus);
    } catch (error) {
      console.error(error);
      mainWindow.webContents.send('node-status', {
        id: -1,
        timestamp: new Date().getTime(),
        status: 'error',
        message: `error while downloading the cardano-node binary #{:x:}`,
      });
      return;
    }

    mainWindow.webContents.send('node-status', {
      id: 0,
      timestamp: new Date().getTime(),
      status: 'running',
      message:
        'cardano-node binary binary download completed #{:white_check_mark:}',
    });
    mainWindow.webContents.send('node-status', {
      id: 1,
      timestamp: new Date().getTime(),
      status: 'download',
      message: 'download configuration and node topology #{...}',
    });
    await downloadConfig(directory, network);
    mainWindow.webContents.send('node-status', {
      id: 1,
      timestamp: new Date().getTime(),
      status: 'running',
      message:
        'configuration and node topology download completed #{:white_check_mark:}',
    });

    try {
      await unpackArchive(directory);
    } catch (error) {
      console.error(error);
      mainWindow.webContents.send('node-status', {
        id: -1,
        timestamp: new Date().getTime(),
        status: 'error',
        message: `error while unpacking the cardano-node binary #{:x:}`,
      });
      return;
    }

    mainWindow.webContents.send('node-status', {
      id: -1,
      timestamp: new Date().getTime(),
      status: 'running',
      message: `cardano-node binary has been successfully unpacked #{:white_check_mark:}`,
    });

    mainWindow.webContents.send('node-status', {
      id: 2,
      timestamp: new Date().getTime(),
      status: 'running',
      message: 'node initialization running  #{...}',
    });

    startNode(directory, network);
    const nodeBinary = nodeBinaries[process.platform];
    const binaryPath = path.join(
      directory,
      nodeBinary.replace('.tar.gz', '').replace('.zip', '')
    );

    const getCurrentTip = () => {
      const databaseDirectory = path.join(directory, `${network}-db`);
      const args = ['query', 'tip'];

      if (network === 'mainnet') {
        args.push('--mainnet');
      } else {
        args.push('--testnet-magic');
        args.push(networks[network].protocolMagic);
      }

      const child = spawn(path.join(binaryPath, 'cardano-cli'), args, {
        env: {
          CARDANO_NODE_SOCKET_PATH: path.join(databaseDirectory, 'node.socket'),
        },
      });

      child.stdout.on('data', (data) => {
        try {
          const response = JSON.parse(data);
          mainWindow.webContents.send('node-status', {
            id: 2,
            timestamp: new Date().getTime(),
            status: 'running',
            message: `node sync progress: ${response.syncProgress}%`,
          });
        } catch (error) {
          if (!(error instanceof SyntaxError)) {
            console.error(error);
          }
        }
      });
      child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });
    };

    intervalId = setInterval(() => getCurrentTip(), 5000);
  });

  ipcMain.handle('getDefaultPath', () =>
    path.join(app.getPath('home'), '.cardano-node-ui')
  );
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
