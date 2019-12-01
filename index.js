#!/usr/bin/env node

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
const request = require('request-promise')
const nodemailer = require('nodemailer')
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

//const googleMapsAPIKey = 'AIzaSyAIl1QIAQMTrmZ44aKulJQgY2D_BbqRRcU'
//const ipIOKey = '801bc4b6-a3e4-482b-b998-3a6915db11bb'

//Configuring nodeMailer to use gmail
const transporter = nodemailer.createTransport({
	// example with google mail service
	host: 'smtp.gmail.com',
	port: 465,
	secure: true, // true for 465, false for other ports
	auth: {
		user: 'fredcook789@gmail.com', // replace by your email to practice
		pass: 'koxmzvwnzhmhnope' // replace by your-password
	}
})
//Configuring nodeMailer messages
const mailOptions = {
	from: 'fredcook789@gmail.com',
	to: 'fredcook789@gmail.com',
	subject: 'One of your tasks has been complete!',
	html: 'One of your tasks has been complete!'
}

let user

/**
 * The home page. *
 * @name Home Page
 * @route {GET} /
 * @authentication None
 */
router.get('/', async ctx => {
	try {
		let loggedIn = false
		if (ctx.cookies.get('user') !== undefined) { //they are logged in
			loggedIn = true
		} else { //they are not logged in
			loggedIn = undefined
		}
		await ctx.render('index', {user: loggedIn})
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})
/**
 *  Handling if the User wants to look at the profile page
 * @name ProfileInfo page
 * @route {GET} /profile_info
 */
router.get('/profileInfo', async ctx => {
	try {
		const currentUser = ctx.cookies.get('user')
		const user = await new User(dbName)
		const data = await user.getInfo(currentUser)
		await ctx.render('profileInfo', {user: currentUser, data: data})
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})
/**
 * The user registration page. *
 * @name Register Page
 * @route {GET} /register
 */
router.get('/register', async ctx => {
	const tasks = await new Tasks()
	const postcodes = await tasks.getPostcodes()
	await ctx.render('register', {postcode: postcodes})
})
/**
 * The script to process new user registrations. *
 * @name Register Script
 * @route {POST} /register
 */
router.post('/register', koaBody, async ctx => {
	try {
		// extract the data from the request
		const body = ctx.request.body
		// call the functions in the module
		const user = await new User(dbName)
		let userLevel = 'user'
		//password entered for staff registration
		if (body.staffPassword !== '') {
			if (body.staffPassword === staffRegisterPass) {
				userLevel = 'staff'
			} else { //incorrect staff registration password entered
				throw new Error('You have entered an incorrect staff registration password')
			}
		} //successful staff registration
		await user.register(body.user, body.pass, body.address, body.postcode, userLevel)
		ctx.redirect(`/?msg=new user "${body.user}" added`)
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

/**
 * The login page
 * @name login page
 * @route {GET} /login
 */
router.get('/login', async ctx => {
	const data = {}
	if(ctx.query.msg) data.msg = ctx.query.msg
	if(ctx.query.user) data.user = ctx.query.user
	await ctx.render('login', data)
})

/**
 * The script to handle attempted login
 * @name Login Script
 * @route {POST} /login
 * Upon success sets ctx.cookies.user and ctx.cookies.accessLevel
 */
router.post('/login', async ctx => {
	try {
		const body = ctx.request.body
		user = await new User(dbName)
		await user.login(body.user, body.pass)
		ctx.session.authorised = true
		const tasks = await new Tasks(dbName)
		let accessLevel = await tasks.customQuery(`SELECT accessLevel FROM users WHERE user = "${body.user}"`)
		accessLevel = accessLevel[0].accessLevel
		//sets cookies for the user name and accessLevel so we can use these on other pages
		await ctx.cookies.set('user', body.user ,{httpOnly: false})
		await ctx.cookies.set('accessLevel', accessLevel, {httpOnly: false})
		return ctx.redirect('/')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

/**
 * The logout page
 * @name logout page
 * @route {GET} /logout
 * Removes values from the ctx.cookies.user and ctx.cookies.accessLevel
 */
router.get('/logout', async ctx => {
	ctx.session.authorised = null
	//destorys cookies set
	ctx.cookies.set('user', '')
	ctx.cookies.set('accessLevel', '')
	ctx.redirect('/login')

})

/**
 * The Contacts page
 * @name Contacts page
 * @route {GET} /contacts
 * Displays information of the on team working on the project
 */
router.get('/contacts', async ctx => {
	const userName = ctx.cookies.get('user')
	await ctx.render('contacts', {user: userName})
})

/**
 * The Staff page
 * @name Staff page
 * @route {GET} /staff
 * @authentication requires cookie based authentication
 * Displays a different view of the database with extra features for staff members to edit what is in the database
 */

router.get('/staff', async ctx => {
	try {
		//the db is opened here and the table is created if not present
		const tasks = await new Tasks(dbName)
		const data = await tasks.getAll()
		const cookies = await tasks.getUserCookies(ctx.cookies)
		//gets the cookie for the accessLevel and if it is not 'staff' it throws an error
		if (cookies.accessLevel !== 'staff') {
			throw new Error('You must be logged in as a staff member to view this page')
		}
		const userName = ctx.cookies.get('user')
		await ctx.render('staff', {tasks: data, query: '', user: userName})
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})		//routes to Staff page

/**
 * Handles post requests on the Staff page
 * @name Staff page
 * @route {POST} /staff
 * @authentication Requires cookie based authentication of a staff account
 */

router.post('/staff', async ctx => {
	try {
		const tasks = await new Tasks(dbName)
		const body = await ctx.request.body
		if (body.priorityChange) {
			await tasks.changePriority(body.id, body.priorityChange)
		} else if (body.statusChange) {
			if (body.statusChange === 'Complete') {
				const email = (await tasks.customQuery(`SELECT raisedBy FROM tasks WHERE id = ${body.id}`))[0].raisedBy
				mailOptions['to'] = email
				transporter.sendMail(mailOptions, (error, info) => {
					if (error)
						return console.log(error)
					console.log(`Email sent: ${info.response}`)
				})
			}
			await tasks.changeStatus(body.id, body.statusChange)
		}
		//body.statusChange will either be 'inProgress' or 'complete' depending on which button the staff member clicks
		//body.id is the same as the issue ID that is being interacted with
		//body.statusChange is determined by the button the staff member clicks, either 'In Progress' or 'Complete'
		ctx.redirect('/staff')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

/**
 * The Issues page
 * @name Issues page
 * @route {GET} /issues
 * @authentication requires no authentication to view, requires an account of any kind to post an issue
 */

router.get('/issues', async ctx => {
	try {
		//if (ctx.session.authorised !== true) {
		//	throw new Error('you must be logged in to view this page')
		//}
		//the db is opened here and the table is created if not present
		const tasks = await new Tasks(dbName)
		const data = await tasks.filterstatus('Incomplete', 'In Progress')
		//const data = await tasks.getAll()

		const currentLocation = await request('http://ip-api.io/api/json?api_key=801bc4b6-a3e4-482b-b998-3a6915db11bb')
  			.then(response => JSON.parse(response))
			.catch(err => console.log(err))
		const coords = `${currentLocation['latitude']},${currentLocation['longitude']}`
		//userName here is used to set the rasiedBy attribute of the task to whoever is logged in

		const userName = ctx.cookies.get('user')
		await ctx.render('issues', {tasks: data, query: '', user: userName, currentLocation: coords})
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

/**
 * Handles post requests on the Issues page
 * @name issues page
 * @route {POST} /issues
 * Upon successful upvote sets ctx.cookies.upvote which wil time out after 5 minutes
 */

router.post('/issues', async ctx => {
	try {
		const tasksDb = await new Tasks(dbName)
		const body = await ctx.request.body
		if (body.upvote) {
			//if they havent upvoted the problem within the last 5 minutes, the below won't throw an error
			await tasksDb.upvote(body.id, ctx.cookies)
			//if the above throws an error execution stops, sets a cookie thats 'key'
			//is the id of the issue they upvoted, meaning they cant upvote the same issue within 5 minutes
			ctx.cookies.set(body.id, 'upvoted', {httpOnly: false, maxAge: 300000})
			ctx.redirect('/issues')
		} else if (body.details) {
			await ctx.redirect(`/issue_details/${body.id}`)
		} else if (body.Filter) {
			const data = await tasksDb.filterstatus(`${body.issueStatus}`)
			await ctx.render('issues', {tasks: data, user: body.user})
		} else { //They are submitting an issue and not upvoting
			await tasksDb.addIssue(body, ctx.cookies)
			await console.log(body)
			await ctx.redirect('/issues')
		}
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})


/**
 * The filtered issues page
 * @name issue_status/:status page
 * @route {GET} issue_status/:status
 * Displays all issues filtered by selected status
 */
/* 
router.get('/issue_status/:status', async ctx => {
	try {
		const db = await new Tasks(dbName)
		const data = await db.filterstatus(ctx.params.status)

		const userName = ctx.cookies.get('user')
		await ctx.render('issuestatusfilter', {tasks: data, query: '', user: userName})
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

/**
 * Handels Post requests on the Filtered issues page
 * @name issue_status/:status page
 * @route {POST} issue_status/:status
 * Sends user to different status page dependeding on selected status
 */
/*
router.post('issue_status/:status', async ctx => {
	try{
		const body = await ctx.request.body
		if (body.details === 'Details') {
			//await console.log(body)
			await ctx.redirect(`/issue_details/${body.id}`)
		} else if (body.Filter === 'Filter') {
			await ctx.redirect(`/issue_status/${body.issueStatus}`)
		}
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})
*/
/**
 * The Issue_details page
 * @name issue_details/:num page
 * @route {GET} /issue_details/:num
 * Displays additional information about an issue, such as location on a map, raisedBy, and dateSet
 */
router.get('/issue_details/:num', async ctx => {
	try {
		const db = await new Tasks(dbName)
		const issue = await db.getIssue(ctx.params.num)
		const encoded = await db.encodeLocation(issue.location)
		const dateDifference = await db.getDateDifference(ctx.params.num)
		const userName = ctx.cookies.get('user')
		const obj = {issue: issue, user: userName, encodedLocation: encoded, dateDifference: dateDifference}
		await ctx.render('issue_details', obj)
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

app.use(router.routes())
module.exports = app.listen(port, async() => console.log(`listening on port ${port}`))
