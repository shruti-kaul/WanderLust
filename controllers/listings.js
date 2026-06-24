const { listingSchema } = require("../schema.js"); // Adjust path if necessary
const Listing = require("../models/listing");
const NodeGeocoder = require('node-geocoder');
const geocoder = NodeGeocoder({provider: 'openstreetmap'});
const ExpressError = require("../utils/ExpressError.js"); 

module.exports.index = async (req, res) => {
    const { category, search } = req.query; // 🎯 URL se '?category=Trending' ko nikalega
    
    let allListings;
    
    try {
        if (search && search.trim() !== "") {
            // Agar box mein kuch search kiya hai
            allListings = await Listing.find({
                title: { $regex: search.trim(), $options: "i" }
            });
        } else if (category) {
            // Agar kisi filter icon par click kiya hai
            allListings = await Listing.find({ category: category });
        } else {
            // Default: Saari listings dikhao
            allListings = await Listing.find({});
        }

        res.render("listings/index.ejs", { allListings });

    } catch (err) {
        console.log("🔥 Filter Error:", err);
        allListings = await Listing.find({});
        res.render("listings/index.ejs", { allListings });
    }
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async(req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews", 
            populate: {
                path: "author",
            },
        })
        .populate("owner");
    if(!listing) {
        req.flash("error", "Listing you are requested does not exist!");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", {listing});
};

module.exports.createListing = async(req, res, next) => {

    let result = listingSchema.validate(req.body);
    if(result.error) {
        let errMsg = result.error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg); // Make sure ExpressError required ho upar
    }

    // 2. Geocoding API call
    let response = await geocoder.geocode(req.body.listing.location);
    console.log("--- GEOCODER RESPONSE START ---");
    console.log(response); 
    console.log("--- GEOCODER RESPONSE END ---");
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    if (response.length > 0) {
        newListing.geometry = {
            type: "Point",
            coordinates: [response[0].longitude, response[0].latitude]
        };
    } else {
        newListing.geometry = {
            type: "Point",
            coordinates: [77.2090, 28.6139] // Default Delhi fallback
        };
    }    

    // 3. Image save & Database save
    let url = req.file.path;
    let filename = req.file.filename;
    newListing.image = {url, filename};
    
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");    
};

module.exports.renderEditForm = async(req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing you are requested does not exist!");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250");
    res.render("listings/edit.ejs", {listing, originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    
    // 1. Pehle normal fields update karo
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

    // 🌟 MAGIC FIX: Purani invalid owner ID ko current logged-in user ki ID se overwrite kar do!
    if (req.user && req.user._id) {
        listing.owner = req.user._id;
    }

    // 2. Agar location badli hai, toh coordinates update karo
    if (req.body.listing.location) {
        let response = await geocoder.geocode(req.body.listing.location);
        if (response.length > 0) {
            listing.geometry = {
                type: "Point",
                coordinates: [response[0].longitude, response[0].latitude]
            };
        }
    }

    // 3. Agar image badli hai
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
    }
    
    // 4. Sab kuch ek sath save karo
    await listing.save(); 
    
    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let {id} = req.params;
    let deletedListing =  await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};