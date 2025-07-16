// Medium complexity - functions, loops, and scatter assignments
fn process_data({name, ?age = 18, @extra})
    for i in [1..10]
        data[i] = {
            name: name + tostr(i),
            age: age + i,
            extra: extra
        };
    endfor
    
    {first, second, @rest} = extra;
    parties = $system:get_parties(first, second);
    
    try
        result = parties[1]:process(data);
    except e (E_RANGE)
        result = {};
    endtry
    
    return result;
endfn

// Lambda expressions and comprehensions
let squares = {x * x for x in [1..100]};
let handler = {?code = E_NONE, @args} => handle(code, args);

// Complex expressions
value = ((a + b) * (c - d)) / (e || 1);
check = x > 5 && y < 10 || z == 0;