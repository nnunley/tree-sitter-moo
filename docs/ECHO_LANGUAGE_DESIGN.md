# ECHO Language Design

**ECHO** - *Event-Centered Hybrid Objects*

A modern evolution of MOO that combines Wirthian principles, Self-like object model, Datalog queries, and event-driven programming while maintaining backward compatibility.

## Language Philosophy

ECHO represents the natural evolution of MOO for modern multi-user virtual environments. It preserves MOO's core teaching-friendly philosophy while adding powerful features for building sophisticated interactive systems.

### Core Principles

1. **Event-Centered**: Everything revolves around events and reactive patterns
2. **Hybrid Paradigms**: Seamlessly blends imperative, functional, and declarative programming
3. **Objects**: Self-like prototype-based inheritance with modern extensions
4. **Teaching-Friendly**: Maintains MOO's clarity and explicitness
5. **Backward Compatible**: All existing MOO code continues to work

### Design Goals

- **Simplicity**: Complex features implemented as libraries, not core syntax
- **Explicitness**: Clear, readable syntax following Wirthian principles  
- **Composability**: Features work together naturally
- **Performance**: Designed for cooperative multithreading and optimization
- **Extensibility**: Easy to add new capabilities without breaking changes

## Language Features

### 1. Enhanced Object Model

```echo
object Player extends $user
    property name = "Anonymous";
    property location (readable: true, writable: false);
    
    secure verb "move" (this none this, direction) requires CanMove(this, direction)
        let old_room = this.location;
        let new_room = old_room.(direction);
        
        if (new_room)
            this:move_to(new_room);
            emit PlayerMoved(this, old_room, new_room);
        endif
    endverb
endobject
```

### 2. Event-Driven Programming

```echo
// Event declaration
event PlayerMoved(player, from_room, to_room);

// Event handlers with conditions and modifiers
on PlayerMoved(player, from, to) where to == this.location throttle 500ms
    this:announce(player.name + " arrives.");
endon

// Event emission
emit PlayerMoved(player, old_room, new_room);
```

### 3. Datalog Queries

```echo
// Query declarations
query can_access(Player, Object) :-
    owner(Object, Player).

query can_access(Player, Object) :-
    permission(Object, Player, Level),
    Level >= "read".

query can_access(Player, Object) :-
    parent(Object, Parent),
    can_access(Player, Parent).

// Query usage
if (can_access(player, target_object))
    player:tell(target_object.description);
endif
```

### 4. Modern Binding System

```echo
// Unified destructuring syntax
let {name, ?age = 18, @skills} = player_data;
let handler = {event, ?priority = 1} => process_event(event, priority);
fn update_player(player, {health, ?mana = 100, @buffs}) ... endfn
```

### 5. Capabilities-Based Security

```echo
// Capability declarations
capability ReadProperty(object, property);
capability WriteProperty(object, property);
capability CallVerb(object, verb);

// Secure functions
secure fn get_sensitive_data(obj) requires ReadProperty(obj, "secrets")
    return obj.secrets;
endfn

// Capability grants
grant ReadProperty(#123, "name") to player;
```

### 6. LLM-Enhanced Verbs

```echo
verb "examine" (dobj none none) semantics(0.85)
    embeddings {
        "look at", "inspect", "check", "view", "observe"
    }
    if (!dobj)
        player:tell("Examine what?");
        return;
    endif
    
    player:tell(dobj.description || "You see nothing special.");
endverb
```

## ECHO Language Grammar (EBNF)

