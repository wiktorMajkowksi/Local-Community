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


describe('addIssue()', () => {
	test('single addIssue works correctly', async done => {
		//ARRANGE
		expect.assertions(2)
		const tasks = await new Tasks()
		//ACT
		await tasks.addIssue()
		const results = await tasks.getAll()
		const resultsLength = await results.length
		const mockIssue = await tasks.mockIssue()
		//ASSERT
		expect(results).toEqual(mockIssue)
		expect(resultsLength).toEqual(1)
		done()
	})

	test('test multiple addIssue results in correct / unique IDs (autoincrement)', async done => {
		//ARRANGE
		expect.assertions(3)
		const tasks = await new Tasks
		//ACT
		await tasks.addIssue()
		await tasks.addIssue()
		const results = await tasks.getAll()
		const resultsLength = await results.length
		const mockArray = (await tasks.mockIssue()).push(await tasks.mockIssue(2))
		console.log(mockArray)
		const index0 = (await tasks.mockIssue())[0]
		//ASSERT
		expect(results).toContainObject(index0)
		expect(results).toContainObject((await tasks.mockIssue(2))[0])
		expect(resultsLength).toEqual(2)
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
		await tasks.addIssue()
		const results = await tasks.getAll()
		//ASSERT
		expect(results).toEqual(mockIssue)
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
		const tasks = await new Tasks()
		expect.assertions(1)
		//ACT
		await tasks.addIssue()
		const count = await tasks.getAll()
		//ASSERT
		expect(count).toEqual([{id: 1,
			issueType: 'Vandalism',
			raisedBy: 'Fred Cook',
			dateSet: '2000-01-01',
			location: '1 Harper Road',
			status: 'Incomplete'}])
		done()
	})


})

describe('getDateString()', () => {
	test('test it returns a valid date string', async done => {
		//ARRANGE
		expect.assertions(2)
		const tasks = await new Tasks()
		//ACT
		const dateString = await tasks.getDateString()

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
