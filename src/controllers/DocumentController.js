const DocumentModel = require('../models/DocumentModel');

const DocumentController = {
  uploadDocument: async (req, res) => {
    const {
      name,
      lastModified,
      size,
      type,
      position,
      faculty,
      comment,
      userId,
    } = req.body;

    try {
      const newDocument = new DocumentModel({
        name,
        lastModified,
        size,
        type,
        position,
        faculty,
        comment,
        user: userId,
      });

      await newDocument.save();

      res.json({
        msg: 'Документы отправлены!',
      });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  getAllDocuments: async (req, res) => {
    try {
      const allDocuments = await DocumentModel.find().populate(
        'user',
        '-password'
      );

      res.json({
        msg: 'Документы получены!',
        allDocuments,
      });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  findDocument: async (req, res) => {
    try {
      const existingDocument = await DocumentModel.findById(
        req.body.documentId
      ).populate('user', '-password');

      res.json({
        msg: 'Документ найден!',
        existingDocument,
      });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  removeDocument: async (req, res) => {
    try {
      await DocumentModel.findByIdAndDelete(req.params.id);

      res.json({ msg: 'Документ удален!' });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  editDocument: async (req, res) => {
    try {
      console.log(req.body);

      await DocumentModel.findOneAndUpdate(
        { _id: req.params.id },
        { name: req.body.name }
      );

      res.json({ msg: 'Документ обновлен!' });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },
};

module.exports = DocumentController;
