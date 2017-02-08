require('babel-register');

const http = require('http');

const bunyan = require('bunyan');
const config = require('config');
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

function getHost(req) {
  if (!req.headers['user-agent'].includes('Android') || req.url.startsWith('/api/')) {
    return apiHost;
  }
  return frontendHost;
}

const server = http.createServer((req, res) => (
  proxy.web(req, res, { target: getHost(req), changeOrigin: true, autoRewrite: true })
));

proxy.on('proxyRes', (proxyRes, req) => {
  log.info(`${proxyRes.statusCode} ~> ${getHost(req)}${req.url}`);
});

proxy.on('error', (error, req, res) => {
  log.error(`ERR ~> ${getHost(req)}${req.url} ${error}`);
  res.writeHead(500, { 'Content-type': 'text/plain' });
  res.end('Proxy error');
});

const port = parseInt(config.get('proxyPort', '3333'), 10);
log.info(`🚦 Proxy running at http://localhost:${port}`);
server.listen(port);
