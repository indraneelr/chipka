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

var ipc = require('ipc');
var React = require('react');
var ReactDOM = require('react-dom');

var closeEl = document.querySelector('.close');

closeEl.addEventListener('click', function () {
    console.log("caught close event");
    ipc.send('close-main-window');
});

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
                <div className="search-bar" ><input type="text" onChange={this.filterList} /></div>
                <CurrentSelection className="current-selection" item={this.state.selectedItem} />
                <ClipboardItems items={this.state.items} onSelect={this.onClipboardSelection} />
            </div>
        );
    }

})

var CurrentSelection = React.createClass({
    render:function(){
        var content = this.props.item? this.props.item.content : ""; 
        return (
            <div>{content}</div>
        )
    }
});

var ClipboardItems = React.createClass({
    selectItem: function(data){
        console.log('^^^^^^^^^^selectItem^^^^^^^');
        console.log(JSON.stringify(data));
        this.props.onSelect(data);
        ipc.send('item-selected',data);
    },
    render:function(){
        console.log("props value"); 
        console.log(this.props.items);
        console.log("--------------")
        var self = this;
        return (
            <ul> {
                    this.props.items.map(function(item){
                       return <li className="item" onClick={self.selectItem.bind(self,item)}>{item.content}</li>
                    })
                }
            </ul>
        )
    }
});

ReactDOM.render(<MainWindow/>, document.getElementById('main'));
