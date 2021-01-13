const { uuid } = require("uuidv4");
const HttpError = require("../models/http-error");
const User = require('../models/user');
const { validationResult } = require('express-validator');


exports.getUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, '-password').exec();
    } catch(err) {
        const error = new HttpError('Fetching user list failed, please try again later', 500);
        return next(error);
    }

    if (users.length === 0) {
        const error = new HttpError('Do not have any users', 404);
        return next(error);
    }

    res.json({users: users.map(user => user.toObject({getters: true}))});
}

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
       const error = new HttpError('Invalid inputs passed, please check your data', 422);
       return next(error);
    }

    const {username, email, password} = req.body;

    let hasUser;
    try {
        hasUser = await User.findOne({email: email});
    } catch(err) {
        console.log(err);
        const error = new HttpError('Signing up failed, please try again later', 500);
        return next(error);
    }

    if (hasUser) {
        const error = new HttpError('Could not create user, email already exists.', 422);
        return next(error);
    }

    const createdUser = new User({
        username, 
        email, 
        image: req.file.path,
        password,
        places: []
    });

    try {
        await createdUser.save();
    } catch(err) {
        const error = new HttpError('Signing up failed, please try again later', 500);
        return next(error);
    }

    res.status(201).json({user: createdUser.toObject({getters: true})});
}

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    let identifiedUser;
    try {
        identifiedUser = await User.findOne({email: email}).exec();
    } catch(err) {
        const error = new HttpError('Could not fetch the user for the provided email, please enter a valid email.', 500);
        return next(error);
    }

    if (!identifiedUser || password !== identifiedUser.password) {
        const error = new HttpError('Could not identify user, email or password is wrong.', 401);
        return next(error);
    }

    res.status(200).json({
        message: 'logged in!', 
        user: identifiedUser.toObject({getters: true})
    });
}