// Build script to avoid code signing issues
const builder = require('electron-builder');
const Platform = builder.Platform;

builder.build({
  targets: Platform.WINDOWS.createTarget('dir'),
  config: {
    appId: 'com.gofood.xuatexcel',
    productName: 'Gofood Export Excel',
    directories: {
      output: 'release'
    },
    win: {
      target: 'dir'
    },
    npmRebuild: false
  }
})
.then(() => {
  console.log('Build completed successfully!');
})
.catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
