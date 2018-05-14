const Sequelize = require('sequelize');
const {models} = require('../models');

// Autoload quiz (:quizId)
exports.load = (req, res, next, quizId) => {
    models.quiz.findById(quizId)
      .then(quiz => {
          if (quiz) {
              req.quiz = quiz;
              next();
          } else {
              throw new Error(`There's no quiz with id = ${quizId}`);
          }
      })
      .catch(error => next(error));
};

// GET /quizzes
exports.index = (req, res, next) => {
    models.quiz.findAll()
        .then(quizzes => {
            res.render('quizzes/index', {quizzes});
        })
        .catch(error => next(error));
};
// GET /quizzes/:quizId
exports.show = (req, res, next) => {
    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};
// GET /quizzes/new
exports.new = (req, res, next) => {
    const quiz = {
        question: "",
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};
// POST /quizzes/create
exports.create = (req, res, next) => {
    const {question, answer} = req.body;
    const quiz = models.quiz.build({
        question,
        answer
    });
    // Saves only the fields "question" and "answer" into the DB
    quiz.save({fields: ["question", "answer"]})
        .then(quiz => {
            req.flash('success', 'Quiz created successfully.');
            res.redirect(`/quizzes/${quiz.id}`)
        })
        .catch(Sequelize.ValidationError, error => {
            error.errors.forEach(({message}) => req.flash('error', message));
            res.render('quizzes/new', {quiz})
        })
        .catch(error => {
            req.flash('error', `Error creating a new quiz: ${error.message}`);
            next(error);
        });
};
// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {
    const {quiz} = req;

    res.render('quizzes/edit', {quiz})
};
// PUT /quizzes/:quizId
exports.update = (req, res, next) => {
    const {quiz, body} = req;
    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
        .then(quiz => {
            req.flash('success', 'Quiz edited successfully.');
            res.redirect(`/quizzes/${quiz.id}`);
        })
        .catch(Sequelize.ValidationError, error => {
            error.errors.forEach(({message}) => req.flash('error', message));
            res.render('quizzes/edit', {quiz})
        })
        .catch(error => {
            req.flash('error', `Error editing the quiz: ${error.message}`);
            next(error);
        });
};
// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {
    req.quiz.destroy()
        .then(() => {
            req.flash('success', 'Quiz deleted successfully.');
            res.redirect('/quizzes');
        })
        .catch(error => {
            req.flash('error', `Error deleting the quiz: ${error.message}`);
            next(error);
        });
};

// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {
    const {quiz, query} = req;
    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};
// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {
    const {quiz, query} = req;
    const answer = query.answer || '';
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();
    res.render('quizzes/result', {
        quiz: quiz,
        result: result,
        answer: answer
    });
};