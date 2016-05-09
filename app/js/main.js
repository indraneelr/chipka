'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var globalShortcut = require('global-shortcut');
var ipc = require('electron').ipcMain;
var config = require('./config').config;
var contentRepository = require('./contentRepository').ContentRepository(config.db);
var superClipboard = require('./superClipboard').SuperClipboard(contentRepository);
var Tray = require('tray');
var path = require('path');

var mainWindow = null;
var appIcon = null;
const INITIAL_CLIPBOARD_SIZE = config.initialClipboardSize;

function updateClipboardTop(newClipboardItem) {
    console.log("clipboard-update in main");
    mainWindow.webContents.send('clipboard-updated',newClipboardItem);
}

function refreshClipboard(clipboardItemsList){
    console.log("in clipboardRefreshedCallback");
    mainWindow.webContents.send('clipboard-loaded',clipboardItemsList);
}

function loadSearchResults(searchResults){
    console.log("in searchResultsFetched");
    mainWindow.webContents.send('clipboard-search-results-fetched',searchResults);
}

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        frame: config.frame,
        height: config.height,
        resizable: config.resizable,
        width: config.width,
        useContentSize: true
    });

    initTray();
    superClipboard.init(updateClipboardTop);
    mainWindow.loadUrl('file://' + __dirname + '/../index.html');
    setGlobalShortcuts();
});

function initTray(){
  appIcon = new Tray(path.join(__dirname,'../img/chipka-clip-1x.png'));
  appIcon.on("clicked",function(){
    toggleWindowState();
  });
}

function setGlobalShortcuts() {
    globalShortcut.unregisterAll();
    globalShortcut.register(config.appShortcut, function () {
        console.log("caught "+config.appShortcut);
        //mainWindow.webContents.send('global-shortcut', 'copy');
        toggleWindowState();

    });
}

function toggleWindowState(){
    if(mainWindow.isMinimized()){
            mainWindow.restore();
            mainWindow.focus();
    }
    else if(mainWindow.isFocused()){
            mainWindow.minimize();
    }
    else if(!mainWindow.isFocused() || !mainWindow.isVisible()){
        mainWindow.show();
        mainWindow.focus();
    }
}

function fetchClipboardData() {
    superClipboard.fetch(INITIAL_CLIPBOARD_SIZE, function (error, data) {
        console.log(error);
        refreshClipboard(data);
    });
}

ipc.on('load-clipboard',function(){
    fetchClipboardData();
});

ipc.on('search-clipboard',function(event,searchText){
    console.log("search text",searchText);
    if(searchText){
        superClipboard.search(searchText,loadSearchResults);
    }
});

ipc.on('item-selected',function(event,data){
    superClipboard.selectItem(data,function(){
        fetchClipboardData();
    });
});

ipc.on('item-deleted',function(event,data){
    superClipboard.delete(data,function(){
      fetchClipboardData();
    });
});

ipc.on('close-main-window', function () {
    app.quit();
});
