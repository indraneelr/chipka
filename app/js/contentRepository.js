/**
 * Created by indraner on 24/01/16.
 */
var Datastore = require('nedb');

var repository =function(filename) {
    var dbFile = filename || 'db/clipboardHistory';
    var db = new Datastore({
        filename: dbFile,
        autoload: true,
        corruptAlertThreshold:0
    });

    return {
        save: function (record, callback) {
            db.insert(record, callback);
        },
        markAsUpdated: function (query, value, callback) {
            db.update(query, {$set: value}, callback);
        },
        fetch: function (numberOfRecords, callback) {
            db.find({}).sort({updatedAt: -1}).limit(numberOfRecords).exec(callback);
        },
        search: function (query, callback) {
            db.find(query).sort({updatedAt: -1}).exec(callback);
        },
        removeAll: function(callback){
            db.remove({}, { multi: true },callback)
        },
        compactDatafile:function(callback){
            db.persistence.compactDatafile();
            db.on("compaction.done",function(err,response){
                callback(err,response);
            });
        },
        delete :function(item,callback){
            db.remove(item,{},callback)
        }

    }
};

exports.ContentRepository = repository;
