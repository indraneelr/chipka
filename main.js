'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
//var globalShortcut = require('global-shortcut');
var ipc = require('ipc');
var config = require('./app/js/config').config;
var contentRepository = require('./app/js/contentRepository').ContentRepository(config.db);
var superClipboard = require('./app/js/superClipboard').SuperClipboard(contentRepository);

var mainWindow = null;

const INITIAL_CLIPBOARD_SIZE = 10;

function clipboardUpdated(newClipboardItem) {
    console.log("clipboard-update in main");
    mainWindow.webContents.send('clipboard-updated',newClipboardItem);
}

function clipboardLoaded(clipboardItemsList){
    console.log("in clipboardLoadedCallback");
    // console.log(clipboardItemsList);
    mainWindow.webContents.send('clipboard-loaded',clipboardItemsList);
}
app.on('ready', function() {
    mainWindow = new BrowserWindow({
        frame: false,
        height: 700,
        resizable: false,
        width: 368
    });

    superClipboard.init(clipboardUpdated);
    mainWindow.loadUrl('file://' + __dirname + '/app/index.html');
});

/*function setGlobalShortcuts() {
    globalShortcut.unregisterAll();

    globalShortcut.register('cmd+shift+c', function () {
        console.log("caught cmd+shift+c");
        mainWindow.webContents.send('global-shortcut', 'copy');
    });
}*/

ipc.on('load-clipboard',function(){
    superClipboard.fetch(INITIAL_CLIPBOARD_SIZE,function(error,data){
        console.log(error);
        clipboardLoaded(data);
    });
})

ipc.on('item-selected',function(event,data){
    console.log("$$$$$$")
    console.log(JSON.stringify(data));
    console.log("-------")
    superClipboard.selectItem(data);
    // mainWindow.webContents.send('clipboard-refreshed');
});

ipc.on('close-main-window', function () {
    app.quit();
});
