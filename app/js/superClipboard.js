/**
 * Created by indraner on 24/01/16.
 */
'use strict';

var path = require('path');
var clipboard = require('clipboard');
var config= require('./config').config;
//console.log(require.resolve('electron'));
//const contentRepository = require('./contentRepository').contentRepository;

var lastSeenClipboardItem=null;

var superClipboard = function(contentRepository){
    var stopPolling = false;
    return {
        stopPolling: function(){
            stopPolling = true;
        },
        init: function (updateCallback) {
            var self = this;
            //console.log("poll interval : ",config.pollInterval);
            var pollFunction = function () {
                recordLastClipboardSelection.call(self,updateCallback);
                if(!stopPolling){
                    setTimeout(pollFunction, config.pollInterval)
                }
            };
            setTimeout(pollFunction, config.pollInterval);
        },
        fetch: function (numberOfItems, resultCallback) {
            contentRepository.fetch(numberOfItems, resultCallback);
        },
        search: function (searchText, resultCallback) {
            var query = {
                content: new RegExp(searchText, "i")
            };
            contentRepository.search(query, resultCallback);
        },
        selectItem: function (clipboardItem,callback) {
            //console.log("######## selected item #########")
            // console.log(clipboardItem);
            //console.log(JSON.stringify(clipboardItem));
            //console.log("-------------")
            clipboardItem.updatedAt = new Date().toISOString();
            contentRepository.markAsUpdated({_id: clipboardItem._id}, {updatedAt: clipboardItem.updatedAt}, function (error, data) {
                if (!error) {
                    clipboard.writeText(clipboardItem.content);
                    lastSeenClipboardItem = clipboardItem;
                    if(callback){
                        callback(data);
                    }
                    return;
                }
                console.log("\\\\\\\\\\\\\\\\\\\\\\\\\\ error ///////////////////////////////////");
                console.log(error);
            })
        },
        save: function (text, resultCallback) {
            var clipboardData = {};
            clipboardData.content = text;
            var now = new Date().toISOString();
            clipboardData.createdAt = now;
            clipboardData.updatedAt = now;
            contentRepository.save(clipboardData, resultCallback);
        }
    }
};

function recordLastClipboardSelection(updateCallback) {
    var text = clipboard.readText();
    var self = this;
    fetchLastSeenClipboardText.call(this,function(clipboardItem){
        //console.log("comparing text ***********************");
        //console.log(text);
        //console.log(JSON.stringify(clipboardItem));
        // console.log("----------------");

        if(clipboardItem.content !== text){
            
            self.save(text,function(err,newClipboardData){
                console.error(err);
                console.log("new text detected",text);
                // console.log("::::::::::::::::::::::::::");
                // console.log(JSON.stringify(newClipboardData));
                // console.log("::::::::::::::::::::::::::");

                lastSeenClipboardItem = newClipboardData;
                updateCallback(newClipboardData);
            });
        }
        else{
            lastSeenClipboardItem = clipboardItem;
        }
    });
    
}

function fetchLastSeenClipboardText(resultCallback){
    if(!lastSeenClipboardItem){
        //console.log("vvvvvvvvvvvvvvvvvvvvvvvvvvvvvv");
        // console.log(JSON.stringify(lastSeenClipboardItem));
        // console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
        this.fetch(1,function(error,clipboardItems){
            if(error){
                console.error(error);
                return
            }
            var clipboardItem = (clipboardItems?clipboardItems[0]:{}) || {};
            resultCallback(clipboardItem);
        });
        return;
    }
    // console.log("reusing existing value!!!!!!!!!!!!!!");
    resultCallback(lastSeenClipboardItem);
}

exports.SuperClipboard = superClipboard;