"use strict";

const { createLogger, format, transports } = require( "winston" );
const { printf } = format;
const chalk = require( "chalk" );

const customFormat = printf( ( { level, message, ...metadata } ) => {
	let msg;
	if ( level.indexOf( "info" ) > -1 || level.indexOf( "debug" ) > -1 ) {
		msg = chalk.dim( `${ message } ` );
	} else  if ( level.indexOf( "warn" ) > -1 ) {
		msg = chalk.bold( `${ message } ` );
	} else {
		msg = `[${ level }] : ${ message } `;
	}
	if( metadata ) {
		const rest = JSON.stringify( metadata );
		if ( rest !== "{}" ){
			msg += chalk.dim( rest );
		}
	}
	return msg;
} );

const logger = createLogger( {
	level: process.env.LOG_LEVEL || "info",
	format: format.json(),
	transports: [
		new transports.Console( {
			format: format.combine(
				format.colorize(),
				format.simple(),
				customFormat
			)
		} )
	],
} );

module.exports = logger;
