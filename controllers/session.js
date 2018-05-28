const Sequelize = require('sequelize');
const {models} = require('../models');
const url = require('url');

const maxIdleTime = 5*60*1000; // tiempo máximo de inactividad en sesión

exports.deleteExpiredUserSession = (req, res, next) => {
    if (req.session.user) {
        if (req.session.user.expires < Date.now()) {
            delete req.session.user; // logout
            req.flash('info', 'User session has expired.');
        } else {
            req.session.user.expires = Date.now() + maxIdleTime; // reset time
        }
    }
    next();
};

const authenticate = (username, password) => {
    return models.user.findOne({where: {username: username}})
        .then(user => {
            if (user && user.verifyPassword(password)) {
                return user;
            } else {
                return null;
            }
        });
};

// GET /session     -- Login form
exports.new = (req, res, next) => {
    // Page to show after login:
    let redir = req.query.redir || url.parse(req.headers.referer || '/').path;
    // Do not show login form again:
    if (redir === '/session') redir = '/';

    res.render('session/new', { redir });
};
// POST /session    -- Create session
exports.create = (req, res, next) => {
    const redir = req.body.redir || '/';
    const {username, password} = req.body;

    authenticate(username, password)
        .then(user => {
            if (user) {
                req.session.user = {
                    id: user.id,
                    username: user.username,
                    expires: Date.now() + maxIdleTime
                };
                res.redirect(redir);
            } else {
                req.flash('error', 'Authentication has failed. Try again.');
                res.render('session/new', { redir });
            }

        })
        .catch(error => {
            req.flash('error', `An error has occurred: ${error}`);
            next(error);
        });
};
// DELETE /session  -- Terminate session
exports.destroy = (req, res, next) => {
    delete req.session.user;
    res.redirect('/session');
};