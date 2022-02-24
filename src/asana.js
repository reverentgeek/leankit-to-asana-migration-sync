"use strict";
const axios = require( "axios" );

module.exports = ( logger ) => {
	const {
		ASANA_PAT: asanaToken,
		ASANA_WORKSPACE: workspaceId,
		ASANA_PROJECT: projectId,
		ASANA_CUSTOM_FIELD_LEANKIT_ID: leankitFieldId,
		ASANA_CUSTOM_FIELD_EXTERNAL_ID: externalFieldId,
		ASANA_CUSTOM_FIELD_URL_ID: urlId,
		ASANA_CUSTOM_FIELD_TASK_TYPE_ID: taskTypeId,

	} = process.env;

	async function getProjectSections() {
		try {
			const config = {
				method: "get",
				url: `https://app.asana.com/api/1.0/projects/${ projectId }/sections`,
				headers: {
					Authorization: `Bearer ${ asanaToken }`
				}
			};
			logger.info( "getting project sections..." );
			const res = await axios( config );
			const sections = res.data.data.map( s => {
				return {
					gid: s.gid,
					name: s.name
				};
			} );
			return sections;
		} catch( err ) {
			logger.error( err );
			return null;
		}
	}

	async function getProject() {
		try {
			const config = {
				method: "get",
				url: `https://app.asana.com/api/1.0/projects/${ projectId }`,
				headers: {
					Authorization: `Bearer ${ asanaToken }`
				}
			};
			logger.info( "getting project info..." );
			const res = await axios( config );
			const p = res.data.data;
			const project = {
				gid: p.gid,
				name: p.name,
				followers: p.followers,
				customFields: p.custom_field_settings.map( cf => {
					return {
						gid: cf.custom_field.gid,
						name: cf.custom_field.name,
						type: cf.custom_field.type,
						options: cf.custom_field.enum_options ? cf.custom_field.enum_options.map( o => {
							return {
								gid: o.gid,
								name: o.name
							};
						} ) : []
					};
				} )
			};
			project.sections = await getProjectSections();
			return project;
		} catch( err ) {
			logger.error( err );
			return null;
		}
	}

	async function getTasksByProject() {
		try {
			const config = {
				method: "get",
				url: `https://app.asana.com/api/1.0/projects/${ projectId }/tasks`,
				headers: {
					Authorization: `Bearer ${ asanaToken }`
				}
			};
			logger.info( "getting tasks for project..." );
			const res = await axios( config );
			const tasks = res.data.data;
			return tasks;
		} catch( err ) {
			logger.error( err );
			return null;
		}
	}

	async function moveTaskToSection( sectionId, taskId ) {
		try {
			const config = {
				method: "post",
				url: `https://app.asana.com/api/1.0/sections/${ sectionId }/addTask`,
				headers: {
					Authorization: `Bearer ${ asanaToken }`
				},
				data: {
					data: {
						task: taskId
					}
				}
			};

			const res = await axios( config );
			return res.data;

		} catch ( err ) {
			logger.error( err );
			return null;
		}
	}

	async function deleteTask( taskId ) {
		try {
			const config = {
				method: "delete",
				url: `https://app.asana.com/api/1.0/tasks/${ taskId }`,
				headers: {
					Authorization: `Bearer ${ asanaToken }`
				}
			};

			logger.info( `Deleting task [${ taskId }]` );
			const res = await axios( config );
			return res.data;

		} catch ( err ) {
			logger.error( err );
			return "Error: " + err.message;
		}
	}

	async function getTaskByLeanKitId( id ) {
		try {
			const config = {
				method: "get",
				url: `https://app.asana.com/api/1.0/workspaces/${ workspaceId }/tasks/search?project.all=${ projectId }&custom_fields.${ leankitFieldId }.value=${ id }`,
				headers: {
					Authorization: `Bearer ${ asanaToken }`
				}
			};
			const tasks = await axios( config );
			if ( !tasks.data.data.length ) {
				return null;
			}
			const taskId = tasks.data.data[0].gid;
			config.url = `https://app.asana.com/api/1.0/tasks/${ taskId }`;
			const res = await axios( config );
			const task = res.data.data;
			const { gid, name } = task;

			return {
				gid,
				name,
				section: task.memberships[0].section
			};
		} catch( err ) {
			logger.error( err );
			return null;
		}
	}

	async function createTask( { name, externalId, url, taskType, assignee, cardId, notes = "" } ) {
		try {
			const config = {
				method: "post",
				url: "https://app.asana.com/api/1.0/tasks",
				headers: {
					Authorization: `Bearer ${ asanaToken }`
				},
				data: {
					data: {
						name,
						notes,
						assignee,
						workspace: workspaceId,
						projects: [ projectId ],
						custom_fields: { }
					}
				}
			};

			config.data.data.custom_fields[`${ externalFieldId }`] = externalId;
			config.data.data.custom_fields[`${ urlId }`] = url;
			config.data.data.custom_fields[`${ taskTypeId }`] = taskType;
			config.data.data.custom_fields[`${ leankitFieldId }`] = cardId;

			logger.info( `Creating task [${ name }]` );
			const res = await axios( config );
			return res.data;

		} catch ( err ) {
			logger.error( err );
			return "Error: " + err.message;
		}
	}

	async function updateTask( id, { name, externalId, url, taskType, assignee, cardId, notes = "" } ) {
		try {
			const config = {
				method: "put",
				url: `https://app.asana.com/api/1.0/tasks/${ id }`,
				headers: {
					Authorization: `Bearer ${ asanaToken }`
				},
				data: {
					data: {
						name,
						notes,
						assignee,
						custom_fields: { }
					}
				}
			};

			config.data.data.custom_fields[`${ externalFieldId }`] = externalId;
			config.data.data.custom_fields[`${ urlId }`] = url;
			config.data.data.custom_fields[`${ taskTypeId }`] = taskType;
			config.data.data.custom_fields[`${ leankitFieldId }`] = cardId;

			logger.info( `Updating task [${ name }]` );
			const res = await axios( config );
			return res.data;

		} catch ( err ) {
			logger.error( err );
			return "Error: " + err.message;
		}
	}

	return {
		createTask,
		updateTask,
		getProject,
		moveTaskToSection,
		deleteTask,
		getTasksByProject,
		getTaskByLeanKitId
	};
};

