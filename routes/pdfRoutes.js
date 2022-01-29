const express = require('express');
const pdfController = require('./../controllers/pdfController');

const router = express.Router();

router.get('/:pdfId', pdfController.getPDF);
router.post('/uploadPdf', pdfController.uploadPdf);

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
