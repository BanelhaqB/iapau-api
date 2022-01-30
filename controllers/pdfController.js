const _ = require('lodash');
const fs = require('fs');
const spawn = require('child_process').spawn;
const multer = require('multer');

const pdfs = require('../data/pdfs.json');

exports.getPDF = async (req, res, next) => {
  console.log(pdfs, req.params.pdfId);

  const pdf = _.find(pdfs, { id: req.params.pdfId });
  console.log(pdf);

  res.status(200).json({
    status: 'success',
    pdf,
  });
};

exports.getAll = async (req, res, next) => {
  console.log(pdfs);

  res.status(200).json({
    status: 'success',
    pdfs,
  });
};

exports.predictZOI = async (req, res, next) => {
  const pdf = _.find(pdfs, { id: req.params.pdfId });
  var pdfIndex = _.findIndex(pdfs, { id: req.params.pdfId });
  console.log(pdf);

  const pythonProcess = spawn('python', [
    './model/executable.py',
    pdf.pages[0].path,
  ]);
  let zoi = false;

  pythonProcess.stdout.on('data', (data) => {
    zoi = data.toString().includes('True');
    console.log(data.toString());

    pdf.pages[req.params.page * 1].zoi = zoi;
    pdf.status = 'PROCESSED';
    pdfs.splice(pdfIndex, 1, pdf);

    fs.writeFile(
      'data/pdfs.json',
      JSON.stringify(pdfs),
      function writeJSON(err) {
        if (err) return console.log(err);
        console.log(JSON.stringify(file));
        console.log('writing to JSON file');
      }
    );

    res.status(200).json({
      status: 'success',
      zoi,
      pdf,
    });
  });

  pythonProcess.stderr.on('data', (data) => {
    console.log(data.toString());
  });
};

exports.addPDF = async (req, res, next) => {
  const pdf = {
    id: req.query.id,
    title: req.query.title,
    pages: JSON.parse(req.query.pages),
    stauts: 'PUBLISHED',
  };

  pdfs.push(pdf);

  fs.writeFile('data/pdfs.json', JSON.stringify(pdfs), function writeJSON(err) {
    if (err) return console.log(err);
    console.log(JSON.stringify(file));
    console.log('writing to JSON file');
  });

  res.status(200).json({
    status: 'success',
    pdf,
  });
};

exports.deletePDF = async (req, res, next) => {
  _.remove(pdfs, { id: req.params.id });

  // pdfs.push(pdf);

  fs.writeFile('data/pdfs.json', JSON.stringify(pdfs), function writeJSON(err) {
    if (err) return console.log(err);
    console.log(JSON.stringify(file));
    console.log('writing to JSON file');
  });

  res.status(200).json({
    status: 'success',
    pdfs,
  });
};
