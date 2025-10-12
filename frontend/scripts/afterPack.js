const path = require("path");
const rcedit = require("rcedit");

module.exports = async function afterPack(context) {
  const { appOutDir, packager, electronPlatformName } = context;
  if (electronPlatformName !== "win32") return;

  const exePath = path.join(appOutDir, `${packager.appInfo.productFilename}.exe`);
  const iconPath = path.join(packager.buildResourcesDir, "icon.ico");

  console.log("[afterPack] Forcing EXE icon:", exePath, "→", iconPath);
  await rcedit(exePath, { icon: iconPath });
};