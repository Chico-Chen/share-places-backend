class HttpError extends Error {
    constructor(message, errorCode) {
        //add a "message" property
        super(message);
        //add a 'code' property
        this.code = errorCode;
    }
}

module.exports = HttpError;