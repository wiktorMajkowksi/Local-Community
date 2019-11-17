'use strict'

const sqlite = require('sqlite-async')

module.exports = class Tasks {
	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store the user accounts
			const sql = 'CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, issue_type VARCHAR, issue_desc VARCHAR, raised_by VARCHAR, date_set DATE, date_completed DATE, location VARCHAR, status VARCHAR, votes INTEGER);"'
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
	async addIssue(issue_type = 'Vandalism',
		issue_desc = 'There is some grafitti',
		raised_by = 'Fred Cook',
		date_set = undefined,
		date_completed = 'N/A',
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
		date_set = await tasks.getDate()
		const query = await `INSERT INTO tasks(issue_type, issue_desc, raised_by, date_set, date_completed, location, status, votes)VALUES("${issue_type}","${issue_desc}","${raised_by}","${date_set}","${date_completed}","${location}","${status}",${votes});`

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
			'issue_type': 'Vandalism',
			'issue_desc': 'There is some grafitti',
			'date_set': date,
			'date_completed': 'N/A',
			'location': '1 Harper Road',
			'raised_by': 'Fred Cook',
			'status': 'Incomplete',
			'votes': 0
		}]
		return mockIssue
	}


}
