"use strict";
var mockRequire = require('mock-require');
var currentClipboardText="";

mockRequire("clipboard",{
    writeText:function(data){
        console.log("writing to clipboard : ",data);
    },
    readText:function(){
        return currentClipboardText;
    }
});

mockRequire("./config",{
    config:{
        pollInterval:100
    }
});
var config = require('../app/js/config').testConfig;
var contentRepository = require('../app/js/contentRepository').ContentRepository(config.db);
var superClipboard = require('../app/js/superClipboard').SuperClipboard(contentRepository);

describe("super clipboard",function(){
/*
    beforeEach(function(done){
        clearAllData(done);
        currentClipboardText="how are?";
    });

    it("save the clipboard string to the datastore",function(done){
        spyOn(contentRepository,"save").and.callThrough();
        var dataSaved = false;

        superClipboard.save("my clipboard string 1",function(err,newClipboardData){
            if(err) return;
            dataSaved=newClipboardData.content;
            expect(dataSaved).toBe("my clipboard string 1");
            done();
        });
        expect(contentRepository.save).toHaveBeenCalled();
    });*/

    describe("for existing data",function(){
        var testNumber = 1;
        beforeEach(function(done){
            createTestDataWithLength(3,"random clipboard string ",done);
            console.log(testNumber," : in before each..");
            console.log("------------------------")
        });
        var myAfterEach= function(done){
            clearAllData(done,testNumber);
            console.log(testNumber," : in after each..");
            testNumber++;
            console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~")
        };


        it("should retrieve in descending order of last updated entry",function(done){
            console.log("\n\n","in test 1","\n");
            var dataFetched = null;
            superClipboard.fetch(3,function(err,data){
                dataFetched = data;
                expect(dataFetched[0].content).toBe("random clipboard string _2_");
                console.log("======== done test 1 =============");
                //done();
                myAfterEach(done);
            });
        });

        it("should not store last seen clipboard item when superclipboard is re-initialised",function(done){
            console.log("\n\n","in test 3","\n");
            currentClipboardText ="random clipboard string _2_";
            spyOn(superClipboard,"save").and.callThrough();
            var clipboardTimer = superClipboard.init(function(data){
                console.log("in init callback");
            });

            setTimeout(function(){
                console.log("timeout executing..");
                expect(superClipboard.save).not.toHaveBeenCalled();
                superClipboard.stopPolling();
                console.log("======== done test 3 =============");
                //done();
                myAfterEach(done);
            },300);
        });

        it("should update the last updated timestamp to now when an item is selected",function(done){
            console.log("\n\n","in test 2","\n");
            spyOn(contentRepository,"markAsUpdated").and.callThrough();

            superClipboard.search("random clipboard string _1_",function(err,data){
                var dataFetched = Array.isArray(data) ? data[0]:data;
                var updatedTime = dataFetched.updatedAt;

                superClipboard.selectItem(dataFetched,function(){
                    var argsToMarkAsUpdated = contentRepository.markAsUpdated.calls.argsFor(0);
                    expect(argsToMarkAsUpdated[1].updatedAt).toBeGreaterThan(updatedTime);
                });

                superClipboard.fetch(4,function(err,data){
                    dataFetched = data;
                    expect(dataFetched[0].content).toBe("random clipboard string _1_");
                    expect(dataFetched.length).toBe(3);
                    console.log("======== done test 2 =============");
                    //done();
                    myAfterEach(done);

                });
            });
        });

        it("should automatically store the last item copied into clipboard",function(){

        });
    });



    function clearAllData(doneCallback,testName){
        contentRepository.removeAll(function (err, numRemoved) {
            contentRepository.fetch(1, function (err, data) {
                doneCallback();
            });

            contentRepository.compactDatafile(function(){
                console.log("clearing data",testName+" : ",numRemoved);
                //doneCallback();
            });
        });
    }
    function synchronousWait(ticks){
        for(var count=0;count<ticks;count++){
            var val = 1;
            val++;
            val--;
        }
    }
    function createTestDataWithLength(size,text,doneCallback){
        var counter =0;

        var saveCallback = function (err, data) {
            if(err){
                console.log("error while saving",err);
                return;
            }
            counter++;
            if(counter=== size){
                doneCallback();
                return;
            }
            synchronousWait(2000000);
            superClipboard.save(text+"_"+counter+"_",saveCallback)
        };

        superClipboard.save(text+"_"+counter+"_",saveCallback);

    }
});