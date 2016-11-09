// Joins a new segment a-b to chain p. Returns the modified
// chain if successful, or false otherwise
var joinSegmentChain = function (a, b, p) {
    if (!p) return false;
    var c = p[0], d = p[p.length-1];
    if (a.x == c.x && a.y == c.y) {
        p.reverse(); p.push (b); return p;
    }
    if (b.x == c.x && b.y == c.y) {
        p.reverse(); p.push (a); return p;
    }
    if (a.x == d.x && a.y == d.y) {
        p.push (b); return p;
    }
    if (b.x == d.x && b.y == d.y) {
        p.push (a); return p;
    }
    return false;
}

// Joins chain l to chain p if they have a common endpoint, returning
// the modified chain p. Otherwise, returns false
var joinChains = function (l, p) {
    if (!l) return false;
    if (!p) return false;
    console.assert (l!=p, "Can't join chain with itself");
    var a = l[0], b = l[l.length-1];
    var c = p[0], d = p[p.length-1];
    if (a.x == c.x && a.y == c.y) {
        p.reverse(); 
    }
    else if (b.x == c.x && b.y == c.y) {
        p.reverse(); l.reverse(); 
    }
    else if (a.x == d.x && a.y == d.y) {
    }
    else if (b.x == d.x && b.y == d.y) {
        l.reverse();
    }
    else {
        return false;
    }
    for (var i = 1; i < l.length; i++) {
        p.push(l[i]);
    }
    return p;
}

var chainString = function (c) {
    return "("+c.length+")"+"["+c[0].x+","+c[0].y+"]...["+ c[c.length-1].x+","+c[c.length-1].y +"] ";
}

//
// Encapsulates the marching squares algorithm.
// The idea is to obtain a vector representation of curves
// delimiting a given gray level.
// 
function MarchingSquares (img, gray) {

    this.img = img;
    this.gray = gray;
    this.chains = new Set();

    var prev = [], curr = [];
    var iy = 0;
    var above = [];
    for (var ix = 0; ix < img.width; ix++) {
        prev[ix] = brightness(img.get(ix,0))-gray;
        above [ix] = null;
    }

    for (var iy = 1; iy < img.height; iy++) {
        curr [0] = brightness(img.get(0,iy))-gray;
        var left = null;
        for (var ix = 1; ix < img.width; ix++) {
            curr [ix] = brightness(img.get(ix,iy))-gray;
            var nw = prev[ix-1], ne = prev[ix], sw = curr[ix-1], se = curr[ix];
            var n = (nw < 0) != (ne < 0);
            var w = (nw < 0) != (sw < 0);
            var e = (ne < 0) != (se < 0);
            var s = (sw < 0) != (se < 0);
            var np = n ? makePoint (map (0, nw, ne, ix-1,ix), iy-1) : null;
            var sp = s ? makePoint (map (0, sw, se, ix-1,ix), iy) : null;
            var wp = w ? makePoint (ix-1, map (0, nw, sw, iy-1,iy)) : null;
            var ep = e ? makePoint (ix, map (0, ne, se, iy-1,iy)) : null;
            var below = null, right = null;
            if (s) {
                if (n) {
                    if (joinSegmentChain (np, sp, above[ix])) {
                        below = above[ix];
                    }
                    if (!below) {
                        below = [np, sp];
                        this.chains.add (below);
                    }
                }
                else if (w) {
                    if (joinSegmentChain (wp, sp, left)) {
                        below = left;
                    }
                    if (!below) {
                        below = [wp, sp];
                        this.chains.add (below);
                    }
                }

                else if (e) {
                    below = right = [ep,sp];
                    this.chains.add (right);
                }
                else {
                    console.assert (false, "Singleton South");
                }
            }
            if (e) {
                if (w) {
                    if (joinSegmentChain (wp, ep, left)) {
                        right = left;
                    }
                    if (!right) {
                        right = [wp, ep];
                        this.chains.add (right);
                    }
                }
                else if (n) {
                    if (joinSegmentChain (np, ep, above[ix])) {
                        right = above[ix];
                    }
                    if (!right) {
                        right = [np, ep];
                        this.chains.add (right);
                    }
                }
                else {
                    console.assert (s, "Singleton East");
                }
            }
            if (n) {
                if (w && !e) {
                    if (joinSegmentChain (wp,np,left)) {
                        if (left != above[ix]) {
                            var joined = joinChains (left, above[ix]);
                            if (joined) {
                                for (var i = 1; i < img.width; i++) {
                                    if (i != ix && above [i] == left) {
                                        above [i] = joined;
                                    }
                                }
                                if (below == left) below = joined;
                                if (right == left) right = joined;
                                this.chains.delete (left);
                            }
                        }
                    }
                    else if (joinSegmentChain (wp,np,above[ix])) {

                    } 
                    else {
                        var seg = [wp, np];
                        this.chains.add (seg);
                    }
                }
                else {
                    console.assert (s || e, "Singleton North");
                }
            }
            if (w) {
                console.assert (n || e || s, "Singleton West");
            }
            above[ix] = below;
            left = right;
        }
        prev = curr;
        curr = [];
    }

    var carray = [];
    for (let c in this.chains) {
        carray.push (c);
    }
    for (var iterations = 0, havejoined = true; havejoined; iterations++) {
        var joinCount = 0;
        for (var i = 0; i < carray.length; i++) {
            if (!carray [i]) continue;
            for (var j = i+1; j < carray.length; j++) {
                if (!carray[j]) continue;
                var joined = joinChains (carray[j], carray[i]);
                if (joined) {
                    this.chains.delete(carray[j]);
                    carray[j] = null;
                    joinCount++;
                }
            }
        }
        console.log (joinCount);
        havejoined = joinCount>0;
    }

}

// To check correctness of algorithm!
MarchingSquares.prototype.dupVertex = function () {
    var s = new Set();
    for (let c of this.chains) {
        for (var i = 0; i < c.length; i++) {
            var v = c[i];
            if (s.has(v)) {
                return v;
            }
            s.add(v);
        }
    }
    return false;
}


// Returns the chains correctly oriented as curves.
// The curves are assigned a field named color, taken
// by sampling the image close to the curve. If img is defined
// that image rather than the original one is used
MarchingSquares.prototype.curves = function (img) {
    var result = [];
    img = img || this.img;
    for (let chain of this.chains) {
        var curve = new Curve();
        curve.pts = chain;
        curve.saveArea = curve.area();
        if (curve.saveArea < 0) {
            curve.reverse();
            curve.saveArea = -curve.SaveArea;
        } 
        var n = curve.count();
        if (n > 1) {
            var k = 0;
            var r = 0, g = 0, b = 0;
            var p = curve.pts[n-1];
            for (let q of curve.pts) {
                var d = distPoints (q,p);
                if (d > 0.2) {
                    var v = subPoints (q,p);
                    var x = (p.x + q.x) / 2 - v.y/d*1.5;
                    var y = (p.y + q.y) / 2 + v.x/d*1.5;
                    var pcolor = img.get(~~x,~~y);
                    r += pcolor[0];
                    g += pcolor[1];
                    b += pcolor[2];
                    k ++;
                }
                p = q;
            }
            if (k > 0) {
                curve.color = color (r/k,g/k,b/k);
            }
        }
        result.push (curve);
    }
    result.sort (function (a,b) { return b.saveArea - a.saveArea });
    return result;
}
