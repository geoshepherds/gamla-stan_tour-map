/*

Title: Free Walking Tour Stockholm
Author: Geoshepherds http://geoshepherds.com
Email: info@geoshepherds.com
Copyright: Geoshepherds 2016
License: This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/4.0/.
 
*/

//Setting up the interactive map area using Leaflet.js
var map = L.map('map', {
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    tap: false,
    zoomControl: false
})
    .setView([59.325, 18.07], 14, {
        zoom: {
            animate: true
        }
    });

//adding a tilelayer to the leaflet map to display mapping information. The URL for the tilelayer can be altered if required
var tileLayer = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	maxZoom: 18,
	attribution: 'Map Design by Geoshepherds Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    detectRetina: true
}).addTo(map);

//adding the custom map markers at each stop of the tour
var greenIcon = L.divIcon({
    iconSize: [78, 78],
    className: "poi"
});

//loading the data layer in the format of a GeoJSON and adding to the map
var dataLayer = L.geoJson(tourPoints, {
    pointToLayer: function(feature, latlng){
        return L.marker(latlng, {icon: greenIcon});
    }
}).addTo(map);

//variables
var section = document.getElementsByTagName('section');
var sectionActive = document.querySelector('section.active');
var article = document.getElementById('tourPanel');
var poi = document.getElementsByClassName('poi');
var cover = document.getElementById("cover");
var title = document.getElementById("title");
var nextBtn = sectionActive.querySelector("#nextBtn");
var prevBtn;
var toStartBtn;
var activeCount = 0; //counter for the active section and map markers

//markers remain blue but become large when the section #cover is active
function startPoints(){
    for(var i = 0; i < tourPoints.features.length; i += 1){        
        poi[i].className = "poi " + tourPoints.features[i].properties.poi;
    }
}

//smallest markers for furthest zoom at the very start of the interactive tour
function bluePoints(){
    for(var i = 0; i < tourPoints.features.length; i += 1){        
        poi[i].className = "poi " +  tourPoints.features[i].properties.poi + " XS";
    }
}

//add class .visible to the active section 
function visible(){
    sectionActive.classList.add("visible");
}

//remove class .visible from the previous active section
function removeVisible(){
    sectionActive.classList.remove("visible");
}


//on page load
bluePoints();

//determine the position of the section element
function highlightSection() {
    
    
    
    removeVisible();
    activeCount += 1;
    sectionActive.id = section[activeCount].id;
    
    sectionActive.innerHTML = section[activeCount].innerHTML;
    
    if(activeCount < 16){
    
        nextBtn = sectionActive.querySelector("#nextBtn");
        nextBtn.addEventListener("click", highlightSection);
    }
    
    if (activeCount >= 3){
        prevBtn = sectionActive.querySelector("#prevBtn");
        prevBtn.addEventListener("click", previousSection);
    }
    
    if(activeCount === 16){
        toStartBtn = sectionActive.querySelector("#toStartBtn");
        toStartBtn.addEventListener("click", restartTour);
    }
    setActive();
    changeZoom();
    resetActive();
    visible();  
}


//if #prevBtn is clicked run function
function previousSection() {
    
    removeVisible();
    activeCount -= 1;
    sectionActive.id = section[activeCount].id;
    sectionActive.innerHTML = section[activeCount].innerHTML;
    
    if(activeCount <= 15){
    
        nextBtn = sectionActive.querySelector("#nextBtn");
        nextBtn.addEventListener("click", highlightSection);
    }
    
    if (activeCount >= 3){
        prevBtn = sectionActive.querySelector("#prevBtn");
        prevBtn.addEventListener("click", previousSection);
    }
    setActive();
    changeZoom();
    resetActive();
    visible();
}

