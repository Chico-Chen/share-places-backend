const mongoose = require('mongoose');
const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const getCoordinateForAddress = require('../util/location');

const Place = require('../models/place');
const User = require('../models/user');

exports.getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId).exec();
    } catch(err) {
        const error = new HttpError('Something went wrong, could not find a place', 500);
        return next(error);
    }

    if (!place) {
        const error = new HttpError('Could not find any places for the provided place id.', 404);
        return next(error);
    }

    res.json({place: place.toObject({
        getters:true
    })});
}

exports.getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    
    let userWithPlaces;
    try {
        userWithPlaces = await User.findById(userId).populate('places');
    } catch(err) {
        const error = new HttpError('Fetching places failed, please try again later.', 500);
        return next(error);
    }

    if (!userWithPlaces || userWithPlaces.length === 0) {
        const error = new HttpError('Could not find any places for the provided user id.', 404);
        throw error;
    }

    res.json(
        {
            places: userWithPlaces.map(
                p => p.toObject({getters: true})
            )
        }
    );
}

exports.createPlace = async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        next(new HttpError('Invalid inputs passed, please check your data', 422));
    }

    const {title, description, address, creator} = req.body;

    let coordinates;
    try {
        coordinates = await getCoordinateForAddress(address);
    } catch(error) {
        return next(error);
    }

    const createPlace = new Place({
        title: title,
        description: description,
        address: address,
        location: coordinates,
        image: 'https://cropper.watch.aetnd.com/public-content-aetn.video.aetnd.com/video-thumbnails/AETN-History_VMS/21/202/tdih-may01-HD.jpg?w=1440',
        creator
    });

    let user;
    try {
        user = await User.findById(creator);
    } catch(err) {
        const error = new HttpError('Something went wrong, Could not create the place.');
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Creating denied, unauthorized creator');
        return next(error);
    }

    console.log(user);

    //create a new places, while save the place to the creator
    //transaction allows to perform multiple operations
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createPlace.save({session: sess});
        user.places.push(createPlace);
        await user.save({session: sess});
        await sess.commitTransaction();
    } catch(err) {
        console.log(err);
        const error = new HttpError('Creating place failed, please try again', 500);
        return next(error);
    }

    res.status(201).json({place: createPlace});
}

exports.updatePlace = async (req, res, next) => {
    const { title, description } = req.body;
    const placeId = req.params.pid;

    //copy the Dummy_place, in case that the update operation doesn't complete, e.g. only update title/description
    let updatePlace;
    try {
        updatePlace = await Place.findById(placeId).exec();
    } catch(err) {
        const error = new HttpError('Failed to fetch the specific place', 500);
        return next(error);
    }

    updatePlace.title = title;
    updatePlace.description = description;

    try {
        await updatePlace.save();
    } catch(err) {
        const error = new HttpError('Something went wrong, could not update the place', 500);
        return next(error);
    }

    res.status(200).json({updatePlace: updatePlace.toObject({getters: true})});
}

exports.deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;

    let place;
    try {
        //populate() method allows to refer to a document stored in another collection
        place = await Place.findById(placeId).populate('creator');
    } catch(err) {
        const error = new HttpError('Could not fetch the specific place, fail to delete the place', 500);
        return next(error);
    }

    if (!place) {
        const error = new HttpError('Could not find the provided place.', 404);
        return next(error);
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({session: sess});
        place.creator.places.pull(place);
        await place.creator.save({session: sess});
        await sess.commitTransaction();
    } catch(err) {
        const error = new HttpError('Something went wrong, failed to delete the place, please try again later.', 422);
        return next(error);
    }

    res.status(200).json({message: 'Delete successfully'});
}