const http = require('http');
const url = require('url');

module.exports = class Server {
    constructor(logger, request, proxyProvider, proxyRotator, options) {
        this._logger = logger;
        this._proxyProvider = proxyProvider;
        this._proxyRotator = proxyRotator;
        this._request = request.request;

        const initInterval = setInterval(() => {
            if (this._proxyProvider.inited && this._proxyRotator) {
                clearInterval(initInterval);
                http.createServer(this._onRequest.bind(this)).listen(options.port);
                this._logger.info(`Server started on port ${options.port}`);
            }
        }, 100);
    }

    _onRequest(req, res) {
        this._logger.info(`Request for proxy`);

        const proxyData = this._proxyRotator.proxy;

        this._logger.info(`Request matched with proxy ${proxyData.url}`);

        this._request({url: url.parse(req.url, true).query.url || req.url, proxy: proxyData.url, method: 'GET'})
            .on('error', () => {
                this._proxyProvider.invalidate(proxyData);
            })
            .pipe(res);
    }
};