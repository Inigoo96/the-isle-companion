const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');
const path = require('path');

module.exports = async ({ appOutDir, packager }) => {
  const platform = packager.platform.nodeName;
  const ext = platform === 'win32' ? '.exe' : platform === 'darwin' ? '.app' : '';
  const executablePath = path.join(
    appOutDir,
    packager.appInfo.productFilename + ext
  );

  await flipFuses(executablePath, {
    version: FuseVersion.V1,
    [FuseV1Options.RunAsNode]:                         false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]:     false,
    [FuseV1Options.OnlyLoadAppFromAsar]:               true,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
  });

  console.log(`[afterPack] Fuses applied to ${path.basename(executablePath)}`);
};
