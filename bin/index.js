#!/usr/bin/env node
"use strict";

const path = require( "path" );
require( "dotenv" ).config( { path: path.join( __dirname, "..", ".env" ) } );
const fs = require( "fs-extra" );
const logger = require( "../src/logger" );
const pkg = require( "../package.json" );
const leankit = require( "../src/leankit" )( logger );
const asana = require( "../src/asana" )( logger );
const mapperClient = require( "../src/mapper" );
const { Command } = require( "commander" );
const program = new Command();

program
	.version( pkg.version )
	.description( "A tool synchronizing LeanKit to Asana" );

program
	.command( "info" )
	.description( "Get information from LeanKit and Asana" )
	.option( "-b, --board", "Get leankit board information" )
	.option( "-p, --project", "Get Asana project information" )
	.option( "-t, --tasks", "Get tasks for Asana project" )
	.option( "-d, --delete-tasks", "Delete all Asana project tasks" )
	.option( "--task-leankit-id <id>", "Get task by LeanKit id" )
	.option( "-f, --file <filename>", "Store results in the specified file" )
	.action( async ( { board, project, tasks, file, deleteTasks, taskLeankitId } ) => {
		if ( board ) {
			const res = await leankit.getBoard();
			if ( file ) {
				await fs.writeJSON( file, res, { spaces: 2 } );
			} else {
				console.log( res );
			}
			return;
		} else if ( project ) {
			const res = await asana.getProject();
			if ( file ) {
				await fs.writeJSON( file, res, { spaces: 2 } );
			} else {
				console.log( res );
			}
			return;
		} else if ( tasks ) {
			const res = await asana.getTasksByProject();
			if ( file ) {
				await fs.writeJSON( file, res, { spaces: 2 } );
			} else {
				console.log( res );
			}
			return;
		} else if ( deleteTasks ) {
			const tasks = await asana.getTasksByProject();
			for( const task of tasks ) {
				await asana.deleteTask( task.gid );
			}
		} else if ( taskLeankitId ) {
			const task = await asana.getTaskByLeanKitId( taskLeankitId );
			console.log( task );
		}
	} );
program
	.command( "sync <mapping>" )
	.description( "Sync all active cards to Asana using mapping file" )
	.option( "-t, --test", "Test sync" )
	.option( "-f, --file <output-file>", "Store results in output file" )
	.action( async ( mapping, { test, file }, options ) => {
		const mappings = await fs.readJson( mapping );
		const mapper = await mapperClient( mappings, logger );
		logger.debug( "options:", options );
		logger.info( "synchronizing all cards..." );
		const res = await leankit.getCards();

		// Filter out excluded card types
		const cards = res.cards.filter( card => !mappings.excludeCardTypes.includes( card.cardType.id ) );

		const tasks = cards.map( card => mapper.mapCardToTask( card ) );
		if ( !test ) {
			for( const t of tasks ) {
				const task = await asana.getTaskByLeanKitId( t.cardId );
				if ( !task ) {
					const res = await asana.createTask( t );
					t.gid = res.data.gid;
					await asana.moveTaskToSection( t.sectionId, t.gid );
				} else {
					logger.info( `Task already exists [${ task.name }]` );
					t.gid = task.gid;
					if ( task.section.gid !== t.sectionId ) {
						logger.info( `Moving task [${ task.name }]` );
						await asana.moveTaskToSection( t.sectionId, t.gid );
					}
				}
			}
		}

		if ( file ) {
			await fs.writeJson( file, { cards, tasks }, { spaces: 2 } );
		}
		logger.info( "finished" );
	} );

program.parse( process.argv );
