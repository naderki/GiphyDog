let bunyan = require('bunyan');

/*
 * Logger config
 */
exports.log = bunyan.createLogger({
	name: "GiphyDog",
	streams: [
		{
			level: 'info',
			path: __dirname + '/../logs/giphydog_fetchlog.txt',
			timestamp: true
		},
		{
			level: 'error',
			path: __dirname + '/../logs/giphydog_errorlog.txt'
		},
		{
			level: 'debug',
			stream: process.stdout
		}
	]
});