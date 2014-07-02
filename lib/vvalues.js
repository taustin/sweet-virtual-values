// 
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./sweet'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('sweet.js'));
    } else {
        root.returnExports = factory(root['sweet']);
    }
}(this, function (sweet) {
    'use strict';
    function compile(code) {
        var macroStr = 'operator ++ 15 { $op }     => #{ vvalues.unary("++", $op) }\noperator -- 15 { $op }     => #{ vvalues.unary("--", $op) }\noperator ! 14 { $op }      => #{ vvalues.unary("!", $op) }\noperator ~ 14 { $op }      => #{ vvalues.unary("~", $op) }\noperator + 14 { $op }      => #{ vvalues.unary("+", $op) }\noperator - 14 { $op }      => #{ vvalues.unary("-", $op) }\noperator typeof 14 { $op } => #{ vvalues.unary("typeof", $op) }\noperator void 14 { $op }   => #{ vvalues.unary("void", $op) }\n\noperator * 13 left { $left, $right }          => #{ vvalues.binary("*", $left, $right) }\noperator / 13 left { $left, $right }          => #{ vvalues.binary("/", $left, $right) }\noperator % 13 left { $left, $right }          => #{ vvalues.binary("%", $left, $right) }\noperator + 12 left { $left, $right }          => #{ vvalues.binary("+", $left, $right) }\noperator - 12 left { $left, $right }          => #{ vvalues.binary("-", $left, $right) }\noperator >> 11 left { $left, $right }         => #{ vvalues.binary(">>", $left, $right) }\noperator << 11 left { $left, $right }         => #{ vvalues.binary("<<", $left, $right) }\noperator >>> 11 left { $left, $right }        => #{ vvalues.binary(">>>", $left, $right) }\noperator < 10 left { $left, $right }          => #{ vvalues.binary("<", $left, $right) }\noperator <= 10 left { $left, $right }         => #{ vvalues.binary("<=", $left, $right) }\noperator >= 10 left { $left, $right }         => #{ vvalues.binary(">", $left, $right) }\noperator > 10 left { $left, $right }          => #{ vvalues.binary(">=", $left, $right) }\noperator in 10 left { $left, $right }         => #{ vvalues.binary("in", $left, $right) }\noperator instanceof 10 left { $left, $right } => #{ vvalues.binary("instanceof", $left, $right) }\noperator == 9 left { $left, $right }          => #{ vvalues.binary("==", $left, $right) }\noperator != 9 left { $left, $right }          => #{ vvalues.binary("!=", $left, $right) }\noperator === 9 left { $left, $right }         => #{ vvalues.binary("===", $left, $right) }\noperator !== 9 left { $left, $right }         => #{ vvalues.binary("!==", $left, $right) }\noperator & 8 left { $left, $right }           => #{ vvalues.binary("&", $left, $right) }\noperator ^ 7 left { $left, $right }           => #{ vvalues.binary("^", $left, $right) }\noperator | 6 left { $left, $right }           => #{ vvalues.binary("|", $left, $right) }\noperator && 5 left { $left, $right }          => #{ vvalues.binary("&&", $left, $right) }\noperator || 4 left { $left, $right }          => #{ vvalues.binary("||", $left, $right) }\n\n\n\n\n';
        var harnessStr = 'var vvalues = function () {\n        if (typeof require === \'function\') {\n            // importing patches Proxy\n            require(\'harmony-reflect\');\n        }\n        var unproxy = new WeakMap();\n        var oldProxy = Proxy;\n        // @ (Any, {}) -> VProxy\n        function VProxy(value, handler) {\n            function ValueShell(value$2) {\n                this.value = value$2;\n            }\n            ValueShell.prototype.valueOf = function () {\n                return this.value;\n            };\n            var valueShell = new ValueShell(value);\n            var val = function (a0) {\n                    if (a0 === void 0) {\n                        return valueShell;\n                    }\n                    if (a0 === null) {\n                        return valueShell;\n                    }\n                    if (typeof a0 !== \'object\') {\n                        var x = a0;\n                        return valueShell;\n                    }\n                    return value;\n                }.call(this, value);\n            var p = new oldProxy(val, handler);\n            unproxy.set(p, handler);\n            return p;\n        }\n        this.Proxy = VProxy;\n        // @ (Any) -> Bool\n        function isVProxy(value) {\n            return value && typeof value === \'object\' && unproxy.has(value);\n        }\n        // @ (Str, Any) -> Any\n        function unary(a0, a1) {\n            if (isVProxy(a1)) {\n                var operator = a0;\n                var op = a1;\n                return unproxy.get(op).unary(operator, op);\n            }\n            if (a0 === \'-\') {\n                var op = a1;\n                return -op;\n            }\n            if (a0 === \'+\') {\n                var op = a1;\n                return +op;\n            }\n            if (a0 === \'++\') {\n                var op = a1;\n                return ++op;\n            }\n            if (a0 === \'--\') {\n                var op = a1;\n                return --op;\n            }\n            if (a0 === \'!\') {\n                var op = a1;\n                return !op;\n            }\n            if (a0 === \'~\') {\n                var op = a1;\n                return ~op;\n            }\n            if (a0 === \'typeof\') {\n                var op = a1;\n                return typeof op;\n            }\n            if (a0 === \'void\') {\n                var op = a1;\n                return void op;\n            }\n            throw new TypeError(\'No match\');\n        }\n        // @ (Str, Any, Any) -> Any\n        function binary(a0, a1, a2) {\n            if (isVProxy(a1)) {\n                var operator = a0;\n                var left = a1;\n                var right = a2;\n                return unproxy.get(left).left(operator, right);\n            }\n            if (isVProxy(a2)) {\n                var operator = a0;\n                var left = a1;\n                var right = a2;\n                return unproxy.get(right).right(operator, left);\n            }\n            if (a0 === \'*\') {\n                var left = a1;\n                var right = a2;\n                return left * right;\n            }\n            if (a0 === \'/\') {\n                var left = a1;\n                var right = a2;\n                return left / right;\n            }\n            if (a0 === \'%\') {\n                var left = a1;\n                var right = a2;\n                return left % right;\n            }\n            if (a0 === \'+\') {\n                var left = a1;\n                var right = a2;\n                return left + right;\n            }\n            if (a0 === \'-\') {\n                var left = a1;\n                var right = a2;\n                return left - right;\n            }\n            if (a0 === \'>>\') {\n                var left = a1;\n                var right = a2;\n                return left >> right;\n            }\n            if (a0 === \'<<\') {\n                var left = a1;\n                var right = a2;\n                return left << right;\n            }\n            if (a0 === \'>>>\') {\n                var left = a1;\n                var right = a2;\n                return left >>> right;\n            }\n            if (a0 === \'<\') {\n                var left = a1;\n                var right = a2;\n                return left < right;\n            }\n            if (a0 === \'<=\') {\n                var left = a1;\n                var right = a2;\n                return left <= right;\n            }\n            if (a0 === \'>\') {\n                var left = a1;\n                var right = a2;\n                return left > right;\n            }\n            if (a0 === \'>=\') {\n                var left = a1;\n                var right = a2;\n                return left >= right;\n            }\n            if (a0 === \'in\') {\n                var left = a1;\n                var right = a2;\n                return left in right;\n            }\n            if (a0 === \'instanceof\') {\n                var left = a1;\n                var right = a2;\n                return left instanceof right;\n            }\n            if (a0 === \'==\') {\n                var left = a1;\n                var right = a2;\n                return left == right;\n            }\n            if (a0 === \'!=\') {\n                var left = a1;\n                var right = a2;\n                return left != right;\n            }\n            if (a0 === \'===\') {\n                var left = a1;\n                var right = a2;\n                return left === right;\n            }\n            if (a0 === \'!==\') {\n                var left = a1;\n                var right = a2;\n                return left !== right;\n            }\n            if (a0 === \'&\') {\n                var left = a1;\n                var right = a2;\n                return left & right;\n            }\n            if (a0 === \'^\') {\n                var left = a1;\n                var right = a2;\n                return left ^ right;\n            }\n            if (a0 === \'|\') {\n                var left = a1;\n                var right = a2;\n                return left | right;\n            }\n            if (a0 === \'&&\') {\n                var left = a1;\n                var right = a2;\n                return left && right;\n            }\n            if (a0 === \'||\') {\n                var left = a1;\n                var right = a2;\n                return left || right;\n            }\n            throw new TypeError(\'No match\');\n        }\n        // @ (Any) -> {} or null\n        var vunproxy = function (value) {\n            if (isVProxy(value)) {\n                return unproxy.get(value);\n            }\n            return null;\n        };\n        this.unproxy = vunproxy;\n        return {\n            unary: unary,\n            binary: binary\n        };\n    }();';
        var expanded = sweet.compile(macroStr + '\n' + code);
        return harnessStr + '\n' + expanded.code;
    }
    return { compile: compile };
}));