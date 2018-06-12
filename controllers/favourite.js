// PUT /users/:userId/favourites/:quizId
exports.add = (req, res, next) => {
    req.quiz.addFan(req.user) // Method created by Sequelize when the relation is defined
        .then(() => {
            if (req.xhr) res.send(200);
            else res.sendStatus(415);
        })
        .catch(error => {
            console.log(error);
            res.sendStatus(500);
        });
};

// DELETE /users/:userId/favourites/:quizId
exports.delete = (req, res, next) => {
    req.quiz.removeFan(req.user) // Method created by Sequelize when the relation is defined
        .then(() => {
            if (req.xhr) res.send(200);
            else res.sendStatus(415);
        })
        .catch(error => {
            console.log(error);
            res.sendStatus(500);
        });
};