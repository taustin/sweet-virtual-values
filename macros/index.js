// vim: ts=4 sw=4
operator ++ 15 { $op }     => #{ vvalues.unary("++", $op) }
operator -- 15 { $op }     => #{ vvalues.unary("--", $op) }
operator ! 14 { $op }      => #{ vvalues.unary("!", $op) }
operator ~ 14 { $op }      => #{ vvalues.unary("~", $op) }
operator + 14 { $op }      => #{ vvalues.unary("+", $op) }
operator - 14 { $op }      => #{ vvalues.unary("-", $op) }
operator typeof 14 { $op } => #{ vvalues.unary("typeof", $op) }
operator void 14 { $op }   => #{ vvalues.unary("void", $op) }

operator * 13 left { $left, $right }          => #{ vvalues.binary("*", $left, $right) }
operator / 13 left { $left, $right }          => #{ vvalues.binary("/", $left, $right) }
operator % 13 left { $left, $right }          => #{ vvalues.binary("%", $left, $right) }
operator + 12 left { $left, $right }          => #{ vvalues.binary("+", $left, $right) }
operator - 12 left { $left, $right }          => #{ vvalues.binary("-", $left, $right) }
operator >> 11 left { $left, $right }         => #{ vvalues.binary(">>", $left, $right) }
operator << 11 left { $left, $right }         => #{ vvalues.binary("<<", $left, $right) }
operator >>> 11 left { $left, $right }        => #{ vvalues.binary(">>>", $left, $right) }
operator < 10 left { $left, $right }          => #{ vvalues.binary("<", $left, $right) }
operator <= 10 left { $left, $right }         => #{ vvalues.binary("<=", $left, $right) }
operator > 10 left { $left, $right }          => #{ vvalues.binary(">", $left, $right) }
operator >= 10 left { $left, $right }         => #{ vvalues.binary(">=", $left, $right) }
operator in 10 left { $left, $right }         => #{ vvalues.binary("in", $left, $right) }
operator instanceof 10 left { $left, $right } => #{ vvalues.binary("instanceof", $left, $right) }
operator == 9 left { $left, $right }          => #{ vvalues.binary("==", $left, $right) }
operator != 9 left { $left, $right }          => #{ vvalues.binary("!=", $left, $right) }
operator === 9 left { $left, $right }         => #{ vvalues.binary("===", $left, $right) }
operator !== 9 left { $left, $right }         => #{ vvalues.binary("!==", $left, $right) }
operator & 8 left { $left, $right }           => #{ vvalues.binary("&", $left, $right) }
operator ^ 7 left { $left, $right }           => #{ vvalues.binary("^", $left, $right) }
operator | 6 left { $left, $right }           => #{ vvalues.binary("|", $left, $right) }
operator && 5 left { $left, $right }          => #{ vvalues.binary("&&", $left, $right) }
operator || 4 left { $left, $right }          => #{ vvalues.binary("||", $left, $right) }


let if = macro {
    rule { ($cond ...) { $thnBody ...} else { $elsBody ...} } => {
        var c = $cond...;
        let pushedProxy = vvalues.pushContext(c);
        if (vvalues.isBranchable(c)) {
            var testThunk = function() { return c; };
            var thnThunk = function() {
                $thnBody...
                vvalues.popContext();
            };
            var elsThunk = function() {
                vvalues.pushContext(!c);
                $elsBody...
            };
            vvalues.branch(c, testThunk, thnThunk, elsThunk);
        } else if (c) {
            $thnBody...;
        } else {
            $elsBody...;
        }
        if (pushedProxy) vvalues.popContext();
    }
    rule { ($cond ...) { $body ...} } => {
        var c = $cond...;
        let pushedProxy = vvalues.pushContext(c);
        if (vvalues.isBranchable(c)) {
            var testThunk = function() { return c; };
            var bodyThunk = function() { $body... };
            vvalues.branch(c, testThunk, bodyThunk);
        } else if (c) {
            $body...;
        }
        if (pushedProxy) vvalues.popContext();
    }
}

macro while {
    rule { ($cond ...) { $body ...} } => {
        var condTest = function() { return $cond...; };
        var bodyThunk = function() {
            $body...
            if (condTest()) {
                bodyThunk();
            }
        };
        if (condTest()) {
            bodyThunk();
        }
    }
}

let = = macro {
    rule infix { $left:expr | $right:expr } => {
        let ctx = vvalues.peekContext();
        vvalues.assign(ctx, $left, $right, (polisher) => {
            if (polisher) {
                $left = polisher($right);
            } else {
                $left = $right;
            }
        });
    }
}

