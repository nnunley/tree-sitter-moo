// Complex MOO code - nested structures and heavy operations
object $complex_system
    property handlers = []
    property cache = [1 -> "one", 2 -> "two", 3 -> "three"]
    
    verb process_request(this none this)
        {method, params, @extra} = args;
        
        // Nested loops and conditions
        for handler in this.handlers
            for i in [1..length(params)]
                if (handler:can_handle(method, params[i]))
                    try
                        result = handler:process({
                            method: method,
                            param: params[i],
                            context: {
                                user: caller,
                                perms: callers()[2][3],
                                time: time(),
                                extra: extra
                            }
                        });
                        
                        // Complex nested expression
                        score = ((result.quality * 100) + (result.speed * 50)) / 
                                (result.errors > 0 ? result.errors : 1);
                        
                        if (score > this.threshold)
                            return result;
                        endif
                    except e (E_INVARG, E_TYPE, E_RANGE)
                        this:log_error({
                            handler: handler,
                            error: e,
                            context: {method, params, extra}
                        });
                    endtry
                endif
            endfor
        endfor
        
        // Fallback with comprehension
        fallback_results = {
            handler:fallback(method, params) 
            for handler in this.handlers
        };
        
        // Complex scatter and reassignment
        {best, @others} = $list_utils:sort_by_score(fallback_results);
        
        return best || {success: false, reason: "No handler available"};
    endverb
    
    verb benchmark_operations(this none this)
        // String operations
        text = "Hello, " + player.name + "!";
        parts = $string_utils:explode(text, " ");
        
        // List operations with scatter
        {first, second, third, @rest} = parts;
        recombined = {first, second, third, @rest};
        
        // Map operations
        translations = [];
        for word in parts
            translations[word] = $translator:translate(word, "es");
        endfor
        
        // Bitwise operations
        flags = 0b1010 |. 0b0101;
        masked = flags &. 0b1100;
        shifted = masked << 2;
        
        // Try expressions
        safe_value = `player.inventory[5] ! E_RANGE => {}';
        validated = `$validator:check(safe_value) ! ANY => false';
        
        // Function expressions
        let processor = fn(data)
            return data * 2 + 1;
        endfn;
        
        // Flyweight creation
        enhanced = <this, [score -> 100], {processor, validated}>;
        
        return {
            text: text,
            parts: parts,
            translations: translations,
            flags: shifted,
            enhanced: enhanced
        };
    endverb
endobject