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

	console.log(ctx.cookies)
	await ctx.render('login', data)
})

router.post('/login', async ctx => {
	try {
		const body = ctx.request.body
		const user = await new User(dbName)
		await user.login(body.user, body.pass)
		ctx.session.authorised = true
		const tasks = await new Tasks(dbName)
		let accessLevel = await tasks.customQuery(`SELECT accessLevel FROM users WHERE user = "${body.user}"`)
		accessLevel = accessLevel[0].accessLevel
		console.log(accessLevel)
		//sets cookies for the user name and accessLevel so we can use these on other pages
		await ctx.cookies.set('user', body.user ,{httpOnly: false})
		await ctx.cookies.set('accessLevel', accessLevel, {httpOnly: false})
		//console.log(ctx.cookies.get('accessLevel'))
		return ctx.redirect('/')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

router.get('/logout', async ctx => {
	ctx.session.authorised = null
	//destorys cookies set
	ctx.cookies.set('user', '')
	ctx.cookies.set('accessLevel', '')
	//console.log(ctx.cookies.get('user'))
	//console.log(ctx.cookies.get('accessLevel'))
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
		const cookies = await tasks.getUserCookies(ctx.cookies)
		//gets the cookie for the accessLevel and if it is not 'staff' it throws an error
		console.log(cookies)
		if (cookies.accessLevel !== 'staff') {
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

		//body.statusChange will either be 'inProgress' or 'complete' depending on which button the staff member clicks

		//body.id is the same as the issue ID that is being interacted with
		//body.statusChange is determined by the button the staff member clicks, either 'In Progress' or 'Complete'
		await tasks.changeStatus(body.id, body.statusChange)
		ctx.redirect('/staff')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

router.get('/issues', async ctx => {
	try {
		//if (ctx.session.authorised !== true) {
		//	throw new Error('you must be logged in to view this page')
		//}
		//the db is opened here and the table is created if not present
		const tasks = await new Tasks(dbName)
		const data = await tasks.getAll()

		//userName here is used to set the rasiedBy attribute of the task to whoever is logged in
		const userName = ctx.cookies.get('user')
		await ctx.render('issues', {tasks: data, query: '', user: userName})
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

router.post('/issues', async ctx => {
	try {
		const tasks = await new Tasks(dbName)
		const body = await ctx.request.body
		if (ctx.request.body.upvote === 'Upvote') {
			//if they havent upvoted the problem within the last 5 minutes, the below won't throw an error
			await tasks.upvote(body.id, ctx.cookies)
			//if the above throws an error execution stops
     		//sets a cookie thats 'key' is the id of the issue they upvoted, meaning they cant upvote the same issue within 5 minutes
			ctx.cookies.set(ctx.request.body.id, 'upvoted', {httpOnly: false, maxAge: 300000})
			ctx.redirect('/issues')

		} else if (ctx.request.body.details === 'Details') {
			await ctx.redirect(`/issue_details/?id=${issue}`)

		} else { //They are submitting an issue and not upvoting
			await tasks.addIssue(body, ctx.cookies)
			await ctx.redirect('/issues')
		}
		
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

router.get('/issue_details', async ctx => {
	try {
		const issue = await tasks.getIssue(body.id)
		await ctx.render('issue_details', issue)
	}
	catch(err)
	{
		await ctx.render('error', {message: err.message})	
	}
})

app.use(router.routes())
module.exports = app.listen(port, async() => console.log(`listening on port ${port}`))
