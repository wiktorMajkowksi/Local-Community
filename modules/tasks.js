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
		try {
			const date = new Date()
			const day = date.getDate()
			const month = date.getMonth()
			const year = date.getFullYear()
			const total = `${year}-${month}-${day}`
			return total
		} catch(err) {
			throw err
		}
	}
	//takes a body and makes it so add Issue can take it as an argument
	async createIssue(body, cookies) {
		try {
			console.log((await this.getUserCookies(cookies)).user)
			return {'issueType': body.issueType,
				'issueDesc': body.issueDesc,
				'raisedBy': (await this.getUserCookies(cookies)).user,
				'dateSet': await this.getDate(),
				'dateCompleted': 'N/A',
				'location': body.location,
				'status': 'Incomplete',
				'votes': 0}
		} catch (err) {
			throw err
		}
	}

	//takes a request body from the issues page as a parameter
	async addIssue(body, cookies) {
		try {
			const expectedIssueLength = 3
			const issue = await this.createIssue(body, cookies)
			//check that all fields are filled out to ensure the validity of the issue
			const givenFields = [issue.issueType, issue.issueDesc, issue.location]
			for (let i = 0; i < expectedIssueLength; i++) {
				if (givenFields[i] === '' || givenFields[i] === undefined) {
					throw new Error('One or more fields were not filled in')
				}
			}
			const sql = await `INSERT INTO tasks(
				issueType, issueDesc, raisedBy, dateSet, dateCompleted, location, status, votes)
				VALUES ("${issue.issueType}", "${issue.issueDesc}", "${issue.raisedBy}", "${issue.dateSet}", "${issue.dateCompleted}", "${issue.location}", "${issue.status}", ${issue.votes});`
			await this.db.run(sql)
       		return
		} catch(err) {
    		throw err
		}
	}

	async getAll() {
		try{
			const query = 'SELECT * FROM tasks'
			const data = await this.db.all(query)
			return data
		} catch (err) {
			throw err
		}
	}

	async getIssue(id = undefined) {
		try {
			if (id !== undefined) {
				let data = this.db.get(`SELECT * from tasks WHERE id = ${id};`)
				return data
			} else throw new Error("Issue not supplied")
		} catch(err){
			throw err
		}
	}

	async upvote(id, cookies) {
		try {
			//if they upvoted recently it will fail and throw an error
			//console.log(errorCheck)

			await this.checkIfUpvotedRecently(id, cookies)
			console.log('after 85')
			//if (errorCheck) {
			//	console.log('errorcheck is in')
			//	throw new Error('Error in checkIfUpVotedRecently')
			//}
			console.log('gonna upvote')
			const sql = `UPDATE tasks SET votes = votes + 1 WHERE id = ${id}`
			await this.db.run(sql)
			return
		} catch (err) {
			throw err
		}
	}

	async checkIfUpvotedRecently(id, cookies) {
		try {
			//console.log(await this.getUserCookies(cookies))
			if (await cookies.get(id) === 'upvoted') {
				throw new Error('Please wait up to 5 minutes before upvoting this issue again')
			} else {
				return
			}
		} catch (err) {
			throw err
		}
	}

	async changeStatus(id, status) {
		try {
			console.log('in changeStatus')
			let sql = `UPDATE tasks SET status = "${status}" WHERE id = ${id};`
			if (status === 'Completed') {
				const date = await this.getDate()
				await this.db.run(sql)
				sql = `UPDATE tasks SET dateCompleted = "${date}" WHERE id = ${id};`
				await this.db.run(sql)
			} else {
				await this.db.run(sql)
			}
			return
		} catch(err) {
			throw err
		}
	}

	async getUserCookies(cookies) {
		/*the only cookies that are ever set are
		'user' - the username of the user logged in
		'accessLevel - whether the user that is logged in is a staff member or regular user
		'upvoted' where the key will be the ID of the issue they upvoted within the last 5 minutes

		this function will only return the uer and accessLevel
		*/
		try {
			const user = await cookies.get('user')
			const accessLevel = await cookies.get('accessLevel')
			const all = await {'user': user, 'accessLevel': accessLevel}
			console.log(all)
			return all
		} catch (err) {
			throw err
		}

	}


	////just for testing purposes
	async customQuery(sql = 'SELECT * FROM tasks;') {
		const data = await this.db.all(sql)
		return data
	}
	//just for testing
	async mockIssue(id = 1) {
		const mockIssue = {
			id: id,
			issueType: 'issueType',
			issueDesc: 'description',
			raisedBy: 'fred',
			dateSet: '2019-10-18',
			dateCompleted: 'N/A',
			location: 'location',
			status: 'Incomplete',
			votes: 0
		  }
		return mockIssue
	}
}