```ebnf
(* ========== PROGRAM STRUCTURE ========== *)

program = { declaration | statement } ;

declaration = variable_declaration
            | function_declaration  
            | object_declaration
            | verb_declaration
            | event_declaration
            | query_declaration
            | capability_declaration ;

(* ========== VARIABLE DECLARATIONS ========== *)

variable_declaration = ( "let" | "const" | "global" ) binding_pattern "=" expression ";" ;

binding_pattern = identifier
                | destructure_pattern ;

destructure_pattern = "{" [ binding_element { "," binding_element } ] "}" ;

binding_element = identifier
                | optional_binding
                | rest_binding ;

optional_binding = "?" identifier [ "=" expression ] ;

rest_binding = "@" identifier ;

(* ========== FUNCTION DECLARATIONS ========== *)

function_declaration = "fn" identifier "(" [ parameter_list ] ")" 
                      [ capability_requires ]
                      statement_block
                      "endfn" ;

parameter_list = binding_pattern { "," binding_pattern } ;

lambda_expression = binding_pattern "=>" expression ;

function_expression = "fn" "(" [ parameter_list ] ")" 
                     statement_block
                     "endfn" ;

(* ========== OBJECT DECLARATIONS ========== *)

object_declaration = "object" identifier [ "extends" expression ]
                    { object_member }
                    ( "endobject" | "endobj" ) ;

object_member = property_declaration
              | verb_declaration
              | capability_declaration ;

property_declaration = "property" identifier 
                      [ "(" property_options ")" ]
                      [ "=" expression ] ";" ;

property_options = property_option { "," property_option } ;

property_option = ( "readable" | "writable" | "protected" ) ":" boolean_literal ;

(* ========== VERB DECLARATIONS ========== *)

verb_declaration = [ "secure" ] "verb" string_literal 
                  "(" verb_signature ")"
                  [ capability_requires ]
                  [ semantics_annotation ]
                  statement_block
                  "endverb" ;

verb_signature = expression expression expression ;

semantics_annotation = "semantics" "(" number_literal ")"
                      [ "embeddings" embedding_block ] ;

embedding_block = "{" string_literal { "," string_literal } "}" ;

(* ========== EVENT SYSTEM ========== *)

event_declaration = "event" identifier "(" [ parameter_list ] ")" ";" ;

event_handler = "on" event_pattern [ event_condition ] [ event_modifiers ]
               statement_block
               "endon" ;

event_pattern = identifier "(" [ parameter_list ] ")" ;

event_condition = "where" expression ;

event_modifiers = event_modifier { event_modifier } ;

event_modifier = "throttle" time_literal
               | "debounce" time_literal
               | "buffer" time_literal
               | "priority" number_literal ;

emit_statement = "emit" identifier "(" [ argument_list ] ")" ";" ;

(* ========== DATALOG QUERIES ========== *)

query_declaration = "query" query_head ":-" query_body ";" ;

query_head = identifier "(" [ term_list ] ")" ;

query_body = query_term { "," query_term } ;

query_term = atom
           | comparison
           | negation
           | built_in_predicate ;

atom = identifier "(" [ term_list ] ")" ;

comparison = term comparison_operator term ;

comparison_operator = "==" | "!=" | "<" | ">" | "<=" | ">=" | "=" ;

negation = "not" query_term ;

term = identifier 
     | literal
     | variable ;

variable = identifier ; (* Variables start with uppercase *)

term_list = term { "," term } ;

query_expression = "query" query_head [ ":-" query_body ] ;

(* ========== CAPABILITY SYSTEM ========== *)

capability_declaration = "capability" identifier "(" [ parameter_list ] ")" ";" ;

capability_requires = "requires" capability_list ;

capability_list = capability_ref { "," capability_ref } ;

capability_ref = identifier "(" [ argument_list ] ")" ;

grant_statement = "grant" capability_ref "to" expression ";" ;

(* ========== STATEMENTS ========== *)

statement = expression_statement
          | assignment_statement
          | if_statement
          | while_statement  
          | for_statement
          | try_statement
          | break_statement
          | continue_statement
          | return_statement
          | pass_statement
          | fork_statement
          | emit_statement
          | grant_statement
          | event_handler
          | statement_block ;

statement_block = "{" { statement } "}" ;

expression_statement = expression ";" ;

assignment_statement = lvalue "=" expression ";" ;

lvalue = identifier
       | property_access
       | index_access
       | binding_pattern ;

if_statement = "if" "(" expression ")" statement_block
              { "elseif" "(" expression ")" statement_block }
              [ "else" statement_block ]
              "endif" ;

while_statement = "while" [ identifier ] "(" expression ")" 
                 statement_block 
                 "endwhile" ;

for_statement = "for" binding_pattern "in" "(" expression ")"
               statement_block
               "endfor" ;

try_statement = "try" statement_block
               { except_clause }
               [ finally_clause ]
               "endtry" ;

except_clause = "except" [ identifier ] "(" error_list ")"
               statement_block ;

finally_clause = "finally" statement_block ;

error_list = error_code { "," error_code } ;

error_code = identifier | "ANY" ;

break_statement = "break" [ identifier ] ";" ;

continue_statement = "continue" [ identifier ] ";" ;

return_statement = "return" [ expression ] ";" ;

pass_statement = "pass" [ "(" [ argument_list ] ")" ] ";" ;

fork_statement = "fork" identifier "(" expression ")"
                statement_block
                "endfork" ;

(* ========== EXPRESSIONS ========== *)

expression = conditional_expression ;

conditional_expression = logical_or_expression 
                        [ "?" expression ":" expression ] ;

logical_or_expression = logical_and_expression 
                       { "||" logical_and_expression } ;

logical_and_expression = in_expression 
                        { "&&" in_expression } ;

in_expression = equality_expression 
               [ "in" equality_expression ] ;

equality_expression = relational_expression 
                     { ( "==" | "!=" ) relational_expression } ;

relational_expression = additive_expression 
                       { ( "<" | ">" | "<=" | ">=" ) additive_expression } ;

additive_expression = multiplicative_expression 
                     { ( "+" | "-" ) multiplicative_expression } ;

multiplicative_expression = unary_expression 
                           { ( "*" | "/" | "%" ) unary_expression } ;

unary_expression = [ ( "!" | "-" | "+" ) ] postfix_expression ;

postfix_expression = primary_expression 
                    { postfix_operator } ;

postfix_operator = property_access
                 | index_access
                 | slice_access  
                 | method_call
                 | function_call ;

property_access = "." identifier
                | "." "(" expression ")" ;

index_access = "[" expression "]" ;

slice_access = "[" [ expression ] ".." [ expression ] "]" ;

method_call = ":" identifier "(" [ argument_list ] ")" ;

function_call = "(" [ argument_list ] ")" ;

primary_expression = identifier
                   | literal
                   | object_reference
                   | system_property
                   | parenthesized_expression
                   | lambda_expression
                   | function_expression
                   | list_literal
                   | map_literal
                   | flyweight_literal
                   | list_comprehension
                   | try_expression
                   | query_expression ;

parenthesized_expression = "(" expression ")" ;

try_expression = "`" expression "!" error_list "=>" expression "'" ;

