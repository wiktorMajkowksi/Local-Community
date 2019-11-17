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
// const Database = require('sqlite-async')
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
//change this later
const staffRegisterPass = 'staff'
//const wardPost = 'ward_postcodes.db'

/*EXAMPLE BOOK DATA FOR TESTING BEFORE WE HAVE A DATABASE
const testData = [
	{id: 1,
		issueType: 'vandalism',
		raisedBy: 'Fred Cook',
		dateSet: '2019-10-22',
		location: 'Priory Street',
		status: 'Incomplete'
	}
]
*/
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
		let loggedIn = false
		if (ctx.cookies.get('user') !== undefined) { //they are logged in
			loggedIn = true
		} else { //they are not logged in
			loggedIn = false
		}
		await ctx.render('index', {user: loggedIn})
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
// eslint-disable-next-line complexity
router.post('/register', koaBody, async ctx => {
	try {
		// extract the data from the request
		const body = ctx.request.body
		// call the functions in the module
		const user = await new User(dbName)
		let userLevel = 'user'
		console.log(body)

		//password entered for staff registration
		if (body.staffPassword !== '') {
			if (body.staffPassword === staffRegisterPass) {
				userLevel = 'staff'
			} else { //incorrect staff registration password entered
				throw new Error('You have entered an incorrect staff registration password')
			}
		} //successful staff registration
		await user.register(body.user, body.pass, body.address, body.postcode, userLevel)
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
		console.log(ctx.cookies.get('user'))
		console.log(ctx.cookies.get('accessLevel'))

		const body = ctx.request.body
		const user = await new User(dbName)
		await user.login(body.user, body.pass)
		ctx.session.authorised = true
		const tasks = await new Tasks(dbName)
		const accessLevel = await tasks.customQuery(`SELECT access_level FROM users WHERE user = "${body.user}"`)

		ctx.cookies.set('user', body.user ,{httpOnly: false})
		ctx.cookies.set('accessLevel', accessLevel[0].access_level, {httpOnly: false})
		console.log(ctx.cookies.get('accessLevel'))
		console.log(ctx.cookies.get('user'))
		return ctx.redirect('/')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

router.get('/logout', async ctx => {
	ctx.session.authorised = null
	//not logged in 
	ctx.cookies.set('user', '')
	ctx.cookies.set('accessLevel', '')
	console.log(ctx.cookies.get('user'))
	console.log(ctx.cookies.get('accessLevel'))
	ctx.redirect('/login')

})

router.get('/contacts', async ctx => {
	await ctx.render('contacts')
})

router.get('/staff', async ctx => {
	try {
		//the db is opened here and the table is created if not present
		const tasks = await new Tasks(dbName)
		const data = await tasks.getAll()

		if (ctx.cookies.get('accessLevel') !== 'staff') {
			throw new Error('You must be logged in as a staff member to view this page')
		}

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
		if (statusChange === 'complete') {
			await tasks.complete(id)
		} else if (statusChange === 'inProgress') {
			await tasks.inProgress(id)
		} else {
			throw new Error('something went wrong')
		}


		ctx.redirect('/staff')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

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
// eslint-disable-next-line complexity
router.post('/issues', async ctx => {
	try {
		const tasks = await new Tasks(dbName)
		const body = await ctx.request.body
		if (ctx.request.body.upvote === 'Upvote') {
			if (ctx.cookies.get(ctx.request.body.id)){
				throw new Error ('please wait 5 minutes before upvoting this issue again')
			} else {
				ctx.cookies.set(ctx.request.body.id, 'yes', {httpOnly: false, maxAge: 300000})
				await tasks.upvote(ctx.request.body.id)
			}
		} else {
			console.log('addissue')
					const issueTypeIn = body.issue
					const issueDescriptionIn = body.issueDesc
					const raisedByIn = ctx.cookies.get('user')
					//const dateSetIn = body.dateSet
					const dateCompletedIn = 'N/A'
					const locationIn = body.location
					const statusIn = body.status
					//const votesIn = body.votes
					const errorThrown = await tasks.addIssue(issueTypeIn,
						issueDescriptionIn,
						raisedByIn,
						undefined,
						dateCompletedIn,
						locationIn,
						statusIn,
						undefined)
					if (errorThrown !== undefined) {
						throw new Error(errorThrown)
					}
				}
		ctx.redirect('/issues')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

app.use(router.routes())
module.exports = app.listen(port, async() => console.log(`listening on port ${port}`))
