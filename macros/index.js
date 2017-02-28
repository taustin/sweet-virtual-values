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
    rule { ($cond ...) { $body ...} } => {
        function exit() { } // by default no-op
        if (vvalues.test($cond..., cb => exit = cb)) {
            $body ...
            exit();
        }
    }
}

let = = macro {
    rule infix { $left:expr | $right:expr } => {
        //let ctx = vvalues.getContext();
        //vvalues.assign(ctx, $left, $right, (polisher) => {
        vvalues.assign($left, $right, (polisher) => {
            if (polisher) {
                $left = polisher($right);
            } else {
                $left = $right;
            }
        });
    }
}

