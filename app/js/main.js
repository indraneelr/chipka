'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var globalShortcut = require('global-shortcut');
var ipc = require('ipc');
var config = require('./config').config;
var contentRepository = require('./contentRepository').ContentRepository(config.db);
var superClipboard = require('./superClipboard').SuperClipboard(contentRepository);
var Tray = require('tray');
var path = require('path');

var mainWindow = null;
var appIcon = null;
const INITIAL_CLIPBOARD_SIZE = config.initialClipboardSize;

function clipboardUpdated(newClipboardItem) {
    console.log("clipboard-update in main");
    mainWindow.webContents.send('clipboard-updated',newClipboardItem);
}

function clipboardLoaded(clipboardItemsList){
    console.log("in clipboardLoadedCallback");
    mainWindow.webContents.send('clipboard-loaded',clipboardItemsList);
}

function searchResultsFetched(searchResults){
    console.log("in searchResultsFetched");
    mainWindow.webContents.send('clipboard-search-results-fetched',searchResults);
}
app.on('ready', function() {
    mainWindow = new BrowserWindow({
        frame: config.frame,
        height: config.height,
        resizable: config.resizable,
        width: config.width
    });

    initTray();
    superClipboard.init(clipboardUpdated);
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
        clipboardLoaded(data);
    });
}

ipc.on('load-clipboard',function(){
    fetchClipboardData();
});

ipc.on('search-clipboard',function(event,searchText){
    console.log("search text",searchText);
    if(searchText){
        superClipboard.search(searchText,searchResultsFetched);
    }
});

ipc.on('item-selected',function(event,data){
    superClipboard.selectItem(data,function(){
        fetchClipboardData();
    });
});

ipc.on('close-main-window', function () {
    app.quit();
});
