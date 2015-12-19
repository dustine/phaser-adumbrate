# Assets
## plot.json
This file contains the whole plot (as in, script) of the game, in all of its possible states. So there's a lot to be told about how it's formatted, so the game doesn't just crash while loading.

The main JSON object is a collection of JavaScript objects, with the following structure:

~~~~json
{
    "version": "0.0.4",
    "state 1": {},
    "state 2": {},
    "and so on": {},
}
~~~~

- **version**: The version of the Plot.json file, correspondent to the game version, following Semver syntax. If they don't match, the game just up and crashes, I guess.
- **state 1, state 2, ...**: The list of the several game story states which we'll be calling up and parse on the go during the game. The name of the object that contains the state is the state's *key*, which the game engine will use to call the plot segment. *Caution on having to use clear and understandable keys*, ok?

Now, these states won't be empty objects (and probably won't be in the final version of this file). They'll, themselves, follow the following possible structures:

~~~~json
"state 1": {
    "key": "state 1",
    "text": "%s0000%This is the story
    Of how my world got turned upside down
    %c0000%Yada yada%e%",
    "colors": ["green"],
    "scripts": [
        {
            "key": "playSong0",
            "args": [""]
        }],
    "end": {
        "type": "forced",
        "key": "i'm sick of the song now"
    }
}
~~~~

Well, it's a lot of stuff here. Let's go by parts:
- **key**: Just a repeat of the state's name, just in case
- **text**: The main part of the story state, a huge string that'll be the text that will be printed on the game console. Now, this text isn't just pasted in, there's a bit of parsing first. I'll talk more about this later, but just take notion of the ``%c0000%`` and any other text tidbits that start and end with an percentage
- **colors** and **scripts**: Related to the parsing, described bellow. They're always arrays.
- **end**: When a state finishes, SOMETHING must happen, if not to know where to proceed! There's a lot of state enders, and they're described [bellow](#Endings).

### Text parsing
(Did you see what I did there?)

So, to prevent the game from being a wash of white, it's a good idea to spice stuff up while the text's rolling. Parsing fills this void.

The way parsing goes, when the text parser finds a substring within a word that is encased in percentage symbols, from now on called command prompts. The text parser doesn't ever print the command and instead it does some extra logic *after* printing the word. As such, the sequence of events are as follows:
1. Parser processes the current word character (something delimitated by whitespace or line breaks);
2. Parser detects a command thingy, that is delimitated with %percentages%;
3. Parser prints the word and/or characters without any of the special command thingies;
4. Parser only then follows the commands, in the order they were printed in the word.

This prevents any further mess-ups with logic running before the word is fully printed or not.

Command prompts follow this structure: ``%code0000%``.

The **code** part identifies the kind of command prompt it is, and it's always composed of non-number and non-empty characters of any non-zero length.

The string of numbers (``0`` but it can be any string of digits) after are an **identifier** for additional logic. A sometimes command prompts require some extra data, this allows the text parser to check the state for additional, and the identifier being the index on the correspondent data array. As an example,

There are **4** commands as we stand now:
#### c
````json
%c0%
````
**c**, standing for *color*, colours **all** following text with the colour string identified in the ***colours*** *data array*. This colour string can be whatever Phaser, and henceforth, CSS1 can handle: from "<span style="color: blue">blue</span>" to "<span style="color: #ff3300">#ff3300</span>".

So as an example, if you have the following:
````json
{
    "text": "this is a %c0001%weird %c0003%pretty %c0000%thing",
    "colors": ["green", "#456789", "yellow", "#0cc"]
}
````

You'd get as a result "this is a <span style="color: #456789">weird </span><span style="color: #0cc">pretty </span><span style="color: green">thing</span>".

#### e
````json
%e%
````
**e** clears all previous text format to a default one. This is useful because the way the parser is set now, not even a state change will clear the current format. Sorry.

#### s
````json
%s0%
````
**s** stands for **script** and allows to run a script (a custom function coded inside the game in their own function array). No ``eval()`` here though, all you're able to do is call functions by name and, optionally, feed arguments too. This command prompt also uses an index identifier for the ***scripts*** *data array*, which is a list of objects with a certain syntax.

So let's use an example to better explain how script objects work, alright?
````json
"scripts": [{
    "key": "beep"
    },{
    "key": "annoyPlayerWithPopups",
    "args": [1, "two", {"three": true}],
    "pause": true
    }]
````
- **key** is the string used to identify the script internally
- **args** *[optional]* is an array of the arguments fed to the function when called dynamically
- **pause** *[optional, defaults to ***false***]* is a Boolean value that tells the Text Parser whenever it should suspend text flow. If so, the script has to eventually tell the text parser it can continue later on, or the game risks never resuming (whoops). Defaults to ``false``.

#### %
````json
%%%
````
Basically an escape code to put a % in the actual text. The only command prompt that is processed before the text, as it requires manipulating the text before showing it to the user.

### Endings
Here's an example end field:
````json
"end": {
    "type": "script",
    "script": {
        "key": "doAThing"
    }
}
````

This is probably one of the simpler ending objects, but it shows the required structure for them:
- A **type** field, to say what information and behaviour this ending has;
- And that respective extra information, in this case just another field called *state*.

So to understand endings, we need to go through each of the kinds of them, one by one. What the text parser does is that exact same thing. Anyway, the types:

#### script
````json
"end": {
    "type": "script",
    "script": {
        "key": "playMinigame",
        "args": ["wonderland"]
    }
}
````
Instead of jumping to another story state, the Text Parser closes itself and then runs the script described by the [script object above](#s). The **pause** field is ignored as, for all effects, the text is always paused as it, um, ran out.

#### choice
````json
"end": {
    "type": "choice",
    "choices": [{
        "key": "get dust",
        "text": "Pick up object"
        },{
        "key": "summon fairy",
        "text": "Play the ocarina",
        "color": "blue",
        "valid": {
            "key": "hasObject",
            "args": ["ocarina"]
        }
    }]
}
````
Probably the most common ending kind, this one gives the user a list of options to choose from. And as such, the logic is to have a field called **choices** that contains a list of all these choices, represented as state objects. Now, these state objects follow the following syntax:
- **key** is the key for the story state that'll follow from picking this option;
- **text** will be the text present in the option button;
- **color** *[optional]* will colour the text on the button using the code;
- **valid** *[optional]* is an script object. If the function returns a falsify value, the option is hidden from the player. Because the text is finished by now, the **pause** field is ignored.

#### forced
````json
"end": {
    "type": "forced",
    "states": [{
        "key": "get dust",
        },{
        "key": "summon fairy",
        "valid": {
            "key": "hasObject",
            "args": ["ocarina"]
        }
    }]
}
````
Silently picks a story state change from the list of [state objects](#choice). If there's more than one valid option, the choice is random between these valid options. Because the list of states is never present to the user, the **text** and **color** fields are ignored.
