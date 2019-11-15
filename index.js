#!/usr/bin/env node

/* eslint-disable linebreak-style */

//Routes File

'use strict'

/* MODULE IMPORTS */
const Koa = require('koa')
const Router = require('koa-router')
const views = require('koa-views')
const staticDir = require('koa-static')
const bodyParser = require('koa-bodyparser')
const koaBody = require('koa-body')({multipart: true, uploadDir: '.'})
const session = require('koa-session')
const Database = require('sqlite-async')
//const jimp = require('jimp')

/* IMPORT CUSTOM MODULES */
const User = require('./modules/user')
const Tasks = require('./modules/tasks')

const app = new Koa()
const router = new Router()

/* CONFIGURING THE MIDDLEWARE */
app.keys = ['darkSecret']
app.use(staticDir('public'))
app.use(bodyParser())
app.use(session(app))
app.use(views(`${__dirname}/views`, { extension: 'handlebars' }, {map: { handlebars: 'handlebars' }}))

const defaultPort = 8080
const port = process.env.PORT || defaultPort
const dbName = 'website.db'
const wardPost = 'ward_postcodes.db'

/*EXAMPLE BOOK DATA FOR TESTING BEFORE WE HAVE A DATABASE */
const testData = [
	{id: 1,
		issueType: 'vandalism',
		raisedBy: 'Fred Cook',
		dateSet: '2019-10-22',
		location: 'Priory Street',
		status: 'Incomplete'
	}
]

//console.log(testData)

/**
 * The secure home page.
 *
 * @name Home Page
 * @route {GET} /
 * @authentication This route requires cookie-based authentication.
 */
router.get('/', async ctx => {
	try {
		await ctx.render('index')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})
/**
 * The user registration page.
 *
 * @name Register Page
 * @route {GET} /register
 */
router.get('/register', async ctx => await ctx.render('register'))

/**
 * The script to process new user registrations.
 *
 * @name Register Script
 * @route {POST} /register
 */
router.post('/register', koaBody, async ctx => {
	try {
		// extract the data from the request
		const body = ctx.request.body
		console.log(body)
		// call the functions in the module
		const user = await new User(dbName)
		await user.register(body.user, body.pass, body.address, body.postcode)
		// await user.uploadPicture(path, type)
		// redirect to the home page
		ctx.redirect(`/?msg=new user "${body.name}" added`)
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

router.get('/login', async ctx => {
	const data = {}
	if(ctx.query.msg) data.msg = ctx.query.msg
	if(ctx.query.user) data.user = ctx.query.user
	await ctx.render('login', data)
})

router.post('/login', async ctx => {
	try {
		const body = ctx.request.body
		const user = await new User(dbName)
		await user.login(body.user, body.pass)
		ctx.session.authorised = true
		ctx.cookies.set('user', body.user ,{httpOnly: false})
		console.log(ctx.cookies.get('user'))
		console.log(body.user)
		//if()
		return ctx.redirect('/')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

router.get('/logout', async ctx => {
	ctx.session.authorised = null
	ctx.redirect('/login')

})

router.get('/contacts', async ctx => {
	await ctx.render('contacts')
})	//routes to Contacts page
/*
router.get('/', async ctx => {
	await ctx.render('')
})	//routes to Home page
*/
router.get('/staff', async ctx => {
	try {
		//the db is opened here and the table is created if not present
		const tasks = await new Tasks(dbName)
		const data = await tasks.getAll()
		await ctx.render('staff', {tasks: data, query: ''})
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})		//routes to Staff page

router.post('/staff', async ctx => {
	try {
		const tasks = await new Tasks(dbName)
		const body = await ctx.request.body
		console.log(body)
		const statusChange = body.statusChange
		const id = body.id
		if (statusChange === "complete") {
			tasks.complete(id)
		} else if (statusChange === 'inProgress') {
			tasks.inProgress(id)
		} else {
			throw new Error('something went wrong')
		}


		ctx.redirect('/staff')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})


/*
router.get('/issues', async ctx => {
	try {
		const sql = 'SELECT * FROM tasks;'
		const sql1 = 'SELECT * FROM ward_postcodes'
		const querystring = ''
		//console.log(ctx.query.q)
		const db = await Database.open(dbName)
		const wp = await Database.open(wardPost)

		//Setup the tasks table if it does not exist

		await db.run('CREATE TABLE IF NOT EXISTS tasks ( id INTEGER PRIMARY KEY AUTOINCREMENT, issue_type VARCHAR,	raised_by  VARCHAR,	date_set   DATE,	location  VARCHAR,	status );')
		await wp.run('CREATE TABLE IF NOT EXISTS ward_postcodes ( postcode VARCHAR, latitude NUMERIC, longitude NUMERIC, easting INT, northing INT, grid_Ref VARCHAR, ward VARCHAR, altitude INT, lSON_Code VARCHAR);')
		const data = await db.all(sql)
		const data1 = await wp.all(sql1)
		await db.close()
		console.log(data)
		await ctx.render('issues', {tasks: data, query: querystring})
	} catch (err) {
		await ctx.render('error', {message: err.message})
	}
})
*/

//my router.get('/issues)
router.get('/issues', async ctx => {
	try {
		if (ctx.session.authorised !== true) {
			throw new Error('you must be logged in to view this page')
		}
		//the db is opened here and the table is created if not present
		const tasks = await new Tasks(dbName)
		const data = await tasks.getAll()
		const userName = ctx.cookies.get('user')
		await ctx.render('issues', {tasks: data, query: '', user: userName})
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

// eslint-disable-next-line max-lines-per-function
router.post('/issues', async ctx => {
	try {
		const tasks = await new Tasks(dbName)
		const body = await ctx.request.body

		console.log(body)

		//Maybe refactor this? quite untidy
		const issueTypeIn = body.issue
		const issueDescriptionIn = body.issueDesc
		const raisedByIn = ctx.cookies.get('user')
		//const dateSetIn = body.dateSet
		const dateCompletedIn = 'N/A'
		const locationIn = body.location
		const statusIn = body.status
		//const votesIn = body.votes
		const errorThrown = await tasks.addIssue(issueTypeIn, issueDescriptionIn,raisedByIn, undefined, dateCompletedIn,locationIn, statusIn, undefined)
		if (errorThrown !== undefined) {
			throw new Error(errorThrown)
		}
		await tasks.getAll()
		ctx.redirect('/issues')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

/*
router.get('/issues', async ctx => {
	try {
		const sql = 'SELECT * FROM tasks;'
		const querystring = ''
		//console.log(ctx.query.q)
		const wp = await Database.open(wardPost)

		//Setup the tasks table if it does not exist
		await wp.run('CREATE TABLE IF NOT EXISTS tasks ( postcode VARCHAR, latitude NUMERIC, longitude NUMERIC, easting INT, northing INT, grid_Ref VARCHAR, ward VARCHAR, altitude INT, lSON_Code VARCHAR);')
		const data1 = await wp.all(sql)
		await wp.close()
		console.log(data)
		console.log(data1)
		await ctx.render('issues', {tasks: data, query: querystring})
		await ctx.render('issues', {ward_postcodes: data1, query: querystring})
	} catch (err) {
		await ctx.render('error', {message: err.message})
	}
})
*/

app.use(router.routes())
module.exports = app.listen(port, async() => console.log(`listening on port ${port}`))
