const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const placeRoutes = require('./routes/place-routes');
const userRoutes = require('./routes/user-routes');
const HttpError = require('./models/http-error');

const app = express();

//parse any incoming requests
app.use(bodyParser.json());

app.use((req, res, next) => {
    //Control which domain should have allowed, can be accessed by any domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    //specify which headers these requests sent by the browser may have, the second param can be '*'/any
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested_With, Content-Type, Accept, Authorization');
    //control which http methods may be used on the frontend or maybe attached to incoming request
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use('/api/place', placeRoutes);
app.use('/api/users', userRoutes);

//handling errors for unsupproted routes
app.use((req, res, next) => {
    const error = new HttpError('Could not find this routes', 404);
    throw error;
});

app.use((error, req, res, next) => {
    if  (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({
        message: error.message || 'An unknown error occured!'
    });
});

//connect with database
mongoose
    .connect(`mongodb+srv://chico:qwe123456@react-share-places.uubxw.mongodb.net/places?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(5000);
    })
    .catch(error => console.log(error));
