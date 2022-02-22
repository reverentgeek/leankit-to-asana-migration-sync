"use strict";
const axios = require( "axios" );

module.exports = ( logger ) => {
	const {
		LK_HOST: host,
		LK_USERNAME: username,
		LK_PASSWORD: password,
		LK_BOARD_ID: boardId
	} = process.env;

	const getBoard = async () => {
		try {

			const config = {
				method: "get",
				url: `https://${ host }.leankit.com/io/board/${ boardId }`,
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json"
				},
				auth: {
					username, password
				}
			};
			logger.info( "getting board info..." );
			const res = await axios( config );
			const b = res.data;
			const board = {
				cardTypes: b.cardTypes.map( c => { return { id: c.id, name: c.name }; } ),
				lanes: b.lanes.map( c => { return { id: c.id, name: c.name, cardCount: c.cardCount }; } ),
				users: b.users.map( u => { return { id: u.id, name: u.fullName }; } )
			};
			return board;

		} catch ( err ) {
			logger.error( err );
			return null;
		}
	};

	const getCards = async () => {
		try {

			const config = {
				method: "get",
				url: `https://${ host }.leankit.com/io/board/${ boardId }/card?offset=0&limit=200`,
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json"
				},
				auth: {
					username, password
				}
			};
			logger.info( "getting cards..." );
			const res = await axios( config );
			return res.data;

		} catch ( err ) {
			logger.error( err );
			return [];
		}
	};

	return {
		getBoard,
		getCards
	};
};

