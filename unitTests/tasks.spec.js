'use strict'

const Tasks = require('../modules/tasks.js')

expect.extend({
	toContainObject(received, argument) {
		const pass = this.equals(received,
			expect.arrayContaining([
				expect.objectContaining(argument)
			])
		)
		if (pass) {
			return {
				message: () => `expected ${this.utils.printReceived(received)} 
				not to contain object ${this.utils.printExpected(argument)}`,
				pass: true
			}
		} else {
			return {
				message: () => `expected ${this.utils.printReceived(received)} 
				to contain object ${this.utils.printExpected(argument)}`,
				pass: false
			}
		}
	}
})

/*This custom matcher was created by andreipfeiffer
it can be viewed at:
https://gist.github.com/andreipfeiffer/bc38ee6387e8cfe6f1a87e8a01d02a13#file-jest-tocontainobject-js

*/

let cookies = {accessLevel: 'staff', user: 'fred', 1: 'upvoted'}

//when running tests because we dont have access to 'ctx' it means cookies we pass into function
//dont have the 'get' method so here we prototype it to give the behaviour the standard application has
Object.prototype.get = function(givenKey) {
	return cookies[givenKey]
}
describe('addIssue()', () => {
	test('single addIssue works correctly', async done => {
		//ARRANGE
		expect.assertions(2)
		const tasks = await new Tasks()
		//ACT


		const body = await tasks.mockIssue()
		await tasks.addIssue(body, cookies)
		const results = await tasks.getAll()
		const resultsLength = results.length
		//ASSERT
		expect(results[0]).toEqual(body)
		expect(resultsLength).toEqual(1)
		done()
	})

	test('test multiple addIssue results in correct / unique IDs (autoincrement)', async done => {
		//ARRANGE
		expect.assertions(2)
		const tasks = await new Tasks
		//ACT
		await tasks.addIssue(await tasks.mockIssue(), cookies)
		await tasks.addIssue({issueType: 'issueType',
			issueDesc: 'description',
			raisedBy: 'fred',
			dateSet: '2019-10-18',
			dateCompleted: 'N/A',
			location: 'location',
			status: 'Incomplete',
			votes: 0,
			priority: 'Low'}, cookies)
		const results = await tasks.getAll()
		//ASSERT
		expect(results.length).toEqual(2)
		expect(results).toEqual([
			{
			  id: 1,
			  issueType: 'issueType',
			  issueDesc: 'description',
			  raisedBy: 'fred',
			  dateSet: await tasks.getDate(),
			  dateCompleted: 'N/A',
			  location: 'location',
			  status: 'Incomplete',
			  votes: 0,
			  priority: 'Low'
			},
			{
			  id: 2,
			  issueType: 'issueType',
			  issueDesc: 'description',
			  raisedBy: 'fred',
			  dateSet: await tasks.getDate(),
			  dateCompleted: 'N/A',
			  location: 'location',
			  status: 'Incomplete',
			  votes: 0,
			  priority: 'Low'
			}
		  ])
		done()
	})
	test('throws error when a field is not filled in', async done => {
		//ARRANGE
		expect.assertions(1)
		const tasks = await new Tasks()
		//ACT
		const failIssue = {
			id: 1,
			issueType: 'issueType',
			issueDesc: '',
			raisedBy: 'fred',
			dateSet: await tasks.getDate(),
			dateCompleted: 'N/A',
			location: 'location',
			status: 'Incomplete',
			votes: 0,
			priority: 'Low'
		  }
		//ASSERT
		try{
			await tasks.addIssue(failIssue, cookies)
		  } catch(e) {
			expect(e).toBeDefined()
		  }
		done()
	})

})

describe('mockIssue()', () => {
	test('mockIssue gives a valid issue string', async done => {
		//ARRANGE
		expect.assertions(1)
		const tasks = await new Tasks()
		const mockIssue = await tasks.mockIssue()
		//ACT
		await tasks.addIssue(mockIssue, cookies)
		const results = await tasks.getAll()
		//ASSERT
		expect(results[0]).toEqual(mockIssue)
		done()
	})
})

