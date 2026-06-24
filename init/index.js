// const mongoose = require("mongoose");
// const initData = require("./data.js");
// const Listing = require("../models/listing.js");

// const ATLASDB_URL = "mongodb+srv://shrutikaul_db_user:B5atVLxGt1lbBabh@cluster0.2vggoj0.mongodb.net/test?appName=Cluster0";
// main().then(() => {
//     console.log("connected to DB");
// }).catch(err => {
//     console.log()
// });

// async function main() {
//     await mongoose.connect(ATLASDB_UR);
// }

// const initDB = async () => {
//     await Listing.deleteMany({});
//     initData.data = initData.data.map((obj) => ({...obj, owner: "6a23158577c6433c176d667e"}));
//     await Listing.insertMany(initData.data);
//     console.log("Data was initialized");
// }
// initDB();
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const NodeGeocoder = require('node-geocoder');

// Geocoder set up kiya bilkul aapke controller ki tarah
const geocoder = NodeGeocoder({ provider: 'openstreetmap' });

const ATLASDB_URL = "mongodb+srv://shrutikaul_db_user:B5atVLxGt1lbBabh@cluster0.2vggoj0.mongodb.net/test?appName=Cluster0";

mongoose.connect(ATLASDB_URL)
    .then(async () => {
        console.log("Connected to MongoDB Atlas successfully!");
        
        // 1. Purana saari galat data delete karo
        await Listing.deleteMany({});
        console.log("Old listings deleted.");

        const updatedData = [];

        console.log("Fetching coordinates for all listings... Please wait a moment ⏳");

        // 2. Loop chalakar har ek listing ki real location fetch karenge automatic
        for (let obj of initData.data) {
            let lat = 28.6139; // Delhi fallback
            let lng = 77.2090;

            try {
                // OpenStreetMap se coordinates nikale
                let response = await geocoder.geocode(obj.location);
                if (response.length > 0) {
                    lng = response[0].longitude;
                    lat = response[0].latitude;
                }
            } catch (geoErr) {
                console.log(`Could not fetch coordinates for ${obj.location}, using fallback.`);
            }

            // Object ko naye data ke sath array mein push kiya
            updatedData.push({
                ...obj,
                owner: "6a38ff65de9d97aedb924021", // <--- Yahan apni demo3 ki sahi user ID dalo
                geometry: {
                    type: "Point",
                    coordinates: [lng, lat] // [Longitude, Latitude] sahi sequence hai Leaflet/OSM ke liye
                }
            });
        }

        // 3. Ek baar mein saara sahi data insert kar do!
        await Listing.insertMany(updatedData);
        console.log("All listings initialized with correct locations and maps successfully! 🎉");
        
        mongoose.disconnect();
    })
    .catch((err) => {
        console.log("Error:", err);
    });