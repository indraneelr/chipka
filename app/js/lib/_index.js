'use strict';

//TODO : remove console logs, introduce proper logging.
//TODO : introduce exception handling
//TODO : unit tests

var ipc = require('ipc');
var React = require('react');
var ReactDOM = require('react-dom');
var _ = require('lodash');

var closeEl = document.querySelector('.close');

closeEl.addEventListener('click', function () {
    ipc.send('close-main-window');
});

var ENTER_KEY_CODE = 13;
var UP_KEY_CODE = 38;
var DOWN_KEY_CODE = 40;
var TAB_KEY_CODE = 9;

var MainWindow = React.createClass({
    displayName: 'MainWindow',

    filterList: function filterList() {
        if (this.searchString) {
            var filterCriteria = this.searchString;
            var updatedList = this.state.initialList;
            updatedList = updatedList.filter(function (item) {
                return item.content.toLowerCase().search(filterCriteria.toLowerCase()) !== -1;
            });
            this.setState({ items: updatedList });
        } else {
            this.setState({ items: this.state.initialList });
        }
    },
    getInitialState: function getInitialState() {
        return {
            initialList: [],
            items: []
        };
    },
    componentWillMount: function componentWillMount() {},
    setClipboardState: function setClipboardState(itemsList) {
        this.setState({
            items: itemsList,
            selectedItem: itemsList[0]
        });
    },
    componentDidMount: function componentDidMount() {
        var self = this;
        ipc.on('clipboard-updated', function (data) {
            self.state.initialList.unshift(data);
            self.setClipboardState(self.state.initialList);
        });
        ipc.on('clipboard-loaded', function (data) {
            self.state.initialList = data;
            self.setClipboardState(self.state.initialList);
        });
        ipc.on('clipboard-search-results-fetched', function (searchResults) {
            if (searchResults) {
                self.state.initialList = _.unionBy(self.state.initialList, searchResults, '_id');
                console.log("search list", self.state.initialList);
                self.filterList();
            }
        });
        ipc.send('load-clipboard');
    },
    onClipboardSelection: function onClipboardSelection(data) {
        this.setState({ selectedItem: data });
    },

    searchFullHistory: function searchFullHistory(event) {
        if (event && event.nativeEvent && event.nativeEvent.keyCode === ENTER_KEY_CODE) {
            ipc.send('search-clipboard', event.target.value);
        }
    },
    render: function render() {
        var self = this;
        return React.createElement(
            'div',
            null,
            React.createElement(
                'div',
                { className: 'section search-box' },
                React.createElement('input', {
                    autoFocus: true,
                    type: 'text',
                    tabIndex: '1',
                    placeholder: 'search',
                    onChange: function onChange(event) {
                        self.searchString = event.target.value;
                        self.filterList();
                    },
                    onKeyDown: this.searchFullHistory
                })
            ),
            React.createElement(
                'div',
                { className: 'section clipboard' },
                React.createElement(ClipboardItems, { items: this.state.items, onSelect: this.onClipboardSelection })
            )
        );
    }
});

/*var CurrentSelection = React.createClass({
    render:function(){
        var content = this.props.item? this.props.item.content : "";
        return (
            <div>{content}</div>
        )
    }
});*/

var ClipboardItems = React.createClass({
    displayName: 'ClipboardItems',


    focusOut: function focusOut(elm) {
        if (elm) {
            elm.focus();
            elm.blur();
        }
    },

    focusOn: function focusOn(elm) {
        if (elm) {
            elm.focus();
        }
    },
    selectItem: function selectItem(item, index) {
        this.props.onSelect(item);
        ipc.send('item-selected', item);
        this.focusOut(this.refs[index]);
    },

    keypress: function keypress(event, item, index) {
        if (event) {
            switch (event.keyCode) {
                case ENTER_KEY_CODE:
                    this.selectItem(item, index);
                    break;
                case UP_KEY_CODE:
                    if (index !== 0) {
                        this.focusOn(this.refs[index - 1]);
                    }
                    break;
                case DOWN_KEY_CODE:
                    if (index !== this.refs.length - 1) {
                        this.focusOn(this.refs[index + 1]);
                    }
                    break;
            }
        }
    },
    render: function render() {
        var self = this;
        self.refs = [];
        return React.createElement(
            'ul',
            { tabIndex: '0', className: 'items', size: '10' },
            ' ',
            this.props.items.map(function (item, index) {
                var content = item ? item.content : "";
                return React.createElement(
                    'li',
                    {
                        tabIndex: '1',
                        className: 'item',
                        onKeyDown: function onKeyDown(event) {
                            if (event.target === self.refs[index]) {
                                self.keypress(event.nativeEvent, item, index);
                            }
                        },
                        onClick: self.selectItem.bind(self, item, index),
                        ref: function ref(elm) {
                            if (elm) {
                                self.refs[index] = elm;
                            }
                        } },
                    content
                );
            })
        );
    }
});

ReactDOM.render(React.createElement(MainWindow, null), document.getElementById('main'));

// exports.MainWindow = MainWindow;
