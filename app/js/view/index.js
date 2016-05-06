'use strict';

//TODO : remove console logs, introduce proper logging.
//TODO : introduce exception handling
//TODO : unit tests

var ipc = require('ipc');
var React = require('react');
var ReactDOM = require('react-dom');
var _ = require('lodash');

var closeEl =document.querySelector('.close');


closeEl.addEventListener('click', function () {
    ipc.send('close-main-window');
});

var ENTER_KEY_CODE = 13;
var UP_KEY_CODE = 38;
var DOWN_KEY_CODE = 40;
var TAB_KEY_CODE = 9;

var MainWindow = React.createClass({
    filterList: function(){
        if(this.searchString){
            var filterCriteria = this.searchString;
            var updatedList = this.state.initialList;
            updatedList = updatedList.filter(function(item){
              return item.content.toLowerCase().search(
                filterCriteria.toLowerCase()) !== -1;
            });
            this.setState({items: updatedList});
        }
        else{
            this.setState({items: this.state.initialList});
        }
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
        var self = this;
        ipc.on('clipboard-updated', function (data) {
            self.state.initialList.unshift(data);
            self.setClipboardState(self.state.initialList);
        });
        ipc.on('clipboard-loaded', function (data) {
            self.state.initialList = data;
            self.setClipboardState(self.state.initialList);
        });
        ipc.on('clipboard-search-results-fetched',function(searchResults){
            if(searchResults){
                self.state.initialList = _.unionBy(self.state.initialList,searchResults,'_id');
                console.log("search list",self.state.initialList);
                self.filterList();
            }
        })
        ipc.send('load-clipboard');
    },
    onClipboardSelection: function(data){
        this.setState({selectedItem:data});
    },

    searchFullHistory:function(event){
        if(event && event.nativeEvent && event.nativeEvent.keyCode === ENTER_KEY_CODE){
            ipc.send('search-clipboard',event.target.value);
        }
    },
    render: function(){
        var self = this;
        return (
            <div>
                <div className="section search-box">
                    <input
                        autoFocus
                        type="text"
                        tabIndex="1"
                        placeholder="search"
                        onChange={function(event){
                                self.searchString = event.target.value;
                                self.filterList();
                            }
                        }
                        onKeyDown={this.searchFullHistory}
                    />
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
    selectItem: function(item,index){
        this.props.onSelect(item);
        ipc.send('item-selected',item);
        this.focusOut(this.refs[index]);
    },

    keypress:function(event,item,index){
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
        var self = this;
        self.refs= [];
        return (
            <ul tabIndex="0" className="items" size="10" > {
                    this.props.items.map(function(item,index){
                        var content = item ? item.content: "";
                        return <li
                            tabIndex="1"
                            className="item"
                            onKeyDown={function(event){
                                if(event.target === self.refs[index]){
                                    self.keypress(event.nativeEvent, item, index);
                                }
                            }}
                            onClick={self.selectItem.bind(self,item,index)}
                            ref={function(elm){
                                if(elm){
                                    self.refs[index] = elm;
                                }
                            }}>{content}
                            </li>
                    })
                }
            </ul>
        )
    }
});

ReactDOM.render(<MainWindow/>, document.getElementById('main'));

// exports.MainWindow = MainWindow;
