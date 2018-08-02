require('babel-register');

const fs = require('fs');
const http = require('http');
const path = require('path');

const config = require('config');
const cookie = require('cookie');
const httpProxy = require('http-proxy');
const pino = require('pino');

const log = pino({
  name: `${config.get('appName')}.proxy`,
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
  const useDesktop = req.headers.cookie && cookie.parse(req.headers.cookie).mamo === 'off';
  if (useDesktop || req.url.startsWith('/api/')) {
    return apiHost;
  }
  return frontendHost;
}

const server = http.createServer((req, res) => {
  const host = getHost(req);
  return proxy.web(req, res, {
    target: host,
    changeOrigin: true,
    autoRewrite: true,
    protocolRewrite: 'http',
    cookieDomainRewrite: '',
  });
});

proxy.on('proxyRes', (proxyRes, req, res) => {
  log.info(`${proxyRes.statusCode} ~> ${getHost(req)}${req.url}`);
  unsecureCookie(req, res, proxyRes);
});

proxy.on('error', (error, req, res) => {
  const htmlFile = fs.readFileSync(
    path.join(__dirname, 'loading-page.html'), 'utf8');

  log.error(`ERR ~> ${getHost(req)}${req.url} ${error}`);
  res.writeHead(500, { 'Content-type': 'text/html' });
  res.end(htmlFile);
});

const port = parseInt(config.get('proxyPort', '3333'), 10);
log.info(`🚦 Proxy running at http://localhost:${port}`);
server.listen(port);
