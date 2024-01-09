function determineType(obj) {
  return determineType = typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
    ? function(obj) { return typeof obj; }
    : function(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype
        ? "symbol" : typeof obj;
    }, determineType(obj);
}

function appendQueryStringToURL(url, parameters) {
  if (parameters && determineType(parameters) === 'object') {
    let queryString = '';
    const encode = encodeURIComponent;

    for (const paramName in parameters) {
      queryString += `&${encode(paramName)}=${encode(parameters[paramName])}`;
    }

    if (!queryString) {
      return url;
    }

    url += (url.includes('?') ? '&' : '?') + queryString.slice(1);
  }
  return url;
}

function ajaxRequest(url, options, callback, requestData, useCache) {
  if (requestData && determineType(requestData) === 'object') {
    if (!useCache) {
      requestData['_timestamp'] = new Date().getTime();
    }
    requestData = appendQueryStringToURL('', requestData).slice(1);
  }

  if (options.queryStringParams) {
    url = appendQueryStringToURL(url, options.queryStringParams);
  }

  try {
    let xhr;
    if (XMLHttpRequest) {
      xhr = new XMLHttpRequest();
    } else {
      xhr = new ActiveXObject('MSXML2.XMLHTTP.3.0');
    }

    xhr.open(requestData ? 'POST' : 'GET', url, true);
    if (!options.crossDomain) {
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }
    xhr.withCredentials = !!options.withCredentials;
    if (requestData) {
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }
    if (xhr.overrideMimeType) {
      xhr.overrideMimeType("application/json");
    }

    const customHeaders = options.customHeaders;
    if (customHeaders) {
      for (const header in customHeaders) {
        xhr.setRequestHeader(header, customHeaders[header]);
      }
    }

    xhr.onreadystatechange = function () {
      if (xhr.readyState > 3 && callback) {
        callback(xhr.responseText, xhr);
      }
    };
    xhr.send(requestData);
  } catch (error) {
    console && console.log(error);
  }
}

export default ajaxRequest;
