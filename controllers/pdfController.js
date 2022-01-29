const _ = require('lodash');
const multer = require('multer');

const pdfs = require('../data/pdfs.json');

exports.getPDF = async (req, res, next) => {
  console.log(pdfs, req.params.id);

  const pdf = _.find(pdfs, { id: req.params.pdfId * 1 });
  console.log(pdf);

  res.status(200).json({
    status: 'success',
    pdf
  });
};

// exports.upload = async (req, res, next) => {

// }
