require('babel-register');

const http = require('http');
const url = require('url');

const bunyan = require('bunyan');
const config = require('config');
const cookie = require('cookie');
const httpProxy = require('http-proxy');

const log = bunyan.createLogger({
  name: 'proxy',
  app: config.get('appName'),
  serializers: bunyan.stdSerializers,
});

const proxy = httpProxy.createProxyServer();
const apiHost = config.get('proxyApiHost', null) || config.get('apiHost');
const frontendHost = `http://${config.get('serverHost')}:${config.get('serverPort')}`;

log.info(`apiHost: ${apiHost}`);
log.info(`frontendHost: ${frontendHost}`);

const array = (value) => {
  if (!value) {
    return [];
  } else if (Array.isArray(value)) {
    return value;
  }
  return [value];
};

function unsecureCookie(req, res, proxyRes) {
  const proxyCookies = array(proxyRes.headers['set-cookie']);
  // eslint-disable-next-line no-param-reassign
  proxyRes.headers['set-cookie'] = proxyCookies.map((rewrittenCookie) => {
    if (!req.connection.encrypted) {
      return rewrittenCookie.replace(/;\s*?(Secure)/i, '');
    }
    return rewrittenCookie;
  });
}

function getHost(req) {
  const useDesktop = cookie.parse(req.headers.cookie).mamo === 'off';
  if (useDesktop || req.url.startsWith('/api/')) {
    return apiHost;
  }
  return frontendHost;
}

const server = http.createServer((req, res) => {
  const host = getHost(req);
  const hostUrl = url.parse(host);
  return proxy.web(req, res, {
    target: host,
    changeOrigin: true,
    autoRewrite: true,
    hostRewrite: hostUrl.host,
    protocolRewrite: 'http',
    cookieDomainRewrite: '',
  });
});

proxy.on('proxyRes', (proxyRes, req, res) => {
  log.info(`${proxyRes.statusCode} ~> ${getHost(req)}${req.url}`);
  unsecureCookie(req, res, proxyRes);
});

proxy.on('error', (error, req, res) => {
  log.error(`ERR ~> ${getHost(req)}${req.url} ${error}`);
  res.writeHead(500, { 'Content-type': 'text/plain' });
  res.end('Proxy error');
});

const port = parseInt(config.get('proxyPort', '3333'), 10);
log.info(`🚦 Proxy running at http://localhost:${port}`);
server.listen(port);
