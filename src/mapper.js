"use strict";

module.exports = ( mapping, logger ) => {
	function mapCardTypeToTaskType( typeId ) {
		for ( const m of mapping.cardTypeMappings ){
			if ( m.cardTypes.includes( typeId ) ) {
				return m.taskTypeId;
			}
		}
		return mapping.defaultTaskType;
	}

	function mapLaneToSection( laneId ) {
		for ( const m of mapping.laneSectionMappings ) {
			if ( m.lanes.includes( laneId ) ) {
				return m.sectionId;
			}
		}
		return null;
	}

	function mapUser( id ) {
		for( const u of mapping.assignedUsers ) {
			if ( u.lkUserId === id ) {
				return u.userId;
			}
		}
	}

	function mapCardToTask( card ) {
		const task = {
			name: card.title,
			externalId: card.customId ? card.customId.value : "",
			url: card.externalLinks.length > 0 ? card.externalLinks[0].url : "",
			notes: card.description ?? "",
			cardId: card.id
		};
		task.taskType = mapCardTypeToTaskType( card.cardType.id );
		task.sectionId = mapLaneToSection( card.laneId );
		task.assignee = card.assignedUsers.length > 0 ? mapUser( card.assignedUsers[0].id ) : null;
		if ( !task.sectionId ) {
			logger.warn( `No mapping found for laneId [${ card.laneId }]` );
			logger.warn( `[${ card.title }] will not be mapped` );
		}
		return task.sectionId ? task : null;
	}

	return {
		mapCardToTask
	};
};

