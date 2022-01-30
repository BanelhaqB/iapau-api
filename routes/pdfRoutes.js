const express = require('express');
const pdfController = require('./../controllers/pdfController');

const router = express.Router();

router.get('/', pdfController.getAll);
router.get('/:pdfId', pdfController.getPDF);
router.get('/predict/:pdfId/:page', pdfController.predictZOI);

router.put('/', pdfController.addPDF);
router.delete('/:id', pdfController.deletePDF);

// router.use(authController.restrictTo('admin', 'lead-guide'));

// router
//   .route('/')
//   .get(bookingController.getAllBookings)
//   .post(bookingController.createBooking);

// router
//   .route('/:id')
//   .get(bookingController.getBooking)
//   .patch(bookingController.updateBooking)
//   .delete(bookingController.deleteBooking);

module.exports = router;
