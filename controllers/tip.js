const Sequelize = require('sequelize');
const {models} = require('../models');

// Autoload tip (:tipId)
exports.load = (req, res, next, tipId) => {
    models.tip.findById(tipId)
        .then(tip => {
            if (tip) {
                req.tip = tip;
                next();
            } else {
                req.flash('error', `There's no tip with id = ${userId}`);
                throw new Error(`tipId = ${tipId} doesn't exist`);
            }
        })
        .catch(error => next(error));
};

// MW that allows actions only if the user logged in is admin or is the author of the tip.
exports.adminOrAuthorRequired = (req, res, next) => {
    const isAdmin  = !!req.session.user.isAdmin;
    const isAuthor = req.tip.authorId === req.session.user.id;

    if (isAdmin || isAuthor) {
        next();
    } else {
        console.log('Prohibited operation: The logged in user is not the author of the tip, nor an administrator.');
        res.send(403);
    }
};

// POST /quizzes/:quizId/tips
exports.create = (req, res, next) => {
    const authorId = req.session.user && req.session.user.id || '';
    const tip = models.tip.build(
        {
            text: req.body.text,
            quizId: req.quiz.id,
            authorId
        });
    tip.save()
        .then(tip => {
            req.flash('success', 'Tip created successfully.');
            res.redirect('back');
        })
        .catch(Sequelize.ValidationError, error => {
            error.errors.forEach(({message}) => req.flash('error', message));
            res.redirect('back');
        })
        .catch(error => {
            req.flash('error', `Error creating the new tip: ${error.message}`);
            next(error);
        });
};
// PUT /quizzes/:quizId/tips/:tipId/accept
exports.accept = (req, res, next) => {
    const {tip} = req;
    tip.accepted = true;

    tip.save(['accepted'])
        .then(tip => {
            req.flash('success', 'Tip accepted successfully.');
            res.redirect(`/quizzes/${req.params.quizId}`);
        })
        .catch(error => {
            req.flash('error', `Error accepting the new tip: ${error.message}`);
            next(error);
        });
};
// DELETE /quizzes/:quizId/tips/:tipId
exports.destroy = (req, res, next) => {
    req.tip.destroy()
        .then(() => {
            req.flash('success', 'Tip deleted successfully.');
            res.redirect(`/quizzes/${req.params.quizId}`);
        })
        .catch(error => next(error));
};

// GET /quizzes/:quizId/tips/:tipId/edit
exports.edit = (req, res, next) => {
    const {quiz, tip} = req;

    res.render('tips/edit', {
        quiz,
        tip
    })
};
// PUT /quizzes/:quizId/tips/:tipId
exports.update = (req, res, next) => {
    const {quiz, tip} = req;
    tip.text = req.body.tip;
    tip.accepted = false;

    tip.save({fields: ['text', 'accepted']})
        .then(tip => {
            req.flash('success', 'tip edited successfully.');
            res.redirect('/quizzes/' + req.params.quizId);
        })
        .catch(Sequelize.ValidationError, error => {
            req.flash('error', 'There are errors in the form:');
            error.errors.forEach(({message}) => req.flash('error', message));
            res.render('tips/edit', { quiz, tip });
        })
        .catch(error => {
            req.flash('error', 'Error editing the tip: ' + error.message);
            next(error);
        });
};