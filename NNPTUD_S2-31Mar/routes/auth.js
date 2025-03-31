var express = require('express');
var router = express.Router();
let userControllers = require('../controllers/users')
let { check_authentication } = require("../utils/check_auth")
let jwt = require('jsonwebtoken');
let constants = require('../utils/constants')

// Public routes - no auth required
router.post('/login', async function (req, res, next) {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).send({
                success: false,
                message: "Username và password là bắt buộc"
            });
        }
        let result = await userControllers.checkLogin(username, password);
        res.status(200).send({
            success: true,
            data: jwt.sign({
                id: result,
                expireIn: (new Date(Date.now() + 3600 * 1000)).getTime()
            }, constants.SECRET_KEY)
        })
    } catch (error) {
        next(error)
    }
});

router.post('/signup', async function (req, res, next) {
    try {
        const { username, password, email } = req.body;
        if (!username || !password || !email) {
            return res.status(400).send({
                success: false,
                message: "Username, password và email là bắt buộc"
            });
        }
        let result = await userControllers.createAnUser(username, password,
            email, 'user');
        res.status(200).send({
            success: true,
            data: result
        })
    } catch (error) {
        next(error)
    }
});

// Protected routes - require authentication
router.get('/me', check_authentication, async function (req, res, next) {
    try {
        res.send({
            success: true,
            data: req.user
        });
    } catch (error) {
        next(error)
    }
});

router.post('/changepassword', check_authentication, async function (req, res, next) {
    try {
        const { oldpassword, newpassword } = req.body;
        if (!oldpassword || !newpassword) {
            return res.status(400).send({
                success: false,
                message: "Mật khẩu cũ và mới là bắt buộc"
            });
        }
        let user = await userControllers.changePassword(req.user, oldpassword, newpassword);
        res.send({
            success: true,
            message: "Đổi mật khẩu thành công"
        });
    } catch (error) {
        next(error)
    }
});

module.exports = router