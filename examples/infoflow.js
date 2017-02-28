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

let secretKey = {};

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
        assign: function(ctx, left, right, assignThunk) {
            if (isSecret(ctx) && !isSecret(left)) {
                throw new Error("Implicit leak");
            }
            // Secret values may be updated in a secret context, but must stay secret
            if (isSecret(ctx) && isSecret(left)) {
                assignThunk(secret);
            } else {
                assignThunk();
            }
        }
    }, secretKey);
    return p;
}

function isSecret(x) {
    return !!unproxy(x, secretKey);
}


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

try {
    if (sec1) {
        pub2 = secret(false);
    }
    console.log("secret -> public allowed (this should not print)");
} catch (e) {
    console.log("First secret -> public leak caught");
}

try {
    if (sec1) {
        pub2 = false;
    }
    console.log("secret -> public allowed (this should not print)");
} catch (e) {
    console.log("Second secret -> public leak caught");
}

try {
    if (!sec1) {
        sec2 = true;
    } else {
        pub2 = false;
    }
    console.log("secret -> public allowed (this should not print)");
} catch (e) {
    console.log("Third secret -> public leak caught");
}

