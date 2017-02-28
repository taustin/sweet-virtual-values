// vim: ts=4 sw=4
//
// This example follows taint.js closely, but uses additional hooks to
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

let secretKey = {};

// pcStack tracks influences on current execution,
// which indicate implicit flows of information.
let pcStack = [];

function secret(originalValue) {
    if (isSecret(originalValue)) {
        return originalValue;
    }

    var p = new Proxy(originalValue, {
        originalValue: originalValue,
        unary: function(target, op, operand) {
            return secret(unaryOps[op](target));
        },
        left: function(target, op, right) {
            return secret(binaryOps[op](target, right));
        },
        right: function(target, op, left) {
            return secret(binaryOps[op](left, target));
        },
        test: function(cond, branchExit) {
            if (originalValue && isSecret(cond)) {
                pcStack.push(cond);
                branchExit(() => {
                    pcStack.pop();
                });
            }
            return cond;
        },
        assign: function(left, right, assignThunk) {
            if (pcStack.length > 0 && !isSecret(left)) {
                throw new Error("Implicit leak");
            }
            assignThunk(secret);
        }
    }, secretKey);
    return p;
}

function isSecret(x) {
    return !!unproxy(x, secretKey);
}

// Code showing an (attempted) implicit leak from sec to pub.
var sec1 = secret(true);
var sec2 = secret(false);
var pub1 = true;
var pub2 = false;


console.log("Testing explicit flows...");
pub1 = sec1;
console.log("pub1 is now secret? " + isSecret(pub1));
pub1 = true;
console.log("pub1 is now public? " + !isSecret(pub1));
console.log();


console.log("Testing implicit flows...");
if (sec1) {
    sec2 = true;
}
console.log("secret -> secret allowed");

if (pub1) {
    pub2 = true;
}
console.log("public -> public allowed");

if (pub1) {
    sec2 = false;
}
console.log("public -> secret allowed");

/*
if (sec1) {
    pub2 = secret(false);
}
console.log("secret -> public allowed (this should not print)");
*/

if (sec1) {
    pub2 = false;
}
console.log("secret -> public allowed (this should not print)");


