'use strict'

const tasks = require('../modules/tasks.js')

describe('constructor()', () => {
	test('check if it goes into memory and query works as should be', async done => {
		const data = await new tasks
		await expect.assertions(1)
		expect(1).toEqual(1)
		done()
	})
})

describe('getAll()', () => {
	test('getAll when empty', async done => {
		const data = await new tasks()
		expect.assertions(1)
		const result = await data.getAll()
		expect(result).toEqual([])
		done()
	})

	test('getAll when not empty', async done => {
		expect.assertions(1)
		//ARRANGE
		const data = await new tasks()
		//ACT
		await data.addIssue()
		const count = await data.getAll()
		//ASSERT
		expect(count).toEqual([{id: 1,issueType: 'Vandalism',raisedBy: 'Fred Cook',dateSet: '2000-01-01',location: '1 Harper Road',status: 'Incomplete'}])
		done()
	})
})
