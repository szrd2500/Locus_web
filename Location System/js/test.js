'use strict';

const imageUrl = 'https://source.unsplash.com/random';
const imageContainer = document.getElementById("cvsBlock");
const displayImage = document.getElementById("canvas");
const hud = document.getElementById("hud");


let minScale = 1;
let maxScale = 4;
let imageWidth;
let imageHeight;
let containerWidth;
let containerHeight;
let displayImageX = 0;
let displayImageY = 0;
let displayImageScale = 1;

let displayDefaultWidth;
let displayDefaultHeight;

let rangeX = 0;
let rangeMaxX = 0;
let rangeMinX = 0;

let rangeY = 0;
let rangeMaxY = 0;
let rangeMinY = 0;

let displayImageRangeY = 0;

let displayImageCurrentX = 0;
let displayImageCurrentY = 0;
let displayImageCurrentScale = 1;


function resizeContainer() {
    containerWidth = imageContainer.offsetWidth;
    containerHeight = imageContainer.offsetHeight;
    if (displayDefaultWidth !== undefined && displayDefaultHeight !== undefined) {
        displayDefaultWidth = displayImage.offsetWidth;
        displayDefaultHeight = displayImage.offsetHeight;
        updateRange();
        displayImageCurrentX = clamp(displayImageX, rangeMinX, rangeMaxX);
        displayImageCurrentY = clamp(displayImageY, rangeMinY, rangeMaxY);
        updateDisplayImage(
            displayImageCurrentX,
            displayImageCurrentY,
            displayImageCurrentScale);
    }
}

resizeContainer();

function clamp(value, min, max) {
    return Math.min(Math.max(min, value), max);
}

function clampScale(newScale) {
    return clamp(newScale, minScale, maxScale);
}

window.addEventListener('resize', resizeContainer, true);


const displayImage = new Image();
displayImage.src = imageUrl;
displayImage.onload = function () {
    imageWidth = displayImage.width;
    imageHeight = displayImage.height;
    imageContainer.appendChild(displayImage);
    displayImage.addEventListener('mousedown', e => e.preventDefault(), false);
    displayDefaultWidth = displayImage.offsetWidth;
    displayDefaultHeight = displayImage.offsetHeight;
    rangeX = Math.max(0, displayDefaultWidth - containerWidth);
    rangeY = Math.max(0, displayDefaultHeight - containerHeight);
}

imageContainer.addEventListener('wheel', e => {
    displayImageScale = displayImageCurrentScale = clampScale(displayImageScale + (e.wheelDelta / 800));
    updateRange();
    displayImageCurrentX = clamp(displayImageCurrentX, rangeMinX, rangeMaxX)
    displayImageCurrentY = clamp(displayImageCurrentY, rangeMinY, rangeMaxY)
    updateDisplayImage(displayImageCurrentX, displayImageCurrentY, displayImageScale);
}, false);

function updateDisplayImage(x, y, scale) {
    const transform = 'translateX(' + x + 'px) translateY(' + y + 'px) translateZ(0px) scale(' + scale + ',' + scale + ')';
    displayImage.style.transform = transform;
    displayImage.style.WebkitTransform = transform;
    displayImage.style.msTransform = transform;
    updateHud();
}

function updateRange() {
    rangeX = Math.max(0, Math.round(displayDefaultWidth * displayImageCurrentScale) - containerWidth);
    //canvasImg.width  Zoom 
    rangeY = Math.max(0, Math.round(displayDefaultHeight * displayImageCurrentScale) - containerHeight);

    rangeMaxX = Math.round(rangeX / 2);
    rangeMinX = 0 - rangeMaxX;

    rangeMaxY = Math.round(rangeY / 2);
    rangeMinY = 0 - rangeMaxY;
}

function updateHud() {
    let hudText = "<label>C_Scale : " + displayImageCurrentScale.toFixed(4) + "</label>" +
        "<label>C_X : " + displayImageCurrentX + "</label>" +
        "<label>C_Y : " + displayImageCurrentY + "</label>" +
        "<br>" +
        "<label>rangeX : " + rangeX + "</label>" +
        "<label>rangeMinX : " + rangeMinX + "</label>" +
        "<label>rangeMaxX : " + rangeMaxX + "</label>" +
        "<br>" +
        "<label>rangeY : " + rangeY + "</label>" +
        "<label>rangeMinY : " + rangeMinY + "</label>" +
        "<label>rangeMaxY : " + rangeMaxY + "</label>" +
        "<br>" +
        "<label>Scale : " + displayImageScale.toFixed(4) + "</label>" +
        "<label>X : " + displayImageX + "</label>" +
        "<label>Y : " + displayImageY + "</label>";
    hud.innerHTML = hudText;
}

const hammertime = new Hammer(imageContainer);

hammertime.get('pinch').set({
    enable: true
});
hammertime.get('pan').set({
    direction: Hammer.DIRECTION_ALL
});

hammertime.on('pan', ev => {
    displayImageCurrentX = clamp(displayImageX + ev.deltaX, rangeMinX, rangeMaxX);
    displayImageCurrentY = clamp(displayImageY + ev.deltaY, rangeMinY, rangeMaxY);
    updateDisplayImage(displayImageCurrentX, displayImageCurrentY, displayImageScale);
});

hammertime.on('pinch pinchmove', ev => {
    displayImageCurrentScale = clampScale(ev.scale * displayImageScale);
    updateRange();
    displayImageCurrentX = clamp(displayImageX + ev.deltaX, rangeMinX, rangeMaxX);
    displayImageCurrentY = clamp(displayImageY + ev.deltaY, rangeMinY, rangeMaxY);
    updateDisplayImage(displayImageCurrentX, displayImageCurrentY, displayImageCurrentScale);
});

hammertime.on('panend pancancel pinchend pinchcancel', () => {
    displayImageScale = displayImageCurrentScale;
    displayImageX = displayImageCurrentX;
    displayImageY = displayImageCurrentY;
});