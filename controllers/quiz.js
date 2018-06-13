const Sequelize = require('sequelize');
const {models} = require('../models');
const fs = require('fs');
const cloudinary = require('cloudinary');
const attHelper = require('../helpers/attachments');

const paginate = require('../helpers/paginate').paginate;

// Options for the files uploaded to Cloudinary
const cloudinary_upload_options = {
    async: true,
    folder: '/quiz-site/attachments', // ??
    resource_type: 'auto',
    tags: ['quiz', 'question']
};

// Autoload quiz (:quizId)
exports.load = (req, res, next, quizId) => {
    const options = {
        include: [
            models.tip,
            models.attachment,
            { model: models.user, as: 'author' } // adds an object user as a property 'author' to the quiz (quiz.author)
        ]
    };
    // For logged in users: include the favourites of the question by filtering by the logged in user with an OUTER JOIN.
    if (req.session.user) {
        options.include.push({
            model: models.user,
            as: 'fans',
            where: {id: req.session.user.id},
            required: false // OUTER JOIN
        });
    }

    models.quiz.findById(quizId, options)
        .then(quiz => {
            if (quiz) {
                req.quiz = quiz;
                next();
            } else {
                req.flash('error', `There's no quiz with id = ${quizId}`);
                throw new Error(`quizId = ${quizId} doesn't exist`);
            }
        })
        .catch(error => next(error));
};

exports.adminOrAuthorRequired = (req, res, next) => {
    const isAdmin = !!req.session.user.isAdmin; // Type conversion in case is not boolean
    const isAuthor = req.quiz.authorId === req.session.user.id;

    if (isAdmin || isAuthor) next();
    else {
        console.log('Prohibited operation: the logged user is not an administrator nor the author of the quiz.');
        res.send(403);
    }
};

