const util = require('util');

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

let symKey = {};
let cntxStack = [];

function makeNode(test, left,right){
    return {type:"Node", test:test, left:left, right:right};
}
function makeAexp(name){
    return {type:"Aexp", value:name};
}

function inspect(value){
    console.log("inspecting:");
    console.log(util.inspect(value, { showHidden: true, depth: null }));
}

function assert(value){
    return treeToImp(value, "", 0, true).join("\n");
}

function treeToImp(tree, path, depth, negate){
    if(isSym(tree)){ tree = unproxy(tree, symKey).tree; }
    if(tree.type != "Node"){ //if your on a leaf print the end of a line
        if(negate){
            return [ "(assert "+path+" (not "+getValue(tree)+")" + getCloseParens(depth) + ")"];
        }else{
            return [ "(assert "+path+" "+getValue(tree)+"" + getCloseParens(depth) + ")"];
        }
    } 
    else{ //if your on a node then that branch implies the leaves
        1+1;
        return treeToImp(tree.right, path + "(=> "+getValue(tree.test)+" ", depth+1, negate).concat(
               treeToImp(tree.left,  path + "(=> "+"(not "+getValue(tree.test)+") ", depth+1, negate));
    }
}

//helper for treeToImp
function getCloseParens(num){
    if(num<=0){ return ""; }
    else { return ")"+getCloseParens(num-1); }
}

//perform a unary op on target
//target is a tree not a proxy
function unaryOp(target, op){
    if(isSym(target)){ console.log("error proxies too deep"); }
    if(target.type=="Node"){
        return makeNode(target.test, unaryOp(target.left), unaryOp(target.right));
    }else if(target.type=="JSVal"){
        return unaryOps[op](target.value);
    }else if(target.type=="AExp"){
        return addUnary(target.value, op);
    }
}

//left and right should be trees not proxies
function binaryOp(left, right, op){
    if(isSym(left) || isSym(right)){ console.log("error proxies too deep"); }
    if(left==undefined || right == undefined){ console.log("we recursed too far?"); return undefined;}
    if(left.type == "Node"){ //recurse on left node
        var leftFinal = binaryOp(left.left, right, op);
        var rightFinal = binaryOp(left.right, right, op);
        return makeNode(left.test, leftFinal, rightFinal);
    }else if(right.type=="Node"){ //recurse on right node
        var leftFinal = binaryOp(left, right.left, op);
        var rightFinal = binaryOp(left, right.right, op);
        return makeNode(right.test, leftFinal, rightFinal);
    }else if(left.type==undefined && right.type==undefined){ //both are native leaves
        return binaryOps[op](left, right);
    }else{  //one is an aexp leafe
        var leftVal = getValue(left);
        var rightVal = getValue(right);
        return makeAexp("("+op+" "+leftVal + " " + rightVal+")");
    }
}

//make a tree for an assignment of the oldVal to newVal
//under the context stack
function makeTree(oldVal, newVal, cntxStack){
    if(cntxStack.length>1){ //if multiple contexts we must make a node
        if(cntxStack[cntxStack.length-1].type=="Node"){ //recurse on context
            return makeNode(cntxStack[cntxStack.length-1].test,
                makeNode(cntxStack[cntxStack.length-1].left, oldVal, makeTree(oldVal, newVal, cntxStack.slice(0, cntxStack.length-1) )),
                makeNode(cntxStack[cntxStack.length-1].right, oldVal, makeTree(oldVal, newVal, cntxStack.slice(0, cntxStack.length-1) ))
            );
        }else{ //context is a leaf
            return makeNode(cntxStack[cntxStack.length-1].value, oldVal, makeTree(oldVal, newVal, cntxStack.slice(0, cntxStack.length-1)));
        }
    } else{ //this is the last context
        if(cntxStack[0].type=="Node"){ //recurse on context
            var left = makeNode(cntxStack[0].left, oldVal, newVal );
            var right = makeNode(cntxStack[0].right, oldVal, newVal );
            return makeNode(cntxStack[0].test,left, right);
        }else{ //context is a leaf
            return makeNode(cntxStack[0].value, oldVal, newVal);
        }
    }
}

