'use strict'

const sqlite = require('sqlite-async')

module.exports = class Tasks {

	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store the user accounts
			const sql = 'CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, issueType VARCHAR, issueDesc VARCHAR, raisedBy VARCHAR, dateSet DATE, dateCompleted DATE, location VARCHAR, status VARCHAR, votes INTEGER);"'
			await this.db.run(sql)
			return this
		})()
	}

	async getDate() {
		const date = new Date()
		const day = date.getDate()
		const month = date.getMonth()
		const year = date.getFullYear()
		const total = `${year}-${month}-${day}`
		return total
	}

	// eslint-disable-next-line max-params
	async addIssue(issueType = 'Vandalism',
		issueDesc = 'There is some grafitti',
		raisedBy = 'Fred Cook',
		dateSet = undefined,
		dateCompleted = 'N/A',
		location = '1 Harper Road',
		status = 'Incomplete',
		votes = 0) {
			for (let i = 0; i < arguments.length; i++) {
			if (arguments[i] === '') {
				console.log(arguments[i])
				return 'not all fields filled out'
			}
		}
		const tasks = await new Tasks()
		dateSet = await tasks.getDate()
		const query = await `INSERT INTO tasks(issueType, issueDesc, raisedBy, dateSet, dateCompleted, location, status, votes)VALUES("${issueType}","${issueDesc}","${raisedBy}","${dateSet}","${dateCompleted}","${location}","${status}",${votes});`
		console.log(query)
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
		const status = 'Completed'
		const sql = `UPDATE tasks SET status = "${status}" WHERE id = ${id};`
		await this.db.run(sql)
		return
	}

	async inProgress(id) {
		const status = 'In Progress'
		const sql = `UPDATE tasks SET status = "${status}" WHERE id = ${id};`
		await this.db.run(sql)
		return
	}

	//just for testing purposes
	async customQuery(sql = 'SELECT * FROM tasks;') {
		const data = await this.db.all(sql)
		return data
	}

	//can be used for testing purposes, expected record after an insert to DB
	//gives the ouput that querying the database would give
	async mockIssue(id = 1) {
		const tasks = await new Tasks()
		const date = await tasks.getDate()
		const mockIssue = [{
			'id': id,
			'issueType': 'Vandalism',
			'issueDesc': 'There is some grafitti',
			'dateSet': date,
			'dateCompleted': 'N/A',
			'location': '1 Harper Road',
			'raisedBy': 'Fred Cook',
			'status': 'Incomplete',
			'votes': 0
		}]
		return mockIssue
	}


}