describe('getAll()', () => {
	test('getAll when empty', async done => {
		//ARRANGE
		expect.assertions(1)
		const tasks = await new Tasks()
		//ACT
		const result = await tasks.getAll()
		//ASSERT
		expect(result).toEqual([])
		done()
	})

	test('getAll when not empty', async done => {
		//ARRANGE
		expect.assertions(1)
		const tasks = await new Tasks()
		//ACT
		await tasks.addIssue(await tasks.mockIssue(), cookies)
		const date = await tasks.getDate()
		const count = await tasks.getAll()
		//ASSERT
		expect(count).toEqual([{id: 1,
			issueType: 'issueType',
			raisedBy: 'fred',
			dateSet: date,
			location: 'location',
			status: 'Incomplete',
			votes: 0,
			issueDesc: 'description',
			dateCompleted: 'N/A',
			priority: 'Low'}])
		done()
	})


})

describe('changePriority()', () => {
	test('changePriority works from low to medium', async done => {
		//ARRNAGE
		expect.assertions(2)
		const tasks = await new Tasks()
		//ACT
		await tasks.addIssue(await tasks.mockIssue(), cookies)
		await tasks.changePriority(1, 'Medium')
		const data = await tasks.getAll()
		//ASSERT
		expect(data.length).toEqual(1)
		expect(data[0].priority).toEqual('Medium')
		done()
	})
})

describe('getPostcode()', () => {
	test('Gets the correct postcode from the DB', async done => {
		//ARRANGE
		expect.assertions(1)
		const tasks = await new Tasks()
		//ACT
		const data = await tasks.getPostcodes()
		//ASSERT
		expect(data.length).toEqual(9994)
		done()
	})
})

describe('encodeLocation()', () => {
	test('Gives correct encoding when given "1 Harper Road"', async done => {
		//ARRANGE
		expect.assertions(1)
		const tasks = await new Tasks()
		//ACT
		const data = await tasks.encodeLocation('1 Harper Road')
		//ASSERT
		expect(data).toEqual('1+Harper+Road')
		done()
	})
})

describe('getDate()', () => {
	test('test it returns a valid date string', async done => {
		//ARRANGE
		expect.assertions(2)
		const tasks = await new Tasks()
		//ACT
		const dateString = await tasks.getDate()

		//date.parse() returns the number of seconds equivalent to the current unix time (long string of numbers)
		//date.parse() returns NaN if it given an invalid date as an argument
		const correctResult = Date.parse(dateString)
		const wrongResult = Date.parse('not a date')
		//ASSERT
		expect(correctResult).not.toEqual(NaN)
		expect(wrongResult).toEqual(NaN)
		done()
	})
})

describe('changeStatus()', () => {
	test('test complete() works when id = 1 on a valid issue to completed', async done => {
		//ARRANGE
		expect.assertions(2)
		const tasks = await new Tasks()
		//ACT
		await tasks.addIssue(await tasks.mockIssue(), cookies)
		await tasks.changeStatus(1, 'Complete')
		const data = await tasks.getAll()
		//ASSERT
		expect(await data.length).toEqual((await tasks.getAll()).length)
		expect(data[0].status).toEqual('Complete')
		done()
	})
	test('test complete() works when id = 1 on a vald issue to in progress', async done => {
		//ARRANGE
		expect.assertions(2)
		const tasks = await new Tasks()
		await tasks.addIssue(await tasks.mockIssue(), cookies)
		await tasks.changeStatus(1, 'In Progress')
		const data = await tasks.getAll()
		//ASSERT
		expect(await data.length).toEqual((await tasks.getAll()).length)
		expect(data[0].status).toEqual('In Progress')
		done()
	})


})

describe('getIssue()', () => {
	test('getIssue() works when there is one issue', async done => {
		//ARRANGE
		expect.assertions(1)
		const tasks = await new Tasks()
		//ACT
		await tasks.addIssue(await tasks.mockIssue(), cookies)
		const data = await tasks.getIssue(1)
		//ASSERT
		expect(data).toEqual(await tasks.mockIssue())
		done()
	})

	//gets the correct one when there are many

	//throws an error when the number is not available

})

