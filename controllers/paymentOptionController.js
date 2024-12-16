const PaymentOption = require("../models/paymentOption");
const catchAsync = require("../utils/catchAsync");
const multer = require('multer')
const sharp = require('sharp');
const {cloudinary} = require('./../utils/cloudinary');
const AppError = require('./../utils/apError')

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb)=>{
    if(file.mimetype.startsWith("image")){
       cb(null, true)
    }else{
        cb(new AppError("Invalid File.", {barcode:"Barcode must be of type image!"}, 400), false)
    }
}

const upload = multer({
    storage:multerStorage,
    fileFilter:multerFilter
})


exports.uploadBarcode = upload.single("image");
exports.resizeBarcode = catchAsync(async(req, res, next)=>{
    if (!req.file) return next();
    const processedImageBuffer = await sharp(req.file.buffer)
        // .resize(800, 600)
        .toFormat("jpeg")
        .jpeg({ quality: 30 })
        .toBuffer();

    const result = await cloudinary.uploader.upload_stream({
        folder: 'crypto/barcodes',
        public_id: `barcode-${req.user._id}-${Date.now()}`,
        format: 'jpeg',
    }, (error, result) => {
        if (error) {
            return next(new AppError("Cloudinary upload failed.", 500));
        }
        req.file.filename = result.secure_url; // store the URL for future use
        next();
    }).end(processedImageBuffer); // upload the buffer directly
});

exports.createPaymentOption = catchAsync(async(req, res, next)=>{ 
    if(req.file) req.body.image = req.file.filename;
    const paymentOption = await PaymentOption.create(req.body);
    res.status(200).json({
        status:"success",
        data:{
            paymentOption
        }
    })
});

exports.getAllPaymentOptions = async(req, res, next)=>{
   
    const paymentOptions = await PaymentOption.find().select('-__v').sort('-_id');
    res.status(200).json({
        status:"success",
        result:paymentOptions.length,
        data:{
            paymentOptions
        }
    })
}

exports.updatePayOption = catchAsync(async(req, res, next)=>{
    if(req.file) req.body.image = req.file.filename;
    console.log(req.file)
    const paymentOption = await PaymentOption.findByIdAndUpdate(req.params.id, req.body, {
        new:true,
        runValidators:true
    })
    if(!paymentOption){
        return next(new AppError("No payment Option was found with that ID", '', 404))
    }
    res.status(200).json({
        status:"success",
        data:{
            paymentOption
        }
    })
});

exports.deletePayOption = catchAsync(async(req, res, next)=>{
    const paymentOption = await PaymentOption.findByIdAndDelete(req.params.id)
    if(!paymentOption){
        return next(new AppError("No payment Option was found with that ID", '', 404))
    }
    res.status(204).json({
        status:"success",
        data:null
    })

});