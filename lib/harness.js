var // vim: ts=4 sw=4
vvalues = function () {
    if (typeof require === 'function') {
        // importing patches Proxy to be in line with the new direct proxies
        require('harmony-reflect');
    }
    var // hold on to all the proxies we create so that we can retrieve the handlers later
    unproxyMap = new WeakMap();
    var oldProxy = Proxy;
    function ValueShell(value) {
        this.value = value;
    }
    ValueShell.prototype.valueOf = function () {
        return this.value;
    };
    function VProxy(value, handler, key) {
        var valueShell = new ValueShell(value);
        var val = function (a0) {
            if (a0 === void 0) {
                return valueShell;
            }
            if (a0 === null) {
                return valueShell;
            }
            if (typeof a0 !== 'object') {
                var x = a0;
                return valueShell;
            }
            return value;
        }.call(this, value);
        var p = new oldProxy(val, handler);
        unproxyMap.set(p, {
            handler: handler,
            key: key,
            target: val
        });
        return p;
    }
    this.Proxy = VProxy;
    function isVProxy(value) {
        return value && typeof value === 'object' && unproxyMap.has(value);
    }
    function unary(a0, a1) {
        if (// @ (Str, Any) -> Any
            isVProxy(a1)) {
            var operator = a0;
            var op = a1;
            var target = unproxyMap.get(op).target;
            return unproxyMap.get(op).handler.unary(target, operator, op);
        }
        if (a0 === '-') {
            var op = a1;
            return -op;
        }
        if (a0 === '+') {
            var op = a1;
            return +op;
        }
        if (a0 === '++') {
            var op = a1;
            return ++op;
        }
        if (a0 === '--') {
            var op = a1;
            return --op;
        }
        if (a0 === '!') {
            var op = a1;
            return !op;
        }
        if (a0 === '~') {
            var op = a1;
            return ~op;
        }
        if (a0 === 'typeof') {
            var op = a1;
            return typeof op;
        }
        if (a0 === 'void') {
            var op = a1;
            return void op;
        }
        throw new TypeError('No match');
    }
    function binary(a0, a1, a2) {
        if (// @ (Str, Any, Any) -> Any
            isVProxy(a1)) {
            var operator = a0;
            var left = a1;
            var right = a2;
            var target = unproxyMap.get(left).target;
            return unproxyMap.get(left).handler.left(target, operator, right);
        }
        if (isVProxy(a2)) {
            var operator = a0;
            var left = a1;
            var right = a2;
            var target = unproxyMap.get(right).target;
            return unproxyMap.get(right).handler.right(target, operator, left);
        }
        if (a0 === '*') {
            var left = a1;
            var right = a2;
            return left * right;
        }
        if (a0 === '/') {
            var left = a1;
            var right = a2;
            return left / right;
        }
        if (a0 === '%') {
            var left = a1;
            var right = a2;
            return left % right;
        }
        if (a0 === '+') {
            var left = a1;
            var right = a2;
            return left + right;
        }
        if (a0 === '-') {
            var left = a1;
            var right = a2;
            return left - right;
        }
        if (a0 === '>>') {
            var left = a1;
            var right = a2;
            return left >> right;
        }
        if (a0 === '<<') {
            var left = a1;
            var right = a2;
            return left << right;
        }
        if (a0 === '>>>') {
            var left = a1;
            var right = a2;
            return left >>> right;
        }
        if (a0 === '<') {
            var left = a1;
            var right = a2;
            return left < right;
        }
        if (a0 === '<=') {
            var left = a1;
            var right = a2;
            return left <= right;
        }
        if (a0 === '>') {
            var left = a1;
            var right = a2;
            return left > right;
        }
        if (a0 === '>=') {
            var left = a1;
            var right = a2;
            return left >= right;
        }
        if (a0 === 'in') {
            var left = a1;
            var right = a2;
            return left in right;
        }
        if (a0 === 'instanceof') {
            var left = a1;
            var right = a2;
            return left instanceof right;
        }
        if (a0 === '==') {
            var left = a1;
            var right = a2;
            return left == right;
        }
        if (a0 === '!=') {
            var left = a1;
            var right = a2;
            return left != right;
        }
        if (a0 === '===') {
            var left = a1;
            var right = a2;
            return left === right;
        }
        if (a0 === '!==') {
            var left = a1;
            var right = a2;
            return left !== right;
        }
        if (a0 === '&') {
            var left = a1;
            var right = a2;
            return left & right;
        }
        if (a0 === '^') {
            var left = a1;
            var right = a2;
            return left ^ right;
        }
        if (a0 === '|') {
            var left = a1;
            var right = a2;
            return left | right;
        }
        if (a0 === '&&') {
            var left = a1;
            var right = a2;
            return left && right;
        }
        if (a0 === '||') {
            var left = a1;
            var right = a2;
            return left || right;
        }
        throw new TypeError('No match');
    }
    function assign(ctx, left, right, assignThunk) {
        if (isVProxy(ctx) && unproxyMap.get(ctx).handler.assign) {
            return unproxyMap.get(ctx).handler.assign(ctx, left, right, assignThunk);
        } else if (isVProxy(left) && unproxyMap.get(left).handler.assign) {
            return unproxyMap.get(left).handler.assign(ctx, left, right, assignThunk);
        } else if (isVProxy(right) && unproxyMap.get(right).handler.assign) {
            return unproxyMap.get(right).handler.assign(ctx, left, right, assignThunk);
        }
        // No handler used if we made it here
        return assignThunk();
    }
    var ctxStack = [];
    function pushContext(x) {
        if (isVProxy(x)) {
            ctxStack.push(x);
            return true;
        }
        return false;
    }
    function popContext() {
        return ctxStack.pop();
    }
    function peekContext() {
        return ctxStack[ctxStack.length - 1];
    }
    function branch(cond, branchType, branches) {
        if (!isVProxy(cond))
            throw Exception('Branch called, but ' + cond + ' is not branchable');
        var target = unproxyMap.get(cond).target;
        let hndl = unproxyMap.get(cond).handler;
        if (hndl.branch) {
            return hndl.branch(target, branchType, branches);
        }
    }
    function isBranchable(v) {
        if (!isVProxy(v)) {
            return false;
        }
        return !!unproxyMap.get(v).handler.branch;
    }
    this.unproxy = function (value, key) {
        if (isVProxy(value) && unproxyMap.get(value).key === key) {
            return unproxyMap.get(value).handler;
        }
        return null;
    };
    return {
        unary: unary,
        binary: binary,
        assign: assign,
        branch: branch,
        pushContext: pushContext,
        popContext: popContext,
        peekContext: peekContext,
        isBranchable: isBranchable
    };
}();