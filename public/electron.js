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

const nodeUrl = {
  darwin:
    'https://update-cardano-mainnet.iohk.io/cardano-node-releases/cardano-node-1.35.5-macos.tar.gz',
  win32:
    'https://update-cardano-mainnet.iohk.io/cardano-node-releases/cardano-node-1.35.5-win64.zip',
  linux:
    'https://update-cardano-mainnet.iohk.io/cardano-node-releases/cardano-node-1.35.5-linux.tar.gz',
};

const downloadNodeBinary = async (directory) => {
  const binaryUrl = nodeUrl[process.platform];
  if (binaryUrl) {
    const downloader = new Downloader({
      url: binaryUrl,
      directory: directory,
    });
    try {
      const { filePath, downloadStatus } = await downloader.download();
      console.log('All done');
    } catch (error) {
      console.log('Download failed', error);
    }
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
      directory: directory,
    });
    try {
      const { filePath, downloadStatus } = await downloader.download();
      console.log('All done');
    } catch (error) {
      console.log('Download failed', error);
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

  ipcMain.on('start-node', (event, directory, network = 'mainnet') => {
    mainWindow.webContents.send('node-status', {
      status: 'download',
      message: 'Download cardano-node binary',
    });
    downloadNodeBinary(directory);
    mainWindow.webContents.send('node-status', {
      status: 'download',
      message: 'Download configuration and node topology',
    });
    downloadConfig(directory, network);
    mainWindow.webContents.send('node-status', {
      status: 'running',
      message: 'Node initialization running',
    });
  });

  ipcMain.handle('getDefaultPath', () =>
    path.join(app.getPath('home'), '.cardano-node')
  );
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
