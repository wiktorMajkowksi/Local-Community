'use strict'

const puppeteer = require('puppeteer')
const { configureToMatchImageSnapshot } = require('jest-image-snapshot')
const PuppeteerHar = require('puppeteer-har')
const shell = require('shelljs')

const width = 800
const height = 600
const delayMS = 5

let browser
let page

// threshold is the difference in pixels before the snapshots dont match
const toMatchImageSnapshot = configureToMatchImageSnapshot({
	customDiffConfig: { threshold: 2 },
	noColors: true,
})
expect.extend({ toMatchImageSnapshot })

beforeAll( async() => {
	browser = await puppeteer.launch({ headless: true, slowMo: delayMS, args: [`--window-size=${width},${height}`] })
	page = await browser.newPage()
	const har = new PuppeteerHar(page)
	await page.setViewport({ width, height })
	await shell.exec('acceptanceTests/scripts/beforeAll.sh')
})

afterAll( async() => {
	browser.close()
	await shell.exec('acceptanceTests/scripts/afterAll.sh')
})

beforeEach(async() => {
	await shell.exec('acceptanceTests/scripts/beforeEach.sh')
})

describe('Create an issue', () => {
	test('Create an issue with generic values', async done => {
		//ARRANGE
		await page.goto('http://localhost:8080/register', { timeout: 30000, waitUntil: 'load' })
		//ACT
		await page.type('input[name=user]', 'NewUser')
		await page.type('input[name=pass]', 'password')
		await page.click('input[type=submit]')
		await page.goto('http://localhost:8080/login', { timeout: 30000, waitUntil: 'load' })
		await page.type('input[name=user]', 'NewUser')
		await page.type('input[name=pass]', 'password')
		await page.click('input[type=submit]')
		await page.goto('http://localhost:8080/issues', { timeout: 30000, waitUntil: 'load' })

		await page.select('select#issueType', 'Vandalism')
		await page.type('input[name=issueDesc]', 'genericIssueDesc')
		await page.click('input[name=submitIssueButton]')


		//ASSERT
		await page.waitForSelector('h1')
		expect( await page.evaluate( () => document.querySelector('h1').innerText ) )
			.toBe('Issues')

		done()
	})

	test('creating an issue with missing values fails', async done => {
		//ARRANGE
		await page.goto('http://localhost:8080/register', { timeout: 30000, waitUntil: 'load' })
		//ACT
		await page.type('input[name=user]', 'NewUser')
		await page.type('input[name=pass]', 'password')
		await page.click('input[type=submit]')
		await page.goto('http://localhost:8080/login', { timeout: 30000, waitUntil: 'load' })
		await page.type('input[name=user]', 'NewUser')
		await page.type('input[name=pass]', 'password')
		await page.click('input[type=submit]')
		await page.goto('http://localhost:8080/issues', { timeout: 30000, waitUntil: 'load' })
		await page.click('input[name=submitIssueButton]')

		//ASSERT
		await page.waitForSelector('h1')
		expect( await page.evaluate( () => document.querySelector('h1').innerText ) )
			.toBe('An Error Has Occurred')

		done()

	})
})
