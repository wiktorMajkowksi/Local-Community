'use strict'

const sqlite = require('sqlite-async')

module.exports = class Tasks {

	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store the user accounts
			const sql = 'CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, issueType VARCHAR, raisedBy VARCHAR, dateSet DATE, location VARCHAR, status VARCHAR);"'
			await this.db.run(sql)
			return this
		})()
	}

	// eslint-disable-next-line max-params
	async addIssue(issueType = 'Vandalism',
		raisedBy = 'Fred Cook',
		dateSet= '2000-01-01',
		location = '1 Harper Road',
		status = 'Incomplete') {
		const query = await `INSERT INTO tasks(issueType, raisedBy, dateSet, location, status)VALUES("${issueType}","${raisedBy}","${dateSet}","${location}","${status}");`
		await this.db.run(query)
		return
	}

	async getAll() {
		const query = 'SELECT * FROM tasks'
		const data = await this.db.all(query)

		return data
	}

	async getDateString() {
		const datetime = new Date()
		const year = datetime.getFullYear()
		const month = datetime.getMonth()
		const day = datetime.getDate()
		const dateString = `"${year}-${month}-${day}"`
		return dateString

	}

	async complete(id) {
		expect.assertions(1)
		const tasks = await new tasks()

		//const query =
	}

	//can be used for testing purposes, expected record after an insert to DB
	//gives the ouput that querying the database would give
	async mockIssue(id = 1) {
		const mockIssue = [{'dateSet': '2000-01-01',
			'id': id,
			'issueType': 'Vandalism',
			'location': '1 Harper Road',
			'raisedBy': 'Fred Cook',
			'status': 'Incomplete'}]
		return mockIssue
	}
}