describe('upvote()', () => {
	afterEach(() => {
		cookies = {accessLevel: 'staff', user: 'fred', 1: 'upvoted'}
	  })

	test('Test upvote works when it should (the user has not upvoted in the past 5 minutes)', async done => {
		//ARRANGE
		expect.assertions(2)
		const tasks = await new Tasks()
		//ACT
		await tasks.addIssue(await tasks.mockIssue(), cookies)
		delete cookies[1]
		await tasks.upvote(1, cookies)
		const data = await tasks.getAll()
		//ASSERT
		expect(data.length).toEqual(1)
		expect(data[0].votes).toEqual(1)
		done()
	})

	test('Fails if upvoted in the past 5 minutes', async done => {
		//ARRANGE
		expect.assertions(2)
		const tasks = await new Tasks()
		//ACT
		await tasks.addIssue(await tasks.mockIssue(), cookies)
		delete cookies[1]
		await tasks.upvote(1, cookies)
		//cookies are normally set in the index file, this just simulates that part
		cookies[1] = 'upvoted'
		const data = await tasks.getAll()
		//ASSERT
		await expect(tasks.upvote(1, cookies))
			.rejects
			.toThrow('Please wait up to 5 minutes before upvoting this issue again')
		expect(data[0].votes).toEqual(1)
		done()
	})
})

describe('customQuery()', () => {
	test('gives correct data when there are many issues', async done => {
		//ARRNAGE
		expect.assertions(1)
		const tasks = await new Tasks()
		//ACT
		await tasks.addIssue(await tasks.mockIssue(), cookies)
		await tasks.addIssue(await tasks.mockIssue(2), cookies)
		const data = await tasks.customQuery('SELECT * FROM tasks WHERE id = 2')
		//ASSERT
		expect(data[0]).toEqual(await tasks.mockIssue(2))
		done()
	})
})

describe('getDateDifference()', () => {
	test('date - the same date gives 0 / no difference', async done => {
		//ARRANGE
		expect.assertions(1)
		const tasks = await new Tasks()
		//ACT
		await tasks.addIssue(await tasks.mockIssue(),cookies)

		//will give the difference in date between this new task with todays date and todays date (no difference)
		const difference = await tasks.getDateDifference(1)
		//ASSERT
		expect(difference).toEqual(0)
		done()
	})
	test('test completed today also returns 0', async done => {
		//ARRANGE
		expect.assertions(1)
		const tasks = await new Tasks()
		//ACT
		await tasks.addIssue(await tasks.mockIssue(),cookies)
		await tasks.changeStatus(1, 'Complete')
		//will give the difference in date between this new task with todays date and todays date (no difference)
		const difference = await tasks.getDateDifference(1)
		//ASSERT
		expect(difference).toEqual(0)
		done()

	})

})

describe('filtering functions', () => {
	test('returns no. of records for the issue type supplied', async done => {
		//ARRNAGE
		expect.assertions(2)
		const tasks = await new Tasks(test.db)
		//ACT
		await tasks.addIssue(await tasks.mockIssue(1), cookies)
		await tasks.addIssue(await tasks.mockIssue2(2), cookies)
		await tasks.addIssue(await tasks.mockIssue3(3), cookies)
		await tasks.addIssue(await tasks.mockIssue4(4), cookies)
		const queryOne = await tasks.filterIssueType("Potholes")
		const queryTwo = await tasks.filterIssueType("Litter")
		//ASSERT
		expect(queryOne[0]["COUNT(*)"]).toEqual(1)
		expect(queryTwo[0]["COUNT(*)"]).toEqual(2)
		
		done()
	})

	test('returns only records for the status supplied', async done => {
		//ARRANGE
		expect.assertions(2)
		const tasks = await new Tasks(test.db)

		//ACT
		await tasks.addIssue(await tasks.mockIssue(), cookies)
		await tasks.addIssue(await tasks.mockIssue2(), cookies)	
		await tasks.addIssue(await tasks.mockIssue3(), cookies)
		await tasks.addIssue(await tasks.mockIssue4(), cookies)		
		await tasks.changeStatus(1, "Complete")
		await tasks.changeStatus(2, "Complete")
		await tasks.changeStatus(3, "Complete")
		await tasks.changeStatus(4, "Incomplete")
		
		const queryOne = await tasks.filterstatus('Complete')
		const queryTwo = await tasks.filterstatus('Incomplete')
		
		//ASSERT
		expect(queryOne[0]["COUNT(*)"]).toEqual(3)
		expect(queryTwo[0]["COUNT(*)"]).toEqual(1)
		
		done()
	})
})
