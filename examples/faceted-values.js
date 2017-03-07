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

function faceted(hiVal, loVal) {
    if (isFaceted(loVal)) {
        let p = unproxy(loVal, facetKey);
        loVal = p.lowValue;
    }
    if (isFaceted(hiVal)) {
        let p = unproxy(hiVal, facetKey);
        hiVal = p.highValue;
    }

    function isTruthyHigh(x) {
        let p = unproxy(x, facetKey);
        return !!p.highValue;
    }

    function isTruthyLow(x) {
        let p = unproxy(x, facetKey);
        return !!p.lowValue;
    }

    var p = new Proxy(loVal, {
        lowValue: loVal,
        highValue: hiVal,
        unary: function(target, op, operand) {
            // FIXME: should we drop the operand altogether?  It is odd that we don't have a left/right version
            let lo = unaryOps[op](target);
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
                    assignThunk(x=>faceted(x,left));
                    /*
                    assignThunk(function (x) {
                        let old = left;
                        console.log("Old value was " + old);
                        console.log("New value is " + x);
                        let fv = faceted(x,old);
                        display(fv);
                        return fv;
                    });
                    */
                } else if (isTruthyLow(ctx)) {
                    assignThunk(x=>faceted(left,x));
                }
            } else {
                assignThunk();
            }
        },
        branch: function(target, branchType, branches) {
            var i=0;
            if (branchType === 'if') {
                var bodyThunk = branches[i][1];
                if (hiVal && loVal) {
                    // Both are true -- no need to facet execution
                    bodyThunk();
                } else if (hiVal) {
                    bodyThunk();
                } else if (loVal) {
                    bodyThunk();
                }
                //if (target) {
                //    console.log("The magic is happening still!");
                //    var bodyThunk = branches[i][1];
                //    bodyThunk();
                //}
                /*
                for (i in branches) {
                    var cThunk = branches[i][0];
                    var bodyThunk = branches[i][1];
                    if (cThunk(target)) {
                        return bodyThunk();
                    }
                //}*/
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

///
var b = faceted(true, false);
var pub = false;
if (b) {
    pub = true;
}

display(pub);

