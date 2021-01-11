const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const placeController = require('../controllers/place-controller');



router.get('/:pid', placeController.getPlaceById);
router.get('/user/:uid', placeController.getPlacesByUserId);

//post and patch method, need to validate the input data from server side
router.post(
    '', 
    [
        check('title').not().isEmpty(),
        check('description').isLength({min: 5}),
        check('address').not().isEmpty(),
    ],
    placeController.createPlace);

router.patch(
    '/:pid', 
    [
        check('title').not().isEmpty(),
        check('description').isLength({min:5})
    ],
    placeController.updatePlace);

router.delete('/:pid', placeController.deletePlace);

module.exports = router;