# LeanKit to Asana Migration and Sync Tool

I wrote this CLI app to assist in migrating a LeanKit board to an Asana project. I'm sharing this code as open source in case someone else might find it useful. To make this project work for your use case may involve adding some additional fields to Asana or customizing the code.

## Requirements

* Node.js 14+
* LeanKit Board
* Asana Project
* [Asana personal access token](https://developers.asana.com/docs/personal-access-token)
* Fields in Asana to store the following types of data (this fields can be hidden in the Asana UI in case you don't want them visible to users):
  * Task Type (maps to LeanKit Card Type)
  * URL (maps to LeanKit External Link)
  * External ID (maps to LeanKit Header, which can be used as an external ID)
  * LeanKit ID (maps to LeanKit Card ID)
* A mapping file that maps LeanKit users, card types, and lanes to Asana assignees, task types, and sections

## Setup

1. Clone or download this repository
1. Run `npm install` to install dependencies
1. Copy `.env.sample` to `.env` and update with your environment settings
1. Copy `mapping.sample.json` to `mapping.json` and update with your LeanKit to Asana IDs

## Utilities

The CLI app comes with a number of commands to assist in building the mapping file, testing, and other discovery.

|Command|Description|
|:---|:---|
|`node . info -b`|Retrieve LeanKit board IDs (users, lanes, card types)|
|`node . info -p`|Retrieve Asana project IDs (users, sections, custom fields)|
|`node . info -t`|List all tasks in the Asana project|
|`node . info --task-leankit-id <id>`|Get an Asana task by LeanKit card ID|
|`node . info --delete-tasks`|DELETES ALL TASKS in the Asana project. In case you need to blow everything away and start a new sync. Yes, this will delete everything!|

## Migrate and Sync

Test a migration (does not create tasks in Asana):

```sh
node . sync ./mapping.json --test
```

Test a migration and store the mapped tasks as a JSON file:

```sh
node . sync ./mapping.json --test --file ./sync-test.json
```

Migrate or sync LeanKit cards to Asana project and store mapped tasks in a file.

```sh
node . sync ./mapping.json --file ./sync.json
```
