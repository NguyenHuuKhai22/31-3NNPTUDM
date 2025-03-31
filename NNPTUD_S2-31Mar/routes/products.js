var express = require('express');
var router = express.Router();
let productSchema = require('../schemas/product')
let categorySchema = require('../schemas/category')
let { check_authentication, check_authorization } = require('../utils/check_auth')
/* GET users listing. */
function BuildQuery(query){
  let result = {
    isDeleted: { $ne: true } // Only show non-deleted products
  };
  if(query.name){
    result.name = new RegExp(query.name,'i');
  }
  result.price={};
  if(query.price){
    if(query.price.$gte){
      result.price.$gte = Number(query.price.$gte);
    }else{
      result.price.$gte=0;
    }
    if(query.price.$lte){
      result.price.$lte = Number(query.price.$lte);
    }else{
      result.price.$lte=10000;
    }
  }else{
    result.price.$gte=0;
    result.price.$lte=10000;
  }
  return result;
}
router.get('/', async function(req, res, next) {
  try {
    let products = await productSchema.find(BuildQuery(req.query)).populate({
      path:'category', select:'name'
    })
    res.status(200).send({
      success:true,
      data:products
    });
  } catch (error) {
    next(error);
  }
});
router.get('/:id', async function(req, res, next) {
  try {
    let id = req.params.id;
    let product = await productSchema.findOne({
      _id: id,
      isDeleted: { $ne: true }
    }).populate('category', 'name');
    
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Sản phẩm không tồn tại hoặc đã bị xóa"
      });
    }

    res.status(200).send({
      success:true,
      data:product
    });
  } catch (error) {
    next(error);
  }
});
router.post('/', check_authentication, check_authorization(['mod', 'admin']), async function(req, res, next) {
  try {
    const { name, category, price, quantity } = req.body;
    
    // Validate required fields
    if (!name || !category) {
      return res.status(400).send({
        success: false,
        message: "Tên và danh mục là bắt buộc"
      });
    }

    let getCategory = await categorySchema.findOne({
      name: category,
      isDeleted: { $ne: true }
    });

    if(!getCategory) {
      return res.status(404).send({
        success:false,
        message:"Danh mục không tồn tại hoặc đã bị xóa"
      });
    }

    let newProduct = new productSchema({
      name: name,
      price: price || 0,
      quantity: quantity || 0,
      category: getCategory._id,
    });

    await newProduct.save()
    res.status(200).send({
      success:true,
      data:newProduct
    });
  } catch (error) {
    next(error);
  }
});
router.put('/:id', check_authentication, check_authorization(['mod', 'admin']), async function(req, res, next) {
  try {
    let id = req.params.id;
    let product = await productSchema.findOne({
      _id: id,
      isDeleted: { $ne: true }
    });

    if(!product) {
      return res.status(404).send({
        success:false,
        message:"Sản phẩm không tồn tại hoặc đã bị xóa"
      });
    }

    const { name, category, price, quantity } = req.body;
    
    if (name) product.name = name;
    if (typeof price !== 'undefined') product.price = price;
    if (typeof quantity !== 'undefined') product.quantity = quantity;
    
    if (category) {
      let getCategory = await categorySchema.findOne({
        name: category,
        isDeleted: { $ne: true }
      });
      
      if (!getCategory) {
        return res.status(404).send({
          success:false,
          message:"Danh mục không tồn tại hoặc đã bị xóa"
        });
      }
      product.category = getCategory._id;
    }

    await product.save()
    res.status(200).send({
      success:true,
      data:product
    });
  } catch (error) {
    next(error);
  }
});
router.delete('/:id', check_authentication, check_authorization(['admin']), async function(req, res, next) {
  try {
    let id = req.params.id;
    let product = await productSchema.findOne({
      _id: id,
      isDeleted: { $ne: true }
    });

    if(!product) {
      return res.status(404).send({
        success:false,
        message:"Sản phẩm không tồn tại hoặc đã bị xóa"
      });
    }

    product.isDeleted = true;
    await product.save()
    res.status(200).send({
      success:true,
      message: "Đã xóa sản phẩm thành công"
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
