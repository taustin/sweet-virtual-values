// vim: ts=4 sw=4
//
// This example follows taint.js closely, but uses an assign hook to
// prevent implicit flows leaking information.  Comments that overlap
// with the taint.js comments have been eliminated.

var unaryOps = {
    "-":      function(x) { return -x; },
    "+":      function(x) { return +x; },
    "++":     function(x) { return ++x; },
    "--":     function(x) { return --x; },
    "!":      function(x) { return !x; },
    "~":      function(x) { return ~x; },
    "typeof": function(x) { return typeof x; },
    "void":   function(x) { return void x; }
};

var binaryOps = {
    "*":          function(l, r) { return l * r; },
    "/":          function(l, r) { return l / r; },
    "%":          function(l, r) { return l % r; },
    "+":          function(l, r) { return l + r; },
    "-":          function(l, r) { return l - r; },
    ">>":         function(l, r) { return l >> r; },
    "<<":         function(l, r) { return l << r; },
    ">>>":        function(l, r) { return l >>> r; },
    "<":          function(l, r) { return l < r; },
    "<=":         function(l, r) { return l <= r; },
    ">":          function(l, r) { return l > r; },
    ">=":         function(l, r) { return l >= r; },
    "in":         function(l, r) { return l in r; },
    "instanceof": function(l, r) { return l instanceof r; },
    "==":         function(l, r) { return l == r; },
    "!=":         function(l, r) { return l != r; },
    "===":        function(l, r) { return l === r; },
    "!==":        function(l, r) { return l !== r; },
    "&":          function(l, r) { return l & r; },
    "^":          function(l, r) { return l ^ r; },
    "|":          function(l, r) { return l | r; },
    "&&":         function(l, r) { return l && r; },
    "||":         function(l, r) { return l || r; }
};

let facetKey = {};

function getView(vv, labels) {
    if (!isFaceted(vv)) {
        return vv;
    }
    let p = unproxy(vv, facetKey);
    if (labels.indexOf(p.label) !== -1) {
        return getView(p.highValue, labels);
    } else if (labels.indexOf("!" + p.label) !== -1) {
        return getView(p.lowValue, labels);
    } else {
        return faceted(p.label,
            getView(p.highValue, labels),
            getView(p.lowValue, labels));
    }
}

function hasMatchingFacet(vv, fn) {
    if (!isFaceted(vv)) {
        return fn(vv);
    }
    let p = unproxy(vv, facetKey);
    return hasMatchingFacet(p.highValue, fn) ? true: hasMatchingFacet(p.lowValue, fn);
}

let pcStack = [];

function execForMatchingViews(cond, thenThunk, elseThunk) {
    if (!isFaceted(cond)) {
        if (cond) {
            return thenThunk();
        } else if (elseThunk) {
            return elseThunk();
        }
        return;
    }
    let p = unproxy(cond, facetKey);
    // Don't execute dead branches of code
    if (pcStack.indexOf("!" + p.label) === -1) {
        pcStack.push(p.label);
        execForMatchingViews(p.highValue, thenThunk, elseThunk);
        pcStack.pop();
    }
    // Don't execute dead branches of code
    if (pcStack.indexOf(p.label) === -1) {
        pcStack.push("!" + p.label);
        execForMatchingViews(p.lowValue, thenThunk, elseThunk);
        pcStack.pop();
    }
}

function makeFV(labels, valToSet, defaultVal) {
    if (labels.length === 0) {
        return valToSet;
    }
    let lab = labels[0];
    let rest = labels.slice(1);
    if (lab.startsWith("!")) {
        return faceted(lab.slice(1), defaultVal, makeFV(rest, valToSet, defaultVal));
    } else {
        return faceted(lab, makeFV(rest, valToSet, defaultVal), defaultVal);
    }
}

function faceted(label, hiVal, loVal) {
    var p = new Proxy(loVal, {
        label: label,
        lowValue: getView(loVal, ["!" + label]),
        highValue: getView(hiVal, [label]),
        unary: function(target, op) {
            let h = unproxy(p, facetKey);
            let lo = unaryOps[op](h.lowValue);
            let hi = unaryOps[op](h.highValue);
            return faceted(label, hi, lo);
        },
        left: function(target, op, right) {
            let h = unproxy(p, facetKey);
            let lo = binaryOps[op](target, right);
            let hi = binaryOps[op](h.highValue, right);
            return faceted(label, hi, lo);
        },
        right: function(target, op, left) {
            let h = unproxy(p, facetKey);
            let lo = binaryOps[op](left, target);
            let hi = binaryOps[op](left, h.highValue);
            return faceted(label, hi, lo);
        },
        assign: function(ctx, left, right, assignThunk) {
            if (isFaceted(ctx)) {
                assignThunk(x => makeFV(pcStack,x,left));
            } else {
                assignThunk();
            }
        },
        branch: function(target, test, thenThunk, elseThunk) {
            var c = test();
            execForMatchingViews(c, thenThunk, elseThunk);
        },
    }, facetKey);
    return p;
}

function isFaceted(x) {
    return !!unproxy(x, facetKey);
}

function valToString(v) {
    if (isFaceted(v)) {
        let p = unproxy(v, facetKey);
        return "< " + p.label + " ? " + valToString(p.highValue) + " : " + valToString(p.lowValue) + " >";
    } else {
        return "" + v;
    }
}

function display(v) {
    console.log(valToString(v));
}


var i = faceted('k', 42, 0);
display(i);
var x = ++i;
display(x);

// Testing nested virtual values
var j = faceted("k", faceted("j", 1, 2), faceted("j", 3, 4));
display(j);
display(++j);

var y = 3 + x;
display(y);

var z = faceted('k', 4, 1);
display(y + z);

// Testing implicit flow marking high facet
var b = faceted("k", true, false);
var pub = false;
if (b) {
    pub = true;
}
display(pub);

// Testing implicit flow marking low facet
pub = false;
if (!b) {
    pub = true;
}
display(pub);

// Implicit flows to both high and low facets
var pub2 = 0;
if (b) {
    pub2 = 1;
}
else {
    pub2 = 2;
}
display(pub2);

// Implicit leak in a while loop
var numPasses = 0;
// Note: pub2 now has a secret facet from the previous if/else branch
while (pub2 < 10) {
    numPasses = numPasses + 1;
    pub2 = pub2 + 1;
}
display(pub2);
display(numPasses);


