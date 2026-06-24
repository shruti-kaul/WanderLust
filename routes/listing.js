const { listingSchema } = require("../schema.js");
const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const {storage} = require("../cloudconfig.js");
const upload = multer({ storage });
const ExpressError = require("../utils/ExpressError.js");

router
.route("/")
.get(wrapAsync(listingController.index))
.post(isLoggedIn, validateListing, upload.single('listing[image][url]'), wrapAsync(listingController.createListing));

//New route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
.route("/:id")
.get(wrapAsync(listingController.showListing))
.put(isLoggedIn, isOwner, upload.single('listing[image][url]'), validateListing, wrapAsync(listingController.updateListing))
.delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));


//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;

// Index Route Handler
router.get("/", async (req, res) => {
    let { category } = req.query; // URL se category nikalna (jaise: ?category=Mountains)
    
    let allListings;
    
    if (category) {
        // Agar user ne kisi filter par click kiya hai
        allListings = await Listing.find({ category: category });
    } else {
        // Agar normal home page khola hai (koi filter select nahi hai)
        allListings = await Listing.find({});
    }
    
    res.render("listings/index.ejs", { allListings });
});