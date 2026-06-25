// show.ejs se aaye hue global variables ko use karna
const lat = listingLat;
const lng = listingLng;

// Leaflet Map Initialize karna
const map = L.map('map').setView([lat, lng], 12); 

// OpenStreetMap Tiles load karna
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Location Marker lagana
const marker = L.marker([lat, lng]).addTo(map);
// public/js/map.js ke andar bindPopup ko aise rakhein:

marker.bindPopup("<b>Listing Location</b><br>Where you'll be.").openPopup();
// Tip: bindPopup ke andar string badal sakte ho dynamic title ke liye!

if (marker._icon) {
    marker._icon.style.filter = "hue-rotate(140deg) saturate(3) brightness(0.9)";
}

// 4. 🔴 AIRBNB STYLE PINK CIRCLE (Mam ke design jaisa)
L.circle([lat, lng], {
    color: '#ff385c',       // Airbnb ka trademark pinkish-red border color
    fillColor: '#ff385c',   // Pinkish-red filling
    fillOpacity: 0.2,       // Halki opacity taaki peeche ka map dikhta rahe
    radius: 400             // Circle ka size meters mein
}).addTo(map);