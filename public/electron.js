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

const networks = {
  mainnet: {
    networkMagic: 764824073,
  },
  preprod: {
    networkMagic: 1,
  },
  preview: {
    networkMagic: 2,
  },
};

const nodeBinaries = {
  darwin: 'cardano-node-1.35.5-macos.tar.gz',
  win32: 'cardano-node-1.35.5-win64.zip',
  linux: 'cardano-node-1.35.5-linux.tar.gz',
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
    const destinationPath = path.join(
      directory,
      nodeBinary.replace('.tar.gz', '').replace('.zip', '')
    );

    fs.mkdir(destinationPath, { recursive: true })
      .then(() => {
        const child = spawn('tar', [
          '-xzf',
          path.join(directory, nodeBinary),
          '-C',
          destinationPath,
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

const startNode = async (directory, network, feedbackFunction) => {
  const platform = os.platform();

  let scriptName;
  if (platform === 'win32') {
    scriptName = 'script.bat';
  } else {
    scriptName = 'script.sh';
  }
};

const downloadConfig = async (directory, network) => {
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
      directory: directory,
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
  });

  ipcMain.handle('getDefaultPath', () =>
    path.join(app.getPath('home'), '.cardano-node-ui')
  );
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