// GET /quizzes
exports.index = (req, res, next) => {
    let countOptions = { where: {}, include: [] };
    const searchFav = req.query.searchFav || '';
    let title = 'Questions';
    // Search:
    const search = req.query.search || '';
    if (search) {
        const search_like = `%${search.replace(/ +/g, '%')}%`; // Se normaliza la búsqueda (sustituyendo blancos por "%")
        countOptions.where = {question: { [Sequelize.Op.like]: search_like }};
    }
    if (req.user) { // only if route includes /:userId (autoload)
        countOptions.where.authorId = req.user.id;
        if (req.session.user && req.session.user.id === req.user.id) title = 'My Quizzes';
        else title = `Quizzes of ${req.user.username}`;
    }
    // Filter: my favourite quizzes
    if (req.session.user) {
        if (searchFav) {
            countOptions.include.push({
                model: models.user,
                as: 'fans',
                where: {id: req.session.user.id},
                attributes: ['id']
            });
        } else {
            /*
            NOTE:
            It should be added the options ( or similars ) to have a lighter query:
                where: {id: req.session.user.id},
                required: false  // OUTER JOIN
            but this does not work with SQLite. The generated query fails when there are several fans of the same quiz.
            */
            countOptions.include.push({
                model: models.user,
                as: 'fans',
                attributes: ['id']
            });
        }
    }
    models.quiz.count(countOptions)
        .then(count => {
            // Pagination:
            const items_per_page = 7;
            // The page to show is given in the query
            const pageno = parseInt(req.query.pageno || 1);
            /*
             * Create a string with the HTML used to render the pagination buttons.
             * This string is added to a local variable of res, which is used into the application layout file
             */
            res.locals.paginate_control = paginate(count, items_per_page, pageno, req.url);
            const findOptions = {
                ...countOptions,
                offset: items_per_page * (pageno - 1),
                limit: items_per_page
            };
            findOptions.include.push(models.attachment);
            findOptions.include.push({
                model: models.user,
                as: 'author'
            });
            return models.quiz.findAll(findOptions);
        })
        .then(quizzes => {
            const format = (req.params.format || 'html').toLowerCase();
            switch (format) {
                case 'html':
                    // Mark favourite quizzes
                    if (req.session.user) {
                        quizzes.forEach(quiz => {
                            quiz.favourite = quiz.fans.some(fan => {
                                return fan.id === req.session.user.id;
                            });
                        });
                    }
                    res.render('quizzes/index', {
                        quizzes,
                        search,
                        searchFav,
                        title,
                        cloudinary
                    });

                    break;
                case 'json':
                    res.json(quizzes);
                    break;
                default:
                    console.log(`No supported format \".${format}\".`);
                    res.sendStatus(406);

            }
        })
        .catch(error => next(error));
};
// GET /quizzes/:quizId
exports.show = (req, res, next) => {
    const {quiz} = req;
    const format = (req.params.format || 'html').toLowerCase();

    switch (format) {
        case 'html':
            new Promise((resolve, reject) => {
                // Only for logger users:
                //   if this quiz is one of my favourites, then I create the attribute "favourite = true"
                if (req.session.user) {
                    resolve(
                        req.quiz.getFans({where: {id: req.session.user.id}})
                            .then(fans => {
                                if (fans.length > 0) req.quiz.favourite = true;
                            })
                    );
                } else resolve();
            })
                .then(() => {
                    res.render('quizzes/show', {
                        quiz,
                        cloudinary
                    });
                })
                .catch(error => next(error));

            break;
        case 'json':
            res.json(quiz);
            break;
        default:
            console.log(`No supported format \".${format}\".`);
            res.sendStatus(406);
    }

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
    const authorId = req.session.user && req.session.user.id || 0;
    const quiz = models.quiz.build({
        question,
        answer,
        authorId
    });
    // Saves only the fields "question" and "answer" into the DB
    quiz.save({fields: ["question", "answer", 'authorId']})
        .then(quiz => {
            req.flash('success', 'Quiz created successfully.');
            if (!req.file) {
                req.flash('info', 'Quiz without attachment.');
                res.redirect(`/quizzes/${quiz.id}`);
                return;
            }
            return attHelper.checksCloudinaryEnv() // Save attachment in Cloudinary
                .then(() => {
                    return attHelper.uploadResourceToCloudinary(req.file.path, cloudinary_upload_options)
                })
                .then(uploadResult => {
                    return models.attachment.create({ // Create new attachment in DB
                        public_id: uploadResult.public_id,
                        url: uploadResult.url,
                        filename: req.file.originalname,
                        mime: req.file.mimetype,
                        quizId: quiz.id
                    })
                        .then(attachment => {
                            req.flash('success', 'Image saved successfully.');
                        })
                        .catch(error => { // Ignoring validation errors
                            req.flash('error', `Failed to save file: ${error.message}`);
                            cloudinary.api.delete_resources(uploadResult.public_id);
                        });
                })
                .catch(error => {
                    req.flash('error', `Failed to save attachment: ${error.message}`);
                })
                .then(() => {
                    fs.unlink(req.file.path); // Delete the file uploaded at ./uploads
                    res.redirect(`/quizzes/${quiz.id}`);
                });
        })
        .catch(Sequelize.ValidationError, error => {
            error.errors.forEach(({message}) => req.flash('error', message));
            res.render('quizzes/new', { quiz })
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
            if (!body.keepAttachment) {
                if (!req.file) { // If no attachment => delete old one
                    req.flash('info', 'This quiz has no attachment.');
                    if (quiz.attachment) {
                        cloudinary.api.delete_resources(quiz.attachment.public_id);
                        quiz.attachment.destroy();
                    }
                    return;
                }
                return attHelper.checksCloudinaryEnv() // Save new attachment in Cloudinary
                    .then(() => {
                        return attHelper.uploadResourceToCloudinary(req.file.path, cloudinary_upload_options);
                    })
                    .then(function (uploadResult) {
                        const old_public_id = quiz.attachment ? quiz.attachment.public_id : null; // Remember public id
                        return quiz.getAttachment() // Update attachment in DB
                            .then(function (attachment) {
                                if (!attachment) {
                                    attachment = models.attachment.build({ quizId: quiz.id });
                                }
                                attachment.public_id = uploadResult.public_id;
                                attachment.url = uploadResult.url;
                                attachment.filename = req.file.originalname;
                                attachment.mime = req.file.mimetype;
                                return attachment.save();
                            })
                            .then(function (attachment) {
                                req.flash('success', 'Image saved successfully.');
                                if (old_public_id) {
                                    cloudinary.api.delete_resources(old_public_id);
                                }
                            })
                            .catch(function (error) { // Ignoring image validation errors
                                req.flash('error', `Failed to save new image: ${error.message}`);
                                cloudinary.api.delete_resources(uploadResult.public_id);
                            });
                    })
                    .catch(function (error) {
                        req.flash('error', `Failed saving the new attachment: ${error.message}`);
                    })
                    .then(function () {
                        fs.unlink(req.file.path); // Delete the file uploaded at ./uploads
                    });
            }
        })
        .then(function () {
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
    // Delete the attachment at Cloudinary (result is ignored)
    if (req.quiz.attachment) {
        attHelper.checksCloudinaryEnv()
            .then(() => {
                cloudinary.api.delete_resources(req.quiz.attachment.public_id);
            });
    }
    req.quiz.destroy()
        .then(() => {
            req.flash('success', 'Quiz deleted successfully.');
            res.redirect('/goback');
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

    new Promise((resolve, reject) => {
        // Only for logger users:
        //   if this quiz is one of my favourites, then I create the attribute "favourite = true"
        if (req.session.user) {
            resolve(
                req.quiz.getFans({where: {id: req.session.user.id}})
                    .then(fans => {
                        if (fans.length > 0) req.quiz.favourite = true;
                    })
            );
        } else resolve();
    })
        .then(() => {
            res.render('quizzes/play', {
                quiz,
                answer,
                cloudinary
            });
        })
        .catch(error => next(error));
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

// GET /quizzes/randomplay
exports.randomplay = (req, res, next) => {
    req.session.answered = req.session.answered || []; // Array con las preguntas respondidas
    const score = req.session.answered.length;
    // Escogemos una pregunta al azar que NO esté entre las ya respondidas
    models.quiz.findOne({where: {id: {[Sequelize.Op.notIn]: req.session.answered}}, order: [Sequelize.fn('RANDOM')]})
        .then(quiz => {
            if (quiz) {
                res.render('random/random_play', {
                    quiz,
                    score
                });
            } else {
                delete req.session.answered;
                res.render('random/random_nomore', { score });
            }
        });
};
// GET /quizzes/randomcheck/:quizId
exports.randomCheck = (req, res, next) => {
    const {quiz, query} = req;
    req.session.answered = req.session.answered || [];
    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();
    if (result) {
        if (req.session.answered.indexOf(req.quiz.id) === -1)
            req.session.answered.push(req.quiz.id);
    }
    const score = req.session.answered.length;
    if (!result) {
        delete req.session.answered;
    }
    res.render('random/random_result', {
        answer,
        result,
        score
    });
};