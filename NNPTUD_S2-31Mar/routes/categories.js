var express = require('express');
var router = express.Router();
let categorySchema = require('../schemas/category')
let { check_authentication, check_authorization } = require('../utils/check_auth')

/* GET users listing. */
// GET routes - no auth required
router.get('/', async function(req, res, next) {
  try {
    let categories = await categorySchema.find({ isDeleted: { $ne: true } })
    res.status(200).send({
      success:true,
      data:categories
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async function(req, res, next) {
  try {
    let id = req.params.id;
    let category = await categorySchema.findOne({
      _id: id,
      isDeleted: { $ne: true }
    });

    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Danh mục không tồn tại hoặc đã bị xóa"
      });
    }

    res.status(200).send({
      success:true,
      data:category
    });
  } catch (error) {
    next(error);
  }
});

// POST/PUT routes - require mod role
router.post('/', check_authentication, check_authorization(['mod', 'admin']), async function(req, res, next) {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).send({
        success: false,
        message: "Tên danh mục là bắt buộc"
      });
    }

    // Check if category with same name exists
    const existingCategory = await categorySchema.findOne({
      name: name,
      isDeleted: { $ne: true }
    });

    if (existingCategory) {
      return res.status(400).send({
        success: false,
        message: "Danh mục với tên này đã tồn tại"
      });
    }

    let newCategory = new categorySchema({ name });
    await newCategory.save()
    res.status(200).send({
      success:true,
      data:newCategory
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', check_authentication, check_authorization(['mod', 'admin']), async function(req, res, next) {
  try {
    let id = req.params.id;
    let category = await categorySchema.findOne({
      _id: id,
      isDeleted: { $ne: true }
    });

    if(!category) {
      return res.status(404).send({
        success:false,
        message:"Danh mục không tồn tại hoặc đã bị xóa"
      });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).send({
        success: false,
        message: "Tên danh mục là bắt buộc"
      });
    }

    // Check if another category with same name exists
    const existingCategory = await categorySchema.findOne({
      _id: { $ne: id },
      name: name,
      isDeleted: { $ne: true }
    });

    if (existingCategory) {
      return res.status(400).send({
        success: false,
        message: "Danh mục với tên này đã tồn tại"
      });
    }

    category.name = name;
    await category.save()
    res.status(200).send({
      success:true,
      data:category
    });
  } catch (error) {
    next(error);
  }
});

// DELETE route - require admin role
router.delete('/:id', check_authentication, check_authorization(['admin']), async function(req, res, next) {
  try {
    let id = req.params.id;
    let category = await categorySchema.findOne({
      _id: id,
      isDeleted: { $ne: true }
    });

    if(!category) {
      return res.status(404).send({
        success:false,
        message:"Danh mục không tồn tại hoặc đã bị xóa"
      });
    }

    // Check if category is being used by any products
    const productSchema = require('../schemas/product');
    const productsUsingCategory = await productSchema.findOne({
      category: id,
      isDeleted: { $ne: true }
    });

    if (productsUsingCategory) {
      return res.status(400).send({
        success: false,
        message: "Không thể xóa danh mục đang được sử dụng bởi sản phẩm"
      });
    }

    category.isDeleted = true;
    await category.save()
    res.status(200).send({
      success:true,
      message: "Đã xóa danh mục thành công"
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
