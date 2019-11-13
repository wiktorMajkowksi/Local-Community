'use strict'

const sqlite = require('sqlite-async')

module.exports = class tasks {

	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store the user accounts
			const sql = 'CREATE TABLE IF NOT EXISTS tasks ( id INTEGER PRIMARY KEY, issueType VARCHAR,	raisedBy  VARCHAR,	dateSet   DATE,	location  VARCHAR,	status );"'
			await this.db.run(sql)
			return this
		})()
	}

	// eslint-disable-next-line max-params
	async addIssue(id = 1, issueType = 'Vandalism', raisedBy = 'Fred Cook', dateSet= '2000-01-01', location = '1 Harper Road', status = 'Incomplete') {
		const query = await `INSERT INTO tasks(id, issueType, raisedBy, dateSet, location, status)VALUES(${id},"${issueType}","${raisedBy}","${dateSet}","${location}","${status}");`
		await this.db.run(query)
		return
	}

	async getAll() {
		const query = 'SELECT * FROM tasks'
		const data = await this.db.all(query)
		console.log(data)
		return data
	}

	/* TO STILL WRITE
	complete()
	*/
}
