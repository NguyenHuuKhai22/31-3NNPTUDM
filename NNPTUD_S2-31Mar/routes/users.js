var express = require('express');
const { token } = require('morgan');
var router = express.Router();
var userControllers = require('../controllers/users')
let jwt = require('jsonwebtoken');
let { check_authentication, check_authorization } = require("../utils/check_auth");
const constants = require('../utils/constants');

/* GET users listing. */
// GET routes - require mod role
router.get('/', check_authentication, check_authorization(['mod', 'admin']), async function (req, res, next) {
  try {
    let users = await userControllers.getAllUsers()
    res.send({
      success: true,
      data: users
    });
  } catch (error) {
    next(error)
  }
});

router.get('/:id', check_authentication, check_authorization(['mod', 'admin']), async function (req, res, next) {
  try {
    // Check if user is trying to get their own data
    if (req.user._id.toString() === req.params.id) {
      return res.status(403).send({
        success: false,
        message: "Không thể xem thông tin của chính mình qua endpoint này"
      });
    }
    let user = await userControllers.getUserById(req.params.id);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Người dùng không tồn tại"
      });
    }
    res.send({
      success: true,
      data: user
    });
  } catch (error) {
    next(error)
  }
});

// POST/PUT/DELETE routes - require admin role
router.post('/', check_authentication, check_authorization(['admin']), async function (req, res, next) {
  try {
    let body = req.body;
    let newUser = await userControllers.createAnUser(
      body.username,
      body.password,
      body.email,
      body.role || 'user'
    )
    res.status(200).send({
      success: true,
      data: newUser
    });
  } catch (error) {
    next(error)
  }
});

router.put('/:id', check_authentication, check_authorization(['admin']), async function (req, res, next) {
  try {
    let body = req.body;
    let updatedUser = await userControllers.updateAnUser(req.params.id, body);
    res.status(200).send({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(error)
  }
});

router.delete('/:id', check_authentication, check_authorization(['admin']), async function (req, res, next) {
  try {
    let deleteUser = await userControllers.deleteAnUser(req.params.id);
    res.status(200).send({
      success: true,
      data: deleteUser
    });
  } catch (error) {
    next(error)
  }
});

module.exports = router;
