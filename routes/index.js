var express = require('express');
var router = express.Router();

var multer = require('multer');
var upload = multer({dest: './uploads/'});

const quizController = require('../controllers/quiz');
const tipController = require('../controllers/tip');
const userController = require('../controllers/user');
const sessionController = require('../controllers/session');
const favouriteController = require('../controllers/favourite');

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
router.param('userId', userController.load); // summons load() every time it detects the param :userId
// Autoload for routes using :tipId
router.param('tipId', tipController.load); // summons load() every time it detects the param :tipId

// Routes for the resource "/quizzes"
router.get('/quizzes.:format?',
    quizController.index);
router.get('/quizzes/:quizId(\\d+).:format?',
    quizController.show);
router.get('/quizzes/new',
    sessionController.loginRequired, quizController.new);
router.post('/quizzes',
    sessionController.loginRequired, upload.single('image'), quizController.create);
router.get('/quizzes/:quizId(\\d+)/edit',
    sessionController.loginRequired, quizController.adminOrAuthorRequired, quizController.edit);
router.put('/quizzes/:quizId(\\d+)',
    sessionController.loginRequired, quizController.adminOrAuthorRequired, upload.single('image'), quizController.update);
router.delete('/quizzes/:quizId(\\d+)',
    sessionController.loginRequired, quizController.adminOrAuthorRequired, quizController.destroy);

router.get('/quizzes/:quizId(\\d+)/play',
    quizController.play);
router.get('/quizzes/:quizId(\\d+)/check',
    quizController.check);

// Routes for the resource "/tips"
router.post('/quizzes/:quizId(\\d+)/tips',
    sessionController.loginRequired, tipController.create);
router.put('/quizzes/:quizId(\\d+)/tips/:tipId(\\d+)/accept',
    sessionController.loginRequired, quizController.adminOrAuthorRequired, tipController.accept);
router.delete('/quizzes/:quizId(\\d+)/tips/:tipId(\\d+)',
    sessionController.loginRequired, quizController.adminOrAuthorRequired, tipController.destroy);

router.get('/quizzes/:quizId(\\d+)/tips/:tipId(\\d+)/edit',
    sessionController.loginRequired, tipController.adminOrAuthorRequired, tipController.edit);
router.put('/quizzes/:quizId(\\d+)/tips/:tipId(\\d+)',
    sessionController.loginRequired, tipController.adminOrAuthorRequired, tipController.update);

// Routes for the resource "/users"
router.get('/users',
    sessionController.loginRequired, userController.index);
router.get('/users/:userId(\\d+)',
    sessionController.loginRequired, userController.show);
router.get('/users/new',
    userController.new);
router.post('/users',
    userController.create);
router.get('/users/:userId(\\d+)/edit',
    sessionController.loginRequired, sessionController.adminOrMyselfRequired, userController.edit);
router.put('/users/:userId(\\d+)',
    sessionController.loginRequired, sessionController.adminOrMyselfRequired, userController.update);
router.delete('/users/:userId(\\d+)',
    sessionController.loginRequired, sessionController.adminAndNotMyselfRequired, userController.destroy);

router.get('/users/:userId(\\d+)/quizzes',
    sessionController.loginRequired, quizController.index);

// Routes for the resource "/session"
router.get('/session',
    sessionController.new);
router.post('/session',
    sessionController.create);
router.delete('/session',
    sessionController.destroy);

// Routes for the resource "/favourites"
router.put('/users/:userId(\\d+)/favourites/:quizId(\\d+)',
    sessionController.loginRequired, sessionController.adminOrMyselfRequired, favouriteController.add);
router.delete('/users/:userId(\\d+)/favourites/:quizId(\\d+)',
    sessionController.loginRequired, sessionController.adminOrMyselfRequired, favouriteController.delete);

// Routes for the resource "/randomplay"
router.get('/quizzes/randomplay',                quizController.randomplay);
router.get('/quizzes/randomcheck/:quizId(\\d+)', quizController.randomCheck);

module.exports = router;
