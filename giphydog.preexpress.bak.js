let http = require('http'),
	fs = require('fs'),
	giphy = require('giphy-api')(),
	logger = require('./lib/logger'),
	bunyan = require('bunyan'),
	url = require('url'),
	crypto = require('crypto'),
	yaml = require('js-yaml'),
	express = require('express'),
	path = require('path'),
	argv = require('yargs').argv,
	pass = require('stream').PassThrough;

/*
 * BEGIN: Consts
 */

const key = 'I\'ve got the most secure keys out of anyone, believe me';
const port = 8080;
const app = express();


/*
 * END: Consts
 */

/*
 * BEGIN: Configs
 */

const httpAgent = new http.Agent({
	keepAlive: true, 
	maxSockets: 100
});

let globalOptions = {
	hostname: "media3.giphy.com",
	agent: httpAgent
};

if (argv.debug) {
	logger.log.level(bunyan.DEBUG);
} else {
	logger.log.level(bunyan.INFO);
}

/*
 *	END: Configs
 */

let pipeRes = function(externalRes, res, id) {
	logger.log.debug("ClientRequest: response event occurred!");

	let fileSize = 0;
	externalRes.on('data', (chunk) => {
		fileSize += chunk.length;
	});
	externalRes.on('end', () => {
		logger.log.info('File size: %d', fileSize);
	});

	let encrypt = crypto.createCipher('aes-256-ctr', key);

	let a = new pass;
	let b = new pass;


	externalRes.pipe(a);
	externalRes.pipe(b);

	a.pipe(res);
	b.pipe(encrypt).pipe(fs.createWriteStream('./cache/' + id + '.gif.enc', { flags: 'w' }));
};

let imageRequest = function(id, res) {
	let options = {
		hostname: globalOptions.hostname,
		agent: globalOptions.agent,
		path: "/media/" + id + "/giphy.gif"
	};

	logger.log.debug('FS: no file exists; Fetching: %s%s', options.hostname, options.path);

	let externalImage = http.request(options);
	externalImage.on('response', (event) => { pipeRes(event, res, id) });
	externalImage.on('abort', () => { logger.log.debug('ClientRequest: abort event occured!'); });
	externalImage.on('aborted', () => { logger.log.debug('ClientRequest: aborted event occured!'); });
	externalImage.on('connect', (resp, socket, head) => { logger.log.debug('ClientRequest: connect event occured!'); }); 
	externalImage.on('continue',  () => { logger.log.debug('ClientRequest: continue event occured!'); });
	externalImage.on('upgrade', (resp, socket, head) => { logger.log.debug('ClientRequest: upgrade event occured!'); });
	externalImage.on('socket', (soc) => { logger.log.debug('ClientRequest: socket event occured!'); });
	externalImage.end();
};

let handleClientRequest =  function(req, res) {
	logger.log.debug("Server: request event occurred!");

	logger.log.info("Server: received request from the following user agent: %s", req.headers['user-agent']);

	if (url.parse(req.url, true).pathname === '/fetch') {
		logger.log.debug("Requested fetch; Term: %s", argv.term);
		giphy.random({
			tag: argv.term,
			fmt: 'json'
		}, function(err, json) {
			if(err !== null) {
				//TODO: retrieved a random cached file if connectivity error occurs
				//Notes: check for server error vs connectivity error by checking first digit of error codes
				logger.log.error("Giphy error: %s", err);
			} else {
				logger.log.info('Options set. ID: %s', json.data.id);

				let cacheFile = fs.createReadStream('./cache/' + json.data.id + '.gif.enc');
				cacheFile.on('error', (err) => {
					if (err && err.code === 'ENOENT') {
						imageRequest(json.data.id, res);

						fs.writeFile('./cache/' + json.data.id + '.yml', yaml.safeDump(json), (err) => {
							if(err) {
                                logger.log.error('FS: error occurred! \n %s', err.stack);
                            }
						});
					} else {
						logger.log.error('FS: error occurred! \n %s', err.stack);
					}
				});

				//TODO: find a way to stop this trigger when dling it to prevent double pipe
				let decrypt = crypto.createDecipher('aes-256-ctr', key);
				res.writeHead(200, {'Content-Type': 'image/gif' });
				cacheFile.pipe(decrypt).pipe(res);
				logger.log.debug('FS: File exists in cache; piping...');
			}
		});
	} else {
		res.writeHead(200);
		res.end('Connected to HTTP server. Working directory is ' + __dirname);
	}
};

let server = http.createServer().on('request', handleClientRequest);

/*
 *	BEGIN: Server event handlers
 */

server.on('checkContinue', (req, res) => {
	res.writeContinue();
	res.writeHead(100);
	logger.log.debug("Server: checkContinue event occurred!");
});

server.on('checkExpectation', (req, res) => {
	res.writeHead(417);
	res.end('Expectation failed');
	logger.log.debug("Server: checkExpectation event occurred!");
});

server.on('clientError', (e, socket) => {
	socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
	logger.log.error("Server: clientError event occured!");
});

server.on('close', () => { logger.log.debug('Server: close event occurred!'); });

server.on('connect', (req, socket, head) => { logger.log.debug('Server: connect event occurred!'); });

server.on('connection', (socket) => { logger.log.debug('Server: connection event occurred!'); });

server.on('upgrade', (req, socket, head) => { logger.log.debug('Server: upgrade event occurred!'); });

server.on('error', (err) => { logger.log.error('Server: error event occurred!\n %s', err.stack); });

server.on('listening', () => { logger.log.debug('Server listening on port %s', port); });

/*
 *	END: Server event handlers
 */

/*
 * Start listening on port 8080
 */

server.listen(port);
