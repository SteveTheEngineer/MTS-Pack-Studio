const { app, BrowserWindow } = require("electron");

app.on("ready", () => {
    const win = new BrowserWindow({
        height: 600,
        width: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        show: false
    });
    win.removeMenu();
    win.webContents.openDevTools();
    //win.loadFile("dist/mts-pack-studio/index.html");
    win.loadURL("http://localhost:4200").then(() => win.show());
});