argument_list = expression { "," expression } ;

(* ========== LITERALS ========== *)

literal = number_literal
        | string_literal
        | boolean_literal
        | symbol_literal ;

number_literal = integer_literal | float_literal ;

integer_literal = digit { digit } ;

float_literal = digit { digit } "." digit { digit } 
              [ ( "e" | "E" ) [ "+" | "-" ] digit { digit } ] ;

string_literal = '"' { string_character } '"' ;

string_character = escape_sequence | ( ? any character except '"' and '\' ? ) ;

escape_sequence = "\" ( "n" | "t" | "r" | "\" | '"' | "'" ) ;

boolean_literal = "true" | "false" ;

symbol_literal = "'" identifier ;

time_literal = number_literal ( "ms" | "s" | "m" | "h" | "d" ) ;

object_reference = "#" ( integer_literal | string_literal ) ;

system_property = "$" identifier ;

(* ========== COLLECTION LITERALS ========== *)

list_literal = "{" [ expression_list ] "}" ;

map_literal = "[" [ map_entry_list ] "]" ;

map_entry_list = map_entry { "," map_entry } ;

map_entry = expression "->" expression ;

flyweight_literal = "<" expression "," list_literal "," list_literal ">" ;

list_comprehension = "{" expression "for" binding_pattern "in" "(" expression ")"
                    [ "if" "(" expression ")" ] "}" ;

expression_list = expression { "," expression } ;

(* ========== LEXICAL ELEMENTS ========== *)

identifier = letter { letter | digit | "_" } ;

letter = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" |
         "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z" |
         "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" |
         "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z" ;

digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;

(* Comments *)
comment = "//" { ? any character except newline ? } newline
        | "/*" { ? any character ? } "*/" ;

(* Whitespace *)
whitespace = " " | "\t" | "\n" | "\r" ;
```

## Key Innovations

### 1. Unified Binding System
One syntax for all parameter passing:
- Destructuring assignments: `let {x, y} = point;`
- Lambda parameters: `{x, y} => x + y`
- Function parameters: `fn distance({x1, y1}, {x2, y2}) ...`

### 2. Natural Event Integration
Events feel like native language constructs:
- Clear declaration syntax
- Condition-based filtering  
- Built-in rate limiting and timing controls
- Composable with other language features

### 3. Datalog for Relationships
Declarative queries over the object graph:
- Express complex relationships naturally
- Automatic optimization and indexing
- Integrates with event conditions
- Respects MOO's permission model

### 4. Capabilities-Based Security
Fine-grained security without complexity:
- Explicit capability requirements
- Automatic enforcement
- Composable permissions
- Backward compatible with existing code

### 5. LLM-Enhanced Commands
Natural language interfaces:
- Semantic verb matching
- Embedding-based command resolution
- Maintains verb inheritance
- Optional enhancement, not required

## Implementation Strategy

### Phase 1: Core Language
- Basic ECHO parser and runtime
- Object model and inheritance
- Event system foundation
- Backward compatibility with MOO

### Phase 2: Query System  
- Datalog query engine
- Integration with object graph
- Query optimization
- Permission-aware queries

### Phase 3: Advanced Features
- Capabilities-based security
- LLM integration
- Reactive programming libraries
- Performance optimizations

### Phase 4: Ecosystem
- Development tools
- Standard libraries
- Migration utilities
- Documentation and tutorials

## Backward Compatibility

ECHO is designed as a strict superset of MOO. All existing MOO code will run unchanged in ECHO environments. New features are additive and optional.

### Migration Path
1. **Drop-in Replacement**: Existing MOO code runs as-is
2. **Gradual Enhancement**: Add new features incrementally
3. **Modern Patterns**: Adopt event-driven and declarative patterns
4. **Full ECHO**: Leverage all language capabilities

## Conclusion

ECHO represents the natural evolution of MOO for modern interactive systems. By combining proven concepts from multiple paradigms while maintaining MOO's core simplicity, ECHO provides a powerful platform for building sophisticated multi-user virtual environments.

The language balances teaching-friendly syntax with advanced capabilities, ensuring that both beginners and experts can be productive while building systems that scale from simple educational environments to complex virtual worlds.