'use strict';
/*
var remote = require('remote');
var Tray = remote.require('tray');
var path = require('path');


var trayIcon = null;

if (process.platform === 'darwin') {
    trayIcon = new Tray(path.join(__dirname, 'img/tray-iconTemplate.png'));
}
else {
    trayIcon = new Tray(path.join(__dirname, 'img/tray-icon-alt.png'));
}*/

//TODO : remove console logs, introduce proper logging.
//TODO : introduce exception handling
//TODO : unit tests
//TODO : externalize configs

var ipc = require('ipc');
var React = require('react');
var ReactDOM = require('react-dom');

var closeEl = document.querySelector('.close');

closeEl.addEventListener('click', function () {
    console.log("caught close event");
    ipc.send('close-main-window');
});

var ENTER_KEY_CODE = 13;
var UP_KEY_CODE = 38;
var DOWN_KEY_CODE = 40;
var TAB_KEY_CODE = 9;

var MainWindow = React.createClass({
    filterList: function(event){
        var updatedList = this.state.initialList;
        updatedList = updatedList.filter(function(item){
          return item.content.toLowerCase().search(
            event.target.value.toLowerCase()) !== -1;
        });
        this.setState({items: updatedList});
    },
    getInitialState: function(){
     return {
            initialList:[],
            items: []
        }
    },
    componentWillMount:function(){
        
    },
    setClipboardState:function(itemsList){
        this.setState({
            items: itemsList,
            selectedItem:itemsList[0]
        })
    },
    componentDidMount: function(){
        console.log("~~~~~~~~~~~DID MOUNT~~~~~~~~~~~~");
        var self = this;
        console.log(this);
        console.log("---------did mount");

        ipc.on('clipboard-updated', function (data) {
            console.log("~~~~~~~~~~~~UPDATE~~~~~~~~~~~");
            self.state.initialList.unshift(data);
            self.setClipboardState(self.state.initialList);
        });
        ipc.on('clipboard-loaded', function (data) {
            console.log("~~~~~~~~~~~~LOADED~~~~~~~~~~~");
            console.log("in clipboard-loaded handler for arg : ");
            console.log(JSON.stringify(data));

            self.state.initialList = data;
            self.setClipboardState(self.state.initialList);
        });
        ipc.send('load-clipboard');
    },
    onClipboardSelection: function(data){
        this.setState({selectedItem:data});
    },
    render: function(){
        return (
            <div>
                <div className="section search-box">
                    <input autoFocus type="text" tabIndex="1" placeholder="search" onChange={this.filterList} />
                </div>
                <div className="section clipboard">
                    <ClipboardItems items={this.state.items} onSelect={this.onClipboardSelection} />
                </div>
            </div>
        );
    }
})

/*var CurrentSelection = React.createClass({
    render:function(){
        var content = this.props.item? this.props.item.content : ""; 
        return (
            <div>{content}</div>
        )
    }
});*/

var ClipboardItems = React.createClass({

    focusOut: function(elm) {
        if(elm) {
            elm.focus();
            elm.blur();
        }
    },

    focusOn:function(elm){
        if(elm){
            elm.focus();
        }
    },
    selectItem: function(data,item){
        console.log('^^^^^^^^^^selectItem^^^^^^^');
        console.log(JSON.stringify(data));
        this.props.onSelect(data);
        ipc.send('item-selected',data);
        this.focusOut(this.refs[index]);
    },

    keypress:function(event,item,index){
        console.log("key press detected : ",event,item,index);

        if(event ){
            switch(event.keyCode){
                case ENTER_KEY_CODE:this.selectItem(item,index);
                    break;
                case UP_KEY_CODE:if(index !== 0) {
                    this.focusOn(this.refs[index-1]);
                }
                    break;
                case DOWN_KEY_CODE:if(index !== this.refs.length-1){
                    this.focusOn(this.refs[index+1]);
                }
                    break;
            }
        }
    },
    render:function(){
        console.log("props value"); 
        console.log(this.props.items);
        console.log("--------------")
        var self = this;
        self.refs= [];
        return (
            <ul tabIndex="0" className="items" size="10" > {
                    this.props.items.map(function(item,index){
                       return <li
                            tabIndex="1"
                            className="item"
                            onKeyDown={function(event){
                                self.keypress(event.nativeEvent,item,index);
                            }}
                            onClick={self.selectItem.bind(self,item,index)}
                            ref={function(elm){
                                if(elm){
                                    self.refs[index] = elm;
                                }
                            }}>{item.content}
                            </li>
                    })
                }
            </ul>
        )
    }
});

ReactDOM.render(<MainWindow/>, document.getElementById('main'));
