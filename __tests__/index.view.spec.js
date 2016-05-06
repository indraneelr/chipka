/**
/**
 * Created by indraner on 23/04/16.
 */
'use strict';

//var mockRequire = require('mock-require');

// jest.setMock('ipc',{});
// jest.unmock('../app/js/view/index');

// mockRequire("electronModules",{

// });

//var ipc =require.requireMock('ipc');

var moduleSpies = {};
var originalJsLoader = require.extensions['.js'];

var spyOnModule = function spyOnModule(module) {
  var path          = require.resolve(module);
  var spy           = jasmine.createSpy("spy on module \"" + module + "\"");
  // spyOn(spy,"ipc").and.callFake(function(){ return {}})
  // spyOn(spy,"ipc").and.stub()
  console.log("electronModules",path)
  spy.and.stub()
  moduleSpies[path] = spy;
  delete require.cache[path];
  return spy;
};

require.extensions['.js'] = function (obj, path) {
  if (moduleSpies[path])
    obj.exports = moduleSpies[path];
  else
    return originalJsLoader(obj, path);
}


import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
// import MainWindow from '../app/js/view/index';


describe('CheckboxWithLabel', () => {
spyOnModule('../app/js/electronModules');

var MainWindow = require('../app/js/view/index');
});