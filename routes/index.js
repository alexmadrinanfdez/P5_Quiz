var express = require('express');
var router = express.Router();

var quizController = require('../controllers/quiz');
var tipController = require('../controllers/tip');
var userController = require('../controllers/user');
var sessionController = require('../controllers/session');

// Auto-logout
router.all('*', sessionController.deleteExpiredUserSession);

//  History: restoration routes
function redirectBack(req, res, next) {
    const url = req.session.backURL || '/';
    delete req.session.backURL;
    res.redirect(url);
}
router.get('/goback', redirectBack);

function saveBack(req, res, next) {
    req.session.backURL = req.url;
    next();
}
// Restoration routes are GET routes that do not end in:
//   /new, /edit, /play, /check, /session, or /:id.
router.get([
    '/',
    '/author',
    '/users',
    '/users/:id(\\d+)/quizzes',
    '/quizzes'
    ],
    saveBack
);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

// Author page.
router.get('/author', (req, res, next) => {
  res.render('author');
});

// Autoload for routes using :quizId
router.param('quizId', quizController.load); // summons load() every time it detects the param :quizId
// Autoload for routes using :userId
router.param('userId', userController.load);
// Autoload for routes using :tipId
router.param('tipId', tipController.load);

// Routes for the resource "/quizzes"
router.get('/quizzes', quizController.index);
router.get('/quizzes/:quizId(\\d+)', quizController.show);
router.get('/quizzes/new', sessionController.loginRequired, quizController.new);
router.post('/quizzes', sessionController.loginRequired, quizController.create);
router.get('/quizzes/:quizId(\\d+)/edit', sessionController.loginRequired, quizController.adminOrAuthorRequired, quizController.edit);
router.put('/quizzes/:quizId(\\d+)', sessionController.loginRequired, quizController.adminOrAuthorRequired, quizController.update);
router.delete('/quizzes/:quizId(\\d+)', sessionController.loginRequired, quizController.adminOrAuthorRequired, quizController.destroy);

router.get('/quizzes/:quizId(\\d+)/play', quizController.play);
router.get('/quizzes/:quizId(\\d+)/check', quizController.check);

// Routes for the resource "/tips"
router.post('/quizzes/:quizId(\\d+)/tips', sessionController.loginRequired, tipController.create);
router.put('/quizzes/:quizId(\\d+)/tips/:tipId(\\d+)/accept', sessionController.loginRequired, quizController.adminOrAuthorRequired, tipController.accept);
router.delete('/quizzes/:quizId(\\d+)/tips/:tipId(\\d+)', sessionController.loginRequired, quizController.adminOrAuthorRequired, tipController.destroy);

// Routes for the resource "/users"
router.get('/users', sessionController.loginRequired, userController.index);
router.get('/users/:userId(\\d+)', sessionController.loginRequired, userController.show);
router.get('/users/new', userController.new);
router.post('/users', userController.create);
router.get('/users/:userId(\\d+)/edit', sessionController.loginRequired, sessionController.adminOrMyselfRequired, userController.edit);
router.put('/users/:userId(\\d+)', sessionController.loginRequired, sessionController.adminOrMyselfRequired, userController.update);
router.delete('/users/:userId(\\d+)', sessionController.loginRequired, sessionController.adminAndNotMyselfRequired, userController.destroy);

router.get('/users/:userId(\\d+)/quizzes', sessionController.loginRequired, quizController.index);

// Routes for the resource "/session"
router.get('/session', sessionController.new);
router.post('/session', sessionController.create);
router.delete('/session', sessionController.destroy);

module.exports = router;
