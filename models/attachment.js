// Definition of the attachment model:
module.exports = function (sequelize, Datatypes) {
    return sequelize.define(
        'attachment',
        {
            public_id: { // file's ID in Cloudinary
                type: Datatypes.STRING,
                validate: {notEmpty: {msg: 'public_id cannot be empty.'}}
            },
            url: { // file's URL in Cloudinary
                type: Datatypes.STRING,
                validate: {notEmpty: {msg: 'url cannot be empty.'}}
            },
            filename: {
                type: Datatypes.STRING,
                validate: {notEmpty: {msg: 'filename cannot be empty.'}}
            },
            mime: { // MIME type of the file
                type: Datatypes.STRING,
                validate: {notEmpty: {msg: 'mime cannot be empty.'}}
            }
        });
};