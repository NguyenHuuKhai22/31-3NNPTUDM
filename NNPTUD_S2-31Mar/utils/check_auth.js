let jwt = require('jsonwebtoken');
let constants = require('./constants')
var userControllers = require('../controllers/users')

module.exports = {
    check_authentication: async function (req, res, next) {
        try {
            if (!req.headers || !req.headers.authorization) {
                return res.status(401).send({
                    success: false,
                    message: "Bạn chưa đăng nhập"
                });
            }
            
            if (!req.headers.authorization.startsWith("Bearer")) {
                return res.status(401).send({
                    success: false,
                    message: "Token không hợp lệ"
                });
            }

            const token = req.headers.authorization.split(" ")[1];
            let decoded;
            try {
                decoded = jwt.verify(token, constants.SECRET_KEY);
            } catch (err) {
                return res.status(401).send({
                    success: false,
                    message: "Token không hợp lệ hoặc đã hết hạn"
                });
            }

            const user = await userControllers.getUserById(decoded.id);
            if (!user) {
                return res.status(401).send({
                    success: false,
                    message: "Người dùng không tồn tại"
                });
            }

            if (!user.status) {
                return res.status(403).send({
                    success: false,
                    message: "Tài khoản đã bị khóa"
                });
            }

            if (decoded.expireIn <= Date.now()) {
                return res.status(401).send({
                    success: false,
                    message: "Token đã hết hạn"
                });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(500).send({
                success: false,
                message: "Lỗi xác thực: " + error.message
            });
        }
    },

    check_authorization: function (roles) {
        return function (req, res, next) {
            try {
                if (!req.user || !req.user.role) {
                    return res.status(403).send({
                        success: false,
                        message: "Không có thông tin về quyền"
                    });
                }

                const roleOfUser = req.user.role.name;
                if (!roleOfUser) {
                    return res.status(403).send({
                        success: false,
                        message: "Role không hợp lệ"
                    });
                }

                if (!roles.includes(roleOfUser)) {
                    return res.status(403).send({
                        success: false,
                        message: "Bạn không có quyền thực hiện hành động này"
                    });
                }

                next();
            } catch (error) {
                return res.status(500).send({
                    success: false,
                    message: "Lỗi phân quyền: " + error.message
                });
            }
        }
    }
}