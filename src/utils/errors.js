const sendError = (res, error) => {
    if (error && error.code === 11000) {
        return res.status(409).json({
            message: 'Email already exists'
        });
    }

    if (error && error.name === 'ValidationError') {
        return res.status(400).json({
            message: error.message
        });
    }

    if (error && (error.name === 'CastError' || error.name === 'BSONError')) {
        return res.status(400).json({
            message: 'Invalid id'
        });
    }

    console.error(error);

    return res.status(500).json({
        message: 'Something went wrong'
    });
};

module.exports = {
    sendError
};
