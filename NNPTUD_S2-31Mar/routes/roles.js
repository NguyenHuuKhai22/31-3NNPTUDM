var express = require('express');
var router = express.Router();
const roleSchema = require('../schemas/role');
let { check_authentication, check_authorization } = require('../utils/check_auth');

/* Initialize basic roles */
router.post('/init', async function (req, res, next) {
  try {
    // Create basic roles if they don't exist
    const roles = ['admin', 'mod', 'user'];
    const descriptions = {
      'admin': 'Administrator with full access',
      'mod': 'Moderator with partial access',
      'user': 'Regular user with basic access'
    };
    
    for (const roleName of roles) {
      const existingRole = await roleSchema.findOne({ name: roleName });
      if (!existingRole) {
        const newRole = new roleSchema({
          name: roleName,
          description: descriptions[roleName]
        });
        await newRole.save();
      }
    }
    
    res.status(200).send({
      success: true,
      message: 'Basic roles initialized'
    });
  } catch (error) {
    next(error);
  }
});

/* GET users listing. */
// GET routes - no auth required
router.get('/', async function(req, res, next) {
  try {
    let roles = await roleSchema.find({});
    res.send({
      success: true,
      data: roles
    });
  } catch (error) {
    next(error);
  }
});

// POST/PUT/DELETE routes - require admin role
router.post('/', check_authentication, check_authorization(['admin']), async function(req, res, next) {
  try {
    let body = req.body;
    let newRole = new roleSchema({
      name: body.name,
      description: body.description
    });
    await newRole.save();
    res.status(200).send({
      success: true,
      data: newRole
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', check_authentication, check_authorization(['admin']), async function(req, res, next) {
  try {
    let id = req.params.id;
    let role = await roleSchema.findById(id);
    if(role){
      let body = req.body;
      if(body.name) role.name = body.name;
      if(body.description) role.description = body.description;
      await role.save();
      res.status(200).send({
        success: true,
        data: role
      });
    } else {
      res.status(404).send({
        success: false,
        message: "Role không tồn tại"
      });
    }
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', check_authentication, check_authorization(['admin']), async function(req, res, next) {
  try {
    let id = req.params.id;
    let role = await roleSchema.findById(id);
    if(role){
      if(['admin', 'mod', 'user'].includes(role.name)) {
        return res.status(403).send({
          success: false,
          message: "Không thể xóa role mặc định"
        });
      }
      await roleSchema.findByIdAndDelete(id);
      res.status(200).send({
        success: true,
        message: "Đã xóa role thành công"
      });
    } else {
      res.status(404).send({
        success: false,
        message: "Role không tồn tại"
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
