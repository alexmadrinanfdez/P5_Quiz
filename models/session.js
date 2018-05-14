// Definition of the session model:
module.exports = function (sequelize, Datatypes) {
    return sequelize.define(
        'session',
        {
            sid: {
                type: Datatypes.STRING,
                primaryKey: true
            },
            expires: {
                type: Datatypes.DATE
            },
            data: {
                type: Datatypes.STRING(50000)
            }
        });
};