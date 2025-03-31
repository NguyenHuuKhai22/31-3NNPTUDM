let userSchema = require('../schemas/user')
let roleSchema = require('../schemas/role');
let bcrypt = require('bcrypt')
module.exports = {
    getAllUsers: async function () {
        return userSchema.find({})
    },
    getUserById: async function (id) {
        return userSchema.findById(id).populate('role')
    },
    getUserByUsername: async function (username) {
        return userSchema.findOne({
            username: username
        })
    },
    createAnUser: async function (username, password, email, roleI) {
        let role = await roleSchema.findOne({
            name: roleI
        })
        if (role) {
            let newUser = new userSchema({
                username: username,
                password: password,
                email: email,
                role: role._id
            })
            return await newUser.save();
        } else {
            throw new Error('role khong ton tai')
        }
    },
    updateAnUser: async function (id, body) {
        let updatedUser = await this.getUserById(id);
        let allowFields = ["password", "email"];
        for (const key of Object.keys(body)) {
            if (allowFields.includes(key)) {
                updatedUser[key] = body[key]
            }
        }
        await updatedUser.save();
        return updatedUser;
    },
    deleteAnUser: async function (id) {
        let updatedUser = await userSchema.findByIdAndUpdate(
            id, 
            { status: false }, 
            { new: true }
        )
        return updatedUser;
    },
    checkLogin: async function(username, password) {
        let user = await this.getUserByUsername(username);
        if (!user || !user.status) {
            throw new Error("username hoac password khong dung")
        }
        if (!bcrypt.compareSync(password, user.password)) {
            throw new Error("username hoac password khong dung")
        }
        return user._id;
    },
    changePassword: async function(user, oldpassword, newpassword) {
        if (!bcrypt.compareSync(oldpassword, user.password)) {
            throw new Error("mat khau cu khong dung")
        }
        user.password = newpassword;
        return await user.save();
    }
}