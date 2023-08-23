const express = require('express');
const router = express.Router();

const sauceCtrl = require('../controllers/sauce');

const auth = require('../middleware/auth');
const multerConfig = require('../middleware/multer-config');

router.post('/', auth, multerConfig, sauceCtrl.createSauce);
router.get('/', auth, sauceCtrl.getAllSauces);
router.get('/:id', auth, sauceCtrl.getOneSauce);
router.put('/:id', auth, multerConfig, sauceCtrl.modifySauce);
router.delete('/:id', auth, sauceCtrl.deleteSauce);
router.post('/:id/like', auth, sauceCtrl.likeSauce);


module.exports = router;