/*eslint-disable no-unused-vars*/
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
 * BEGIN: Vars
 */

let term = argv.term;
const key = '    ----' +
    '          /  __  \\' +
    '         |  /  \\  |' +
    '        /  /    \\ \\' +
    '       |  |     |  -------------------------------------------------' +
    '       |  |     |  ------------------------------------            )' +
    '       \\  \\   /  /                                   |           |' +
    '         |  \\_/  |                                    |    _      |' +
    '          \\     /                                     |  _| |  _  |' +
    '            ----                                       | |   | | | |' +
    '                                                       |_|   |_| |_|';
const port = 8080;
const app = express();

/*
 * END: Vars
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
	externalImage.on('abort', () => { logger.log.debug('ClientRequest: abort event occurred!'); });
	externalImage.on('aborted', () => { logger.log.debug('ClientRequest: aborted event occurred!'); });
	externalImage.on('connect', (resp, socket, head) => { logger.log.debug('ClientRequest: connect event occurred!'); });
	externalImage.on('continue',  () => { logger.log.debug('ClientRequest: continue event occurred!'); });
	externalImage.on('upgrade', (resp, socket, head) => { logger.log.debug('ClientRequest: upgrade event occurred!'); });
	externalImage.on('socket', (soc) => { logger.log.debug('ClientRequest: socket event occurred!'); });
	externalImage.end();
};

let fetch = function(req, res) {
    logger.log.debug("Requested fetch; Term: %s", term);
    giphy.random({
        tag: term,
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

            let decrypt = crypto.createDecipher('aes-256-ctr', key);
            //res.writeHead(200, {'Content-Type': 'image/gif' });
            res.writeHead(200, {
                'Content-Type': 'image/gif',
                'Cache-Control': 'no-cache'
            });

            cacheFile.pipe(decrypt).pipe(res);

            logger.log.debug('FS: File exists in cache; piping...');
        }
    });
};

app.get('/fetch', fetch);

/*app.get('/', function(req, res) {
	res.sendFile(__dirname + '/web/index.html');
    //res.writeHead(200);
    //res.end('Connected to HTTP server. Working directory is ' + __dirname);
	}
);*/

app.use(express.static(__dirname + '/web'));

app.get('/api/fetch', (req, res) => {
	term = req.query.term;
	fetch(req, res);
});

app.use("/css", express.static(__dirname + '/web/css'));

/*
 *	BEGIN: Server event handlers
 */

app.on('checkContinue', (req, res) => {
	res.writeContinue();
	res.writeHead(100);
	logger.log.debug("Server: checkContinue event occurred!");
});

app.on('checkExpectation', (req, res) => {
	res.writeHead(417);
	res.end('Expectation failed');
	logger.log.debug("Server: checkExpectation event occurred!");
});

app.on('clientError', (e, socket) => {
	socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
	logger.log.error("Server: clientError event occured!");
});

app.on('close', () => { logger.log.debug('Server: close event occurred!'); });

app.on('connect', (req, socket, head) => { logger.log.debug('Server: connect event occurred!'); });

app.on('connection', (socket) => { logger.log.debug('Server: connection event occurred!'); });

app.on('upgrade', (req, socket, head) => { logger.log.debug('Server: upgrade event occurred!'); });

app.on('error', (err) => { logger.log.error('Server: error event occurred!\n %s', err.stack); });

/*
 *	END: Server event handlers
 */

/*
 * Start listening on port 8080
 */

app.listen(port);

logger.log.debug('Server listening on port %s', port);