//compress a tree so it doesn't have duplicate branches
//todo - weed out false/true branches if the test is false/true
//todo - weed out branches and their inverse ie a<4 and not a<4
//       these are often created by if/else branches
//todo - call z3 to weed out impossible implications
function compressTree(tree, paths, choices){
    if(isSym(tree)){ console.log("error proxies too deep"); }
    if(tree==undefined){ return undefined; }
    if(tree.type=="Node"){
        if(paths.indexOf(tree.test)!=-1){ //if we've seen this path before make the same choice as last time
            if(choices[paths.indexOf(tree.test)]=="left"){ return compressTree(tree.left, paths, choices); }
            else{ return compressTree(tree.right, paths, choices); }
        }else{ //we haven't seen this path before so explore both subtrees
            return makeNode(tree.test,
              compressTree(tree.left,  push(paths, tree.test), push(choices, "left")),
              compressTree(tree.right, push(paths, tree.test), push(choices, "right")));
        }
    }else{ //a leaf can not be compressed
        return tree;
    }
}

//converts a tree to it's inverse for the else branches
function not(tree){
    if(isSym(tree)){ console.log("error proxies too deep"); }
    if(tree.type=="Node"){//recurse on both right and left
        return makeNode(tree.test, not(tree.left), not(tree.right));
    }else if(tree.type==undefined){
        return tree;
    }else{
        return makeAexp("("+"not "+tree.value+")");
    }
}

//functional push
function push(a, item){
    var tmp = a.slice(0);
    tmp.push(item);
    return tmp;
}

//gets the value from a leaf or the native value itself
//useful if you have an Aexp|native value -> native value
function getValue(o){
    if(o.value){ return o.value; }
    else{ return o; }
}

//is x a symbol?
function isSym(x){
        return !!unproxy(x, symKey);
}

//create a symbol with the given start tree
function symbolic(startTree) {
    var p = new Proxy(startTree , {
        tree: startTree,
        unary: function(target, op, operand) {
            return symbolic(compressTree(unaryOp(getUnproxy(target), op),[],[]));
        },
        left: function(target, op, right) {
           return symbolic(compressTree(binaryOp(getUnproxy(target), getUnproxy(right), op),[], []));
        },
        right: function(target, op, left) {
            //left should always recurse first so we should never have a left proxy when
            //evaluating a right hand proxy.
            if(isSym(left)){ console.log("ERROR: unexpected proxy on left"); }
            return symbolic(compressTree(binaryOp(left, getUnproxy(target), op),[],[]));
        },
        assign: function(ctx, left, right, assignThunk) {
            if (cntxStack.length!=0) {
               assignThunk(x => symbolic(compressTree(makeTree(getUnproxy(left), getUnproxy(right), cntxStack), [], [])));
            } else {
                assignThunk();
            }
        },
        branch: function(target, test, thenThunk, elseThunk) {
            //could use z3 to evaluate if both are possible but for now just
            //always do both
            var c = test();
            if(thenThunk){ cntxStack.push(getUnproxy(c)); thenThunk(); cntxStack.pop(); }

            if(elseThunk){ cntxStack.push(not(getUnproxy(c))); elseThunk(); cntxStack.pop(); }
        },
    }, symKey);
    return p;
}



//returns the tree or just the regular value
function getUnproxy(x){
    if(isSym(x)){ return unproxy(x,symKey).tree; }
    else{ return x; }
}


var x = symbolic(makeAexp("a"));
console.log(x);
if(x<4){
        x = 7;
}else{
    x = x - 1;
}
var y = x>=4;
inspect(getUnproxy(x));
inspect(getUnproxy(y));
console.log(assert(y));
//console.log(unproxy(x, symKey).tree);
//console.log("final result is "+toString(unproxy(y, symKey).tree));
//console.log("final result is "+toString(unproxy(x, symKey).tree));

