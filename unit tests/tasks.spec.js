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
				message: () => `expected ${this.utils.printReceived(received)} not to contain object ${this.utils.printExpected(argument)}`,
				pass: true
			}
		} else {
			return {
				message: () => `expected ${this.utils.printReceived(received)} to contain object ${this.utils.printExpected(argument)}`,
				pass: false
			}
		}
	}
})

/*This custom matcher was created by andreipfeiffer
it can be viewed at:
https://gist.github.com/andreipfeiffer/bc38ee6387e8cfe6f1a87e8a01d02a13#file-jest-tocontainobject-js

*/
const cookies = {accessLevel: 'staff', user: 'fred', 1: 'upvoted'}

describe('addIssue()', () => {
	beforeAll(() => {
		//when running tests because we dont have access to 'ctx' it means cookies we pass into function
		//dont have the 'get' method so here we prototype it to give the behaviour the standard application has
		Object.prototype.get = function(givenKey) {
			return cookies[givenKey]
		}
		return
	})
	
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

/*
	test('addIssue without all fields completeted rejected', async done => {
		//ARRANGE
		expect.assertions(1)
		const tasks = await new Tasks()
		//ACT
		const results = await tasks.addIssue({issueType: 'fail'}, cookies)

		      
		expect(tasks.addIssue({issueType: 'fail'}, cookies)).rejects.toEqual(new Error('One or more fields were not filled in'))
	});
*/		
	

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
			votes: 0}, cookies)
		const results = await tasks.getAll()
		//ASSERT
		expect(results.length).toEqual(2)
		expect(results).toEqual([
			{
			  id: 1,
			  issueType: 'issueType',
			  issueDesc: 'description',
			  raisedBy: 'fred',
			  dateSet: '2019-10-18',
			  dateCompleted: 'N/A',
			  location: 'location',
			  status: 'Incomplete',
			  votes: 0
			},
			{
			  id: 2,
			  issueType: 'issueType',
			  issueDesc: 'description',
			  raisedBy: 'fred',
			  dateSet: '2019-10-18',
			  dateCompleted: 'N/A',
			  location: 'location',
			  status: 'Incomplete',
			  votes: 0
			}
		  ])
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
			dateCompleted: 'N/A'}])
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

		//date.parse() returns the number of seconds equivalent to the current unix time, so in this case it will be a long string of numbers
		//date.parse() returns NaN if it given an invalid date as an argument
		const correctResult = Date.parse(dateString)
		const wrongResult = Date.parse('not a date')
		//ASSERT
		expect(correctResult).not.toEqual(NaN)
		expect(wrongResult).toEqual(NaN)
		done()
	})
})

describe('complete()', () => {
	test('test complete() works when id = 1 on a valid issue', async done => {
		//ARRANGE
		expect.assertions(2)
		const tasks = await new Tasks()
		//ACT
		await tasks.addIssue(await tasks.mockIssue(), cookies)
		await tasks.changeStatus(1, 'Completed')
		const data = await tasks.customQuery()
		//ASSERT
		expect(await data.length).toEqual((await tasks.getAll()).length)
		expect(data[0].status).toEqual('Completed')
		done()
	})
})
