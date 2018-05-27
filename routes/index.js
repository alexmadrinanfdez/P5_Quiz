var express = require('express');
var router = express.Router();

var quizController = require('../controllers/quiz');
var tipController = require('../controllers/tip');

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

module.exports = router;
