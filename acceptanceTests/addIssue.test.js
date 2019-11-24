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
let har

// threshold is the difference in pixels before the snapshots dont match
const toMatchImageSnapshot = configureToMatchImageSnapshot({
	customDiffConfig: { threshold: 2 },
	noColors: true,
})
expect.extend({ toMatchImageSnapshot })

beforeAll( async() => {
	browser = await puppeteer.launch({ headless: true, slowMo: delayMS, args: [`--window-size=${width},${height}`] })
	page = await browser.newPage()
	har = new PuppeteerHar(page)
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
		//start generating a trace file.
		await page.tracing.start({path: 'trace/registering_user_har.json',screenshots: true})
		await har.start({path: 'trace/registering_user_trace.har'})
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
		await page.type('input[name=issueType]', 'genericIssueType')
		await page.type('input[name=issueDesc]', 'genericIssueDesc')
		await page.click('input[name=submitIssueButton')

		//ASSERT
		await page.waitForSelector('h1')
		expect( await page.evaluate( () => document.querySelector('h1').innerText ) )
			.toBe('Issues')

		// stop logging to the trace files
		await page.tracing.stop()
		await har.stop()
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
		await page.click('input[name=submitIssueButton')

		//ASSERT
		await page.waitForSelector('h2')
		expect( await page.evaluate( () => document.querySelector('h2').innerText ) )
			.toBe('One or more fields were not filled in')

		done()

	})
})
