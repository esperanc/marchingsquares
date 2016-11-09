var drawing = []; // Collection of curves

var sel = null; // Selected curve - an element of drawing

// Interaction mode
var dragMode = 1,   // Drag the selected curve
    createMode = 2, // Add a new curve
    inspectMode = 3; // Inspect the image
var mode = 0;       // Current mode


// GUI stuff
var settings = {
    npoints : 10, // Number of points in resample
    resample: function () { // Resample selected curve
        if (sel) {
            sel.pts = sel.resample(~~settings.npoints).pts;
        }
    },
    adaptive : function () { // Adaptive resample 
        if (sel) {
            sel.pts = sel.adaptiveResample(~~settings.npoints).pts;
        }
    },
    duplicate: function () {
        if (sel) {
            drawing.push (sel = sel.clone());
        }
    },
    delete : function () { // Delete selected curve
        if (sel) {
            drawing.splice (drawing.indexOf(sel),1);
            sel = null;
        }
    },
};

function setupGui() {
    var gui = new dat.GUI();
    
    gui.add (settings, 'npoints', 2, 100);
    gui.add (settings, 'resample').name('arc length resample');
    gui.add (settings, 'adaptive').name('adaptive subsample');
    gui.add (settings, 'delete');
    gui.add (settings, 'duplicate');

    // Avoid events on the gui to be passed to the canvas below
    var stop = function (e) {
        e.stopPropagation();
    }
    var events = ['mousedown', 'keypress', 'keydown'];
    var domElement = document.getElementsByTagName("div")[0];
    events.forEach (function (e) {
        domElement.addEventListener (e, stop, false);
    });
    //===

}


function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}


function mousePressed() {
    var closest = null;
    var dmin = 1e100;
    var p = makePoint(mouseX,mouseY);
    for (var i = 0; i < drawing.length; i++) {
        var d = drawing[i].distPoint (p);
        if (d < dmin) {
            dmin = d;
            closest = drawing[i];
        }
    }
    if (dmin < 5) {
        sel = closest;
        mode = dragMode;
        drawing.splice (drawing.indexOf(sel),1,sel);
        console.log (chainString (sel.pts));
    }
    else {
        sel = null;
        //mode = createMode;
        mode = inspectMode;
    }
    if (mode == createMode) {
        var c = new Curve();
        c.add(makePoint(mouseX,mouseY));
        drawing.push(c);
        sel = c;
    }
}

function mouseDragged() {
    if (mode == createMode) {
        var p = sel.pts[sel.count()-1];
        if (dist(mouseX,mouseY,p.x,p.y)>3) {
            sel.add(makeVector(mouseX,mouseY));
        }
    }
    else if (mode == dragMode) {
        sel.translate (makeVector(mouseX-pmouseX, mouseY-pmouseY));
    }
}

function mouseReleased() { 
    // Remove irrelevant curves
    if (drawing.length > 0 && drawing[drawing.length-1] && drawing[drawing.length-1].pts.length < 2) {
        drawing.pop();
    }
    mode = 0;
}

function keyPressed() {
    if (keyCode == BACKSPACE || keyCode == DELETE) {
        settings.delete ();
    }
    else if (key == 'd' || key == 'D') {
        settings.duplicate();
    }
}

// Creates a new image from img where pixels which are
// similar to r,g,b within epsilon are mapped to black
// and the others are mapped to white
function binaryImage (img, r, g, b, a, epsilon) {

    var bin = createImage(img.width, img.height);
    var n = bin.width * bin.height * 4;
    img.loadPixels();
    bin.loadPixels();
    var rmin = r - epsilon, rmax = r + epsilon;
    var gmin = g - epsilon, gmax = g + epsilon;
    var bmin = b - epsilon, bmax = b + epsilon;
    var amin = a - epsilon, amax = a + epsilon;
    for (var i = 0; i < n; i+=4) {
        if (img.pixels[i] >= rmin && img.pixels[i] <= rmax &&
            img.pixels[i+1] >= gmin && img.pixels[i+1] <= gmax &&
            img.pixels[i+2] >= bmin && img.pixels[i+2] <= bmax &&
            img.pixels[i+3] >= amin && img.pixels[i+3] <= amax) {
            bin.pixels[i]=bin.pixels[i+1]=bin.pixels[i+2]=0;
        } else {
            bin.pixels[i]=bin.pixels[i+1]=bin.pixels[i+2]=255;
        }
        bin.pixels[i+3] = 255;
    }
    bin.updatePixels();
    return bin;
}


var img;
var edges;
function preload() {
    // img = loadImage("assets/simple.png");
    //img = loadImage("assets/mickey.png");
    img = loadImage("assets/monica.jpg");
}

function setup() {
    makeVector = createVector; // Use p5's vector
    createCanvas (windowWidth, windowHeight);
    setupGui();
    //img = binaryImage (img, 0, 0, 0, 255, 128);
    //img.filter(BLUR,1);
    var ms = new MarchingSquares(img, 70);
    console.log (ms);
    for (let c of ms.curves()) {
        drawing.push (c);
    }
}

function draw() {
    background(0);

    var imgx = (width-img.width)/2, imgy = (height-img.height)/2;
    var npixels = 4, psize = 10; 
    image (img, imgx, imgy);
    
    drawing.forEach(function (c) {
        if (c.color) {
            fill(c.color);
            //noStroke();
            stroke(255);           
        } else {
            noFill();
            stroke(255);            
        }
        c.draw();
    });

    if (sel) {
        noStroke();
        fill (255,0,0);
        sel.drawPoints();
    }

    if (mode == inspectMode && 
        mouseX >= imgx && mouseY >= imgy && 
        mouseX < imgx+img.width-npixels && mouseY < imgy+img.height-npixels) {
        noSmooth();
        image (img.get (mouseX-imgx-npixels, mouseY-imgy-npixels, npixels*2, npixels*2), 
               mouseX-npixels*psize, mouseY-npixels*psize, npixels*2*psize, npixels*2*psize);
        smooth();
    } 
}