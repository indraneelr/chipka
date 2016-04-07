/**
 * Created by indraner on 24/01/16.
 */
var ClipboardItem = function(content,createdAt,updatedAt,title){
    var self = {};
    self.content = content;
    self.createdAt = createdAt;
    self.content = updatedAt;
    self.title = title;

    self.setCreatedToNow = function(){
        self.createdAt = new Date().toISOString();
    };
    self.setUpdatedToNow = function(){
        self.updatedAt = new Date().toISOString();
    };
    return self;
};