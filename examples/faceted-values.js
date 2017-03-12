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

// Helper functions that I don't want to make public
function getHigh(x) {
    let p = unproxy(x, facetKey);
    return p.highValue;
}

function getLow(x) {
    let p = unproxy(x, facetKey);
    return p.lowValue;
}

function isTruthyHigh(x) {
    return !!getHigh(x);
}

function isTruthyLow(x) {
    return !!getLow(x);
}

function faceted(hiVal, loVal) {
    if (isFaceted(loVal)) {
        loVal = getLow(loVal);
    }
    if (isFaceted(hiVal)) {
        hiVal = getHigh(hiVal);
    }

    var p = new Proxy(loVal, {
        lowValue: loVal,
        highValue: hiVal,
        unary: function(target, op, operand) {
            // FIXME: should we drop the operand arg altogether?  It is odd that we don't have a left/right version
            let lo = unaryOps[op](loVal);
            let hi = unaryOps[op](hiVal);
            return faceted(hi, lo);
        },
        left: function(target, op, right) {
            let lo = binaryOps[op](target, right);
            let hi = binaryOps[op](hiVal, right);
            return faceted(hi, lo);
        },
        right: function(target, op, left) {
            let lo = binaryOps[op](left, target);
            let hi = binaryOps[op](left, hiVal);
            return faceted(hi, lo);
        },
        assign: function(ctx, left, right, assignThunk) {
            if (isFaceted(ctx)) {
                if (isTruthyHigh(ctx) && isTruthyLow(ctx)) {
                    assignThunk();
                } else if (isTruthyHigh(ctx)) {
                    assignThunk(function(x) {
                        let l = isFaceted(left) ? getLow(left) : left;
                        let h = isFaceted(x) ? getHigh(x): x;
                        return faceted(h,l);
                    });
                } else if (isTruthyLow(ctx)) {
                    assignThunk(function(x) {
                        let l = isFaceted(x) ? getLow(x) : x;
                        let h = isFaceted(left) ? getHigh(left): left;
                        return faceted(h,l);
                    });
                }
            } else {
                assignThunk();
            }
        },
        branch: function(target, branchType, branches) {
            let i=0;
            while (i<branches.length) {
                let test = branches[i][0];
                let bodyThunk = branches[i][1];
                // If either facet is true, the body needs to be executed
                if (test(getHigh) || test(getLow)) {
                    bodyThunk();
                }
                i += 1;
            }
        },
    }, facetKey);
    return p;
}

function isFaceted(x) {
    return !!unproxy(x, facetKey);
}

function display(v) {
    if (isFaceted(v)) {
        let p = unproxy(v, facetKey);
        console.log("< " + p.highValue + " : " + p.lowValue + " >");
    } else {
        console.log(v);
    }
}


var i = faceted(42, 0);
display(i);
var x = ++i;
display(x);

var y = 3 + x;
display(y);

var z = faceted(4 ,1);
display(y + z);

// Testing implicit flow marking high facet
var b = faceted(true, false);
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


