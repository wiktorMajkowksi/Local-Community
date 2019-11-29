'use strict'

const sqlite = require('sqlite-async')

module.exports = class Tasks {
	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store the user accounts
			const sql = `CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, 
						 issueType VARCHAR, issueDesc VARCHAR, raisedBy VARCHAR, dateSet DATE, dateCompleted DATE, 
						 location VARCHAR, status VARCHAR, votes INTEGER, priority VARCHAR);`
			await this.db.run(sql)
			return this
		})()
	}
	async filterIssueType(issueType) {
		try{
			const data = await this.db.all(`SELECT *, COUNT(*) FROM tasks WHERE issueType == "${issueType}";`)
			return data
		} catch(err) {
			throw err
		}
	}

	async filterstatus(status) {
		try{
			if (status !== undefined){
				const data = await this.db.all(`SELECT * FROM tasks WHERE status = "${status}";`)
					return data	
			}	
			else throw new Error('status not supplied')

		}  catch(err){
			throw err
		}
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
			return {'issueType': body.issueType,
				'issueDesc': body.issueDesc,
				'raisedBy': (await this.getUserCookies(cookies)).user,
				'dateSet': await this.getDate(),
				'dateCompleted': 'N/A',
				'location': body.location,
				'status': 'Incomplete',
				'votes': 0,
				'priority': 'Low'}
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
				issueType, issueDesc, raisedBy, dateSet, dateCompleted, location, status, votes, priority) VALUES 
				("${issue.issueType}", "${issue.issueDesc}", "${issue.raisedBy}","${issue.dateSet}", 
				"${issue.dateCompleted}", "${issue.location}","${issue.status}", ${issue.votes}, "${issue.priority}");`
			await this.db.run(sql)
       		return
		} catch(err) {
    		throw err
		}
	}

	async changePriority(id, priority) {
		try{
			const sql = `UPDATE tasks SET priority = "${priority}" WHERE id = ${id};`
			await this.db.run(sql)
			return
		} catch (err) {
			throw err
		}
	}

	async getDateDifference(id) {
		//Dates go year-month-day
		const issue = (await this.customQuery(`SELECT * FROM tasks WHERE id = ${id};`))[0]
		let dateSet = issue.dateSet
		let dateResolved = 0
		if (issue.dateCompleted === 'N/A') {
			dateResolved = await this.getDate()
		} else {
			dateResolved = issue.dateCompleted
		}
		dateSet = Date.parse(dateSet)
		dateResolved = Date.parse(dateResolved)
		let difference = dateResolved - dateSet

		//number of milliseconds in a day = 86400000
		const msInDay = 86400000
		difference = Math.floor(difference / msInDay)

		return difference
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

	async getIssue(id) {
		try {
			if (id !== undefined) {
				const data = this.db.get(`SELECT * from tasks WHERE id = ${id};`)
				return data
			} else throw new Error('Issue not supplied')
		} catch(err) {
			throw err
		}
	}

	async upvote(id, cookies) {
		try {
			//if they upvoted recently it will fail and throw an error

			await this.checkIfUpvotedRecently(id, cookies)
			const sql = `UPDATE tasks SET votes = votes + 1 WHERE id = ${id}`
			await this.db.run(sql)
			return
		} catch (err) {
			throw err
		}
	}

	async checkIfUpvotedRecently(id, cookies) {
		try {
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
			let sql = `UPDATE tasks SET status = "${status}" WHERE id = ${id};`
			if (status === 'Complete') {
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
			return all
		} catch (err) {
			throw err
		}

	}

	async getPostcodes() {
		try {
			this.db = await sqlite.open('postcodes.db')
			const postcodes = await this.db.all('SELECT postcode FROM ward_postcodes;')
			return postcodes

		}catch (err) {
			throw err
		}
	}

	async encodeLocation(location) {
		let encoded = ''
		for (let i = 0; i < location.length; i++) {
			if (location[i] !== ' ') {
				encoded += location[i]
			} else {
				encoded += '+'
			}
		}
		return encoded
	}


	////just for testing purposes
	async customQuery(sql = 'SELECT * FROM tasks;') {
		try {
			const data = await this.db.all(sql)
			return data
		} catch(err) {
			throw err
		}
	}

	//just for testing
	async mockIssue(id = 1) {
		const mockIssue = {
			id: id,
			issueType: 'issueType',
			issueDesc: 'description',
			raisedBy: 'fred',
			dateSet: await this.getDate(),
			dateCompleted: 'N/A',
			location: 'location',
			status: 'Incomplete',
			votes: 0,
			priority: 'Low'
		  }
		return mockIssue
	}
	//just for testing
	async mockIssue2(id = 3) {
		const mockIssue = {
			id: id,
			issueType: 'Litter',
			issueDesc: 'description',
			raisedBy: 'adam',
			dateSet: await this.getDate(),
			dateCompleted: 'N/A',
			location: 'location',
			status: 'Incomplete',
			votes: 0,
			priority: 'Low'
		  }
		return mockIssue
	}
	//just for testing
	async mockIssue3(id = 4) {
		const mockIssue = {
			id: id,
			issueType: 'Litter',
			issueDesc: 'description',
			raisedBy: 'adam',
			dateSet: await this.getDate(),
			dateCompleted: 'N/A',
			location: 'location',
			status: 'Incomplete',
			votes: 0,
			priority: 'Low'
		  }
		return mockIssue
	}
	//just for testing
	async mockIssue4(id = 5) {
		const mockIssue = {
			id: id,
			issueType: 'Potholes',
			issueDesc: 'description',
			raisedBy: 'adam',
			dateSet: await this.getDate(),
			dateCompleted: 'N/A',
			location: 'location',
			status: 'Incomplete',
			votes: 0,
			priority: 'Low'
		  }
		return mockIssue
	}
}
