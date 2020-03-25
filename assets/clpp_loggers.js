/*! @castlabs/prestoplay 5.1.38, 23-03-2020 Copyright (c) 2020 castLabs GmbH, All Rights reserved */

/**
 * This is a helper which adds UI for enabling / disabling available logs
 * handy tool to debug possible problems in our API.
 * All you have to do is to include this file in browser at any time, making sure the "clpp" is available in global scope
 */
(function () {
  var LEVELS = {
    DEFAULT: -1,
    NONE: 0,
    ERROR: 1,
    WARNING: 2,
    INFO: 3,
    DEBUG: 4
  };

  var TYPES = {
    GLOBAL: 0,
    ALL: 1
  };

  var localStorageKey = 'clpp_loggers';
  var saveToLocalStorage = false;
  var ALL = -1;

  function addBreak(parent) {
    parent.appendChild(document.createElement('br'));
  }

  function addButton(parent, value, onClick) {
    var button = document.createElement('input');
    button.setAttribute('type', 'button');
    button.setAttribute('value', value);
    button.style.display = 'inline-block';
    button.addEventListener('click', onClick);
    parent.appendChild(button);
    return button;
  }

  function addClearButton(parent) {
    addButton(parent, 'Hide Loggers', function () {
      parent.innerHTML = '';
      addShowButton(parent);
    });
  }

  function addContainer(parent) {
    var container = document.createElement('div');
    container.style = 'display:block;padding-bottom:2px;';
    container.className = 'logger-container';
    addFirst(parent, container);
    return container;
  }

  function addCss() {
    var css = document.createElement('style');
    css.innerHTML = '' +
      '.logger-element{' +
      '  display: inline-block;' +
      '  box-sizing: border-box;' +
      '  padding: 3px 10px 3px 3px;' +
      '  vertical-align: top;' +
      '  width: 20%;' +
      '}' +
      '.logger-container {' +
      '  font-size: 12px;' +
      '  word-break: break-word;' +
      '}' +
      '.logger-container input {' +
      '  width: auto;' +
      '}' +
      '@media only screen and (max-width: 1000px) {' +
      '  [class*="logger-element"] {' +
      '    width: 25%' +
      '  }' +
      '}' +
      '@media only screen and (max-width: 750px) {' +
      '  [class*="logger-element"] {' +
      '    width: 33%' +
      '  }' +
      '}' +
      '@media only screen and (max-width: 600px) {' +
      '  [class*="logger-element"] {' +
      '    width: 50%' +
      '  }' +
      '}' +
      '@media only screen and (max-width: 250px) {' +
      '  [class*="logger-element"] {' +
      '    width: 100%' +
      '  }' +
      '}' +

      '';
    document.querySelector('head').appendChild(css);
  }

  function addFirst(parent, element) {
    var firstElement = parent.firstElementChild;
    if (firstElement) {
      parent.insertBefore(element, firstElement);
    } else {
      parent.appendChild(element);
    }
  }

  function addLevels(parent, selectedValue) {
    Object.keys(LEVELS).forEach(function (key) {
      var value = LEVELS[key];
      var text = key;
      var selected = selectedValue === value;
      addOption(parent, value, text, selected);
    });
  }

  function addLogger(parent, name, value, type) {
    var logger = document.createElement('select');
    logger.setAttribute('size', 1);
    addLevels(logger, value);
    logger.addEventListener('change', function () {
      var value = parseInt(this.value, 10);
      var keys = Object.keys(clpp.log.getLoggers());
      if (type === TYPES.ALL) {
        ALL = value;
        var defaultLogLevel = value;
        if (ALL === -1) {
          defaultLogLevel = 3;
        }
        clpp.log.setLogLevel(defaultLogLevel);
        keys.forEach(function (key) {
          clpp.log.setTagLevel(key, value);
        });
        parent.innerHTML = '';
        addLoggerList(parent);
      } else if (type === TYPES.GLOBAL) {
        clpp.log.setLogLevel(value);
      } else {
        clpp.log.setTagLevel(name, value);
      }
      ensureLocalStorage();
    });

    createLoggerUI(parent, logger, name);
  }

  function addLoggerList(parent) {
    var loggers = clpp.log.getLoggers();
    var keys = Object.keys(loggers);
    var shakaOnly = keys.filter(function (value) {
      return value.indexOf('shaka') >= 0;
    });
    var withoutShaka = keys.filter(function (value) {
      return value.indexOf('shaka') < 0;
    });
    shakaOnly.sort();
    withoutShaka.sort();
    keys = [];
    if (window.shaka && window.shaka.log) {
      keys = keys.concat(shakaOnly);
    }
    keys = keys.concat(withoutShaka);
    addClearButton(parent);
    addSaveCheckbox(parent);
    addSearchBox(parent);
    addBreak(parent);

    addLogger(parent, 'ALL', ALL, TYPES.ALL);
    addLogger(parent, 'GLOBAL', clpp.log.getLogLevel(), TYPES.GLOBAL);
    keys.forEach(function (key) {
      var value = loggers[key];
      addLogger(parent, key, value);
    });
  }

  function addOption(parent, value, text, selected) {
    var option = document.createElement('option');
    option.setAttribute('value', value);
    if (selected) {
      option.setAttribute('selected', selected);
    }
    option.innerHTML = text;
    parent.appendChild(option);
  }

  function addSearchBox(parent) {
    var button = document.createElement('input');
    button.setAttribute('type', 'text');
    button.addEventListener('keyup', function () {
      var value = this.value || '';
      var elements = Array.prototype.slice.apply(document.querySelectorAll('.logger-element'));
      var element, text;
      for (var i = 0, j = elements.length; i < j; i++) {
        element = elements[i];
        text = element.querySelector('div').innerText;
        if (!value || text.indexOf(value) >= 0) {
          element.style.display = 'inline-block';
        } else {
          element.style.display = 'none';
        }
      }
    });
    parent.appendChild(button);
    return button;
  }

  function addSaveCheckbox(parent) {
    var button = document.createElement('input');
    button.setAttribute('type', 'checkbox');
    if (saveToLocalStorage) {
      button.setAttribute('checked', true);
    }
    button.addEventListener('change', function () {
      saveToLocalStorage = !!this.checked;
      ensureLocalStorage();
    });
    var label = document.createElement('label');
    var text = document.createElement('span');
    text.innerHTML = 'save locally';
    label.style = 'display:inline-block;margin-left:10px;';
    label.appendChild(button);
    label.appendChild(text);
    parent.appendChild(label);
    return button;
  }

  function addShowButton(parent) {
    addButton(parent, 'Show Loggers', function () {
      parent.innerHTML = '';
      addLoggerList(parent);
    });
  }

  function createLoggerUI(parent, logger, name) {
    var container = document.createElement('div');
    container.className = 'logger-element';
    var header = document.createElement('div');
    header.style = 'display: block';
    header.innerHTML = name;
    container.appendChild(header);
    container.appendChild(logger);
    parent.appendChild(container);
  }

  function createUI() {
    var parent = document.querySelector('body');
    var container = addContainer(parent);
    addShowButton(container);
  }

  function ensureLocalStorage() {
    if (saveToLocalStorage) {
      var data = {
        loggers: clpp.log.getLoggers(),
        global: clpp.log.getLogLevel(),
        all: ALL
      };
      localStorage.setItem(localStorageKey, JSON.stringify(data));
    } else {
      localStorage.removeItem(localStorageKey);
    }
  }

  function onLoad() {
    if (!window.clpp || !window.clpp.log || !window.clpp.log.getLoggers) {
      return;
    }
    window.clppLoggers = true;
    var data = localStorage.getItem(localStorageKey);
    if (data) {
      saveToLocalStorage = true;
      var dataObj;
      try {
        dataObj = JSON.parse(data);
      }
      catch (e) {
        saveToLocalStorage = false;
        ensureLocalStorage();
      }
      if (dataObj) {
        var savedLoggers = dataObj.loggers || {};
        var keys = Object.keys(savedLoggers);
        keys.forEach(function (key) {
          var value = savedLoggers[key];
          clpp.log.setTagLevel(key, value);
        });
        if (typeof dataObj.global !== 'undefined') {
          clpp.log.setLogLevel(dataObj.global);
        }
        if (typeof dataObj.all !== 'undefined') {
          ALL = dataObj.all;
        }
      }
    }

    createUI();
    addCss();
    window.removeEventListener('load', onLoad);
  }

  if (window.clpp && document.querySelector('body')) {
    onLoad();
  } else {
    window.addEventListener('load', onLoad);
  }
}());