//if #toStartBtn is clicked return to the #title section
function restartTour() {
    
    removeVisible();
    activeCount = 1;
    
    sectionActive.id = section[activeCount].id;
    sectionActive.innerHTML = section[activeCount].innerHTML;
    
    nextBtn = sectionActive.querySelector("#nextBtn");
    nextBtn.addEventListener("click", highlightSection);
    
    setActive();
    changeZoom();
    resetActive();
    visible();
}

//function to toggle class as active based on Y position for sidepanel and highlight POI
function setActive(){
    for (var i = 0; i < tourPoints.features.length; i += 1){
        var tourStop = tourPoints.features[i];
        var tourX = tourStop.geometry.coordinates[1];
        var tourY = tourStop.geometry.coordinates[0];

        if (tourStop.properties.poi == sectionActive.id){
            poi[i].className = "poi " + tourPoints.features[i].properties.poi + " active";
            map.setView([tourX, tourY], 17, {
                pan: {
                    animate: true,
                    duration: 1,
                    easeLinearity: 0.5
                }
            });
        } 
    }
}

//function to remove 'active' class from the section and POI
function resetActive(){
    for (var i = 0; i < tourPoints.features.length; i += 1){
        var tourStop = tourPoints.features[i];

        if (sectionActive.id == "title"){
            
            bluePoints();
        } else if (tourStop.properties.poi != sectionActive.id && title.className != "active") {
            
            poi[i].className = "poi " + tourPoints.features[i].properties.poi;
            
        }
    }
}

//function zoom to Gamla Stan on story cover
function changeZoom(){
    
    
    if (sectionActive.id == "cover"){
        
        map.on("viewreset", resetPath);
        resetPath();
        startPoints();
        map.setView([59.325, 18.07], 16);
        
    } else if (sectionActive.id == "title"){
        
        bluePoints();
        map.setView([59.325, 18.07], 14);
    }
    
}

//D3.j route that animates between the points as you click through the article
var svg = d3.select(map.getPanes().overlayPane).append("svg");//appends svg to the map overlay pane

var g = svg.append("g")
    .attr("class", "leaflet-zoom-hide");//apends g element with the class leaflet-zoom-hide to remove the element and redraw when the map zooms

var lineData = tourLine.features;//variable for the path data

var transform = d3.geo.transform({
    point: projectPoint
});//perform a geometric transformation 

var d3Path = d3.geo.path()
    .projection(transform);//variable for the geo path using the transform above

var d3Feature = g.selectAll("path");

//reset path when the map zooms and pans to retain correct geolocation of the route
function resetPath(){
    
    d3Feature.remove()
    
    var bounds = d3Path.bounds(tourLine);
    var topLeft = bounds[0];
    var bottomRight = bounds[1];
    
    svg.attr("width", bottomRight[0] - topLeft[0])
        .attr("height", bottomRight[1] - topLeft[1])
        .style("left", topLeft[0] + "px")
        .style("top", topLeft[1] + "px");

    g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
    
    
    
    if(sectionActive.id == "cover"){
        
        d3Feature = g.selectAll("path")
            .data(lineData)
            .enter().append("path")
            .attr("d", d3Path)
            .call(transition);
        
    } else if(map.getZoom() === 17){
        
        d3Feature = g.selectAll("path")
            .data(lineData)
            .enter().append("path")
            .attr("d", d3Path);
    } 
}

function transition(path){
    path.transition()
        .duration(7500)
        .ease("linear")
        .attrTween("stroke-dasharray", tweenDash);
}

function tweenDash(){
    var l = this.getTotalLength();
    var i = d3.interpolateString("0," + l, l + "," + l);
    return function(t){
        return i(t); 
    };
} 

//function used in the geometric transformation to process the Lat Long coords to a pixel position
function projectPoint(x, y){
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}

function applyLatLngToLayer(d){
    var y = d.geometry.coordinates[1];
    var x = d.geometry.coordinates[0];
    return map.latLngToLayerPoint(new L.LatLng(y, x));
}

//call highlight section 
highlightSection();

//event listener for scroll
nextBtn.addEventListener("click", highlightSection);

