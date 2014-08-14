/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* globals VBArray, PDFJS */

'use strict';

// Initializing PDFJS global object here, it case if we need to change/disable
// some PDF.js features, e.g. range requests
if (typeof PDFJS === 'undefined') {
  (typeof window !== 'undefined' ? window : this).PDFJS = {};
}

// Checking if the typed arrays are supported
// Support: iOS<6.0 (subarray), IE<10, Android<4.0
(function checkTypedArrayCompatibility() {
  if (typeof Uint8Array !== 'undefined') {
    // Support: iOS<6.0
    if (typeof Uint8Array.prototype.subarray === 'undefined') {
        Uint8Array.prototype.subarray = function subarray(start, end) {
          return new Uint8Array(this.slice(start, end));
        };
        Float32Array.prototype.subarray = function subarray(start, end) {
          return new Float32Array(this.slice(start, end));
        };
    }

    // Support: Android<4.1
    if (typeof Float64Array === 'undefined') {
      window.Float64Array = Float32Array;
    }
    return;
  }

  function subarray(start, end) {
    return new TypedArray(this.slice(start, end));
  }

  function setArrayOffset(array, offset) {
    if (arguments.length < 2) {
      offset = 0;
    }
    for (var i = 0, n = array.length; i < n; ++i, ++offset) {
      this[offset] = array[i] & 0xFF;
    }
  }

  function TypedArray(arg1) {
    var result, i, n;
    if (typeof arg1 === 'number') {
      result = [];
      for (i = 0; i < arg1; ++i) {
        result[i] = 0;
      }
    } else if ('slice' in arg1) {
      result = arg1.slice(0);
    } else {
      result = [];
      for (i = 0, n = arg1.length; i < n; ++i) {
        result[i] = arg1[i];
      }
    }

    result.subarray = subarray;
    result.buffer = result;
    result.byteLength = result.length;
    result.set = setArrayOffset;

    if (typeof arg1 === 'object' && arg1.buffer) {
      result.buffer = arg1.buffer;
    }
    return result;
  }

  window.Uint8Array = TypedArray;
  window.Int8Array = TypedArray;

  // we don't need support for set, byteLength for 32-bit array
  // so we can use the TypedArray as well
  window.Uint32Array = TypedArray;
  window.Int32Array = TypedArray;
  window.Uint16Array = TypedArray;
  window.Int16Array = TypedArray;
  window.Float32Array = TypedArray;
  window.Float64Array = TypedArray;
})();

// URL = URL || webkitURL
// Support: Safari<7, Android 4.2+
(function normalizeURLObject() {
  if (!window.URL) {
    window.URL = window.webkitURL;
  }
})();

// No XMLHttpRequest#response?
// Support: IE<11, Android <4.0
(function checkXMLHttpRequestResponseCompatibility() {
  var xhrPrototype = XMLHttpRequest.prototype;
  var xhr = new XMLHttpRequest();
  if (!('overrideMimeType' in xhr)) {
    // IE10 might have response, but not overrideMimeType
    // Support: IE10
    Object.defineProperty(xhrPrototype, 'overrideMimeType', {
      value: function xmlHttpRequestOverrideMimeType(mimeType) {}
    });
  }
  if ('responseType' in xhr) {
    return;
  }

  // The worker will be using XHR, so we can save time and disable worker.
  PDFJS.disableWorker = true;

  // Support: IE9
  if (typeof VBArray !== 'undefined') {
    Object.defineProperty(xhrPrototype, 'response', {
      get: function xmlHttpRequestResponseGet() {
        if (this.responseType === 'arraybuffer') {
          return new Uint8Array(new VBArray(this.responseBody).toArray());
        } else {
          return this.responseText;
        }
      }
    });
    return;
  }

  // other browsers
  function responseTypeSetter() {
    // will be only called to set "arraybuffer"
    this.overrideMimeType('text/plain; charset=x-user-defined');
  }
  if (typeof xhr.overrideMimeType === 'function') {
    Object.defineProperty(xhrPrototype, 'responseType',
                          { set: responseTypeSetter });
  }
  function responseGetter() {
    var text = this.responseText;
    var i, n = text.length;
    var result = new Uint8Array(n);
    for (i = 0; i < n; ++i) {
      result[i] = text.charCodeAt(i) & 0xFF;
    }
    return result.buffer;
  }
  Object.defineProperty(xhrPrototype, 'response', { get: responseGetter });
})();

// window.btoa (base64 encode function) ?
// Support: IE<10
(function checkWindowBtoaCompatibility() {
  if ('btoa' in window) {
    return;
  }

  var digits =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  window.btoa = function windowBtoa(chars) {
    var buffer = '';
    var i, n;
    for (i = 0, n = chars.length; i < n; i += 3) {
      var b1 = chars.charCodeAt(i) & 0xFF;
      var b2 = chars.charCodeAt(i + 1) & 0xFF;
      var b3 = chars.charCodeAt(i + 2) & 0xFF;
      var d1 = b1 >> 2, d2 = ((b1 & 3) << 4) | (b2 >> 4);
      var d3 = i + 1 < n ? ((b2 & 0xF) << 2) | (b3 >> 6) : 64;
      var d4 = i + 2 < n ? (b3 & 0x3F) : 64;
      buffer += (digits.charAt(d1) + digits.charAt(d2) +
                 digits.charAt(d3) + digits.charAt(d4));
    }
    return buffer;
  };
})();

// window.atob (base64 encode function)?
// Support: IE<10
(function checkWindowAtobCompatibility() {
  if ('atob' in window) {
    return;
  }

  // https://github.com/davidchambers/Base64.js
  var digits =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  window.atob = function (input) {
    input = input.replace(/=+$/, '');
    if (input.length % 4 === 1) {
      throw new Error('bad atob input');
    }
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = '';
      // get next character
      buffer = input.charAt(idx++);
      // character found in table?
      // initialize bit storage and add its ascii value
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = digits.indexOf(buffer);
    }
    return output;
  };
})();

// Function.prototype.bind?
// Support: Android<4.0, iOS<6.0
(function checkFunctionPrototypeBindCompatibility() {
  if (typeof Function.prototype.bind !== 'undefined') {
    return;
  }

  Function.prototype.bind = function functionPrototypeBind(obj) {
    var fn = this, headArgs = Array.prototype.slice.call(arguments, 1);
    var bound = function functionPrototypeBindBound() {
      var args = headArgs.concat(Array.prototype.slice.call(arguments));
      return fn.apply(obj, args);
    };
    return bound;
  };
})();

// Check console compatibility
// In older IE versions the console object is not available
// unless console is open.
// Support: IE<10
(function checkConsoleCompatibility() {
  if (!('console' in window)) {
    window.console = {
      log: function() {},
      error: function() {},
      warn: function() {}
    };
  } else if (!('bind' in console.log)) {
    // native functions in IE9 might not have bind
    console.log = (function(fn) {
      return function(msg) { return fn(msg); };
    })(console.log);
    console.error = (function(fn) {
      return function(msg) { return fn(msg); };
    })(console.error);
    console.warn = (function(fn) {
      return function(msg) { return fn(msg); };
    })(console.warn);
  }
})();


// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
  Object.keys = (function () {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function (obj) {
      if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}
