var express = require('express');
var router = express.Router();

var quizController = require('../controllers/quiz');
var tipController = require('../controllers/tip');
var userController = require('../controllers/user');
var sessionController = require('../controllers/session');

// Auto-logout
router.all('*', sessionController.deleteExpiredUserSession);

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

// Routes for the resource "/quizzes"
router.get('/quizzes', quizController.index);
router.get('/quizzes/:quizId(\\d+)', quizController.show);
router.get('/quizzes/new', quizController.new);
router.post('/quizzes', quizController.create);
router.get('/quizzes/:quizId(\\d+)/edit', quizController.edit);
router.put('/quizzes/:quizId(\\d+)', quizController.update);
router.delete('/quizzes/:quizId(\\d+)', quizController.destroy);

router.get('/quizzes/:quizId(\\d+)/play', quizController.play);
router.get('/quizzes/:quizId(\\d+)/check', quizController.check);

router.post('/quizzes/:quizId(\\d+)/tips', tipController.create);

// Routes for the resource "/users"
router.get('/users', userController.index);
router.get('/users/:userId(\\d+)', userController.show);
router.get('/users/new', userController.new);
router.post('/users', userController.create);
router.get('/users/:userId(\\d+)/edit', userController.edit);
router.put('/users/:userId(\\d+)', userController.update);
router.delete('/users/:userId(\\d+)', userController.destroy);

router.get('/users/:userId(\\d+)/quizzes', quizController.index);

// Routes for the resource "/session"
router.get('/session', sessionController.new);
router.post('/session', sessionController.create);
router.delete('/session', sessionController.destroy);

module.exports = router;
