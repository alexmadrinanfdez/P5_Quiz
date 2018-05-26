const Sequelize = require('sequelize');
const {models} = require('../models');
const paginate = require('../helpers/paginate').paginate;

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
    let countOptions = {};
    // Search:
    const search = req.query.search || '';
    if (search) {
        const search_like = `%${search.replace(/ +/g, '%')}%`; // Se normaliza la búsqueda (sustituyendo blancos por "%")
        countOptions.where = {question: { [Sequelize.Op.like]: search_like }};
    }
    models.quiz.count(countOptions)
        .then(count => {
            // Pagination:
            const items_per_page = 7;
            // The page to show is given in the query
            const pageno = parseInt(req.query.pageno || 1);
            /**
             * Create a string with the HTML used to render the pagination buttons.
             * This string is added to a local variable of res, which is used into the application layout file
             */
            res.locals.paginate_control = paginate(count, items_per_page, pageno, req.url);
            const findOptions = {
                ...countOptions,
                offset: items_per_page * (pageno - 1),
                limit: items_per_page
            };
            return models.quiz.findAll(findOptions);
        })
        .then(quizzes => {
            res.render('quizzes/index', { quizzes, search });
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