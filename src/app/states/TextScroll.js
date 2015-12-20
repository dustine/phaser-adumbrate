/*
 * TextScroll state
 *
 * Displays a part of the script until user input is required
 */


export default class TextScroll extends Phaser.State {
  init () {
    // TODO: Stub
    // Add the scripts to run when the scenes call for them
    let that = this;
    this.colors = {
      choiceText: 'rgb(53, 145, 252)',
      choiceGui: 'rgb(131, 189, 255)'
    };
    this.flags = {

    };
    this.scripts = {
      addBreadcrumb: () => {
        // adds previous scene into the breadcrump
        // a recallable stack-like structure so scene backtracking is possible
        this.breadcrumb.push(this.totalBreadcrumb);
      },
      addCursor: () => {
        // adds the input cursor with pretty colours
        that.text.addColor(that.colors.choiceGui, that.text.text.length);
        that.text.text += '\n> ';
        that.text.addColor(that.colors.choiceText, that.text.text.length);
      },
      addColor: (color, location = -1) => {
        // adds the specified color right where the user asked
        if (location < 0) location = that.text.text.length;
        that.text.addColor(color, location);
      },
      addSystemColor: (color, location = -1) => {
        // adds the specified color, from the this.colors, as requested
        that.addColor(that.colors[color], location);
      },
      getMemory: (key) => {
        // returns the stored memory (local storage file)
        if (localStorage[key] === undefined) {
          // if there's no value stored, you kinda want it to be considered a falsy value
          return undefined;
        }
        return JSON.parse(localStorage[key]);
      },
      isMemory: (key, value) => {
        // tests if the stored matches matches the given value
        if (localStorage[key] === undefined) {
          // if there's no value stored, you kinda want it to be considered a falsy value
          return value == null;
        }
        let storedValue = JSON.parse(localStorage[key]);
        return storedValue === value;
      },
      resetFormat: () => {
        // removes any runaway formattation from previours
        // due to engine limitations, this limits itself just to text colour
        that.text.addColor('#ffffff', that.text.text.length);
      },
      setFlag: (key, value) => {
        // sets an internal flag to this value
        // TODO: the whole memory thing ._.
        this.flags[key] = value;
      },
      setMemory: (key, value) => {
        // sets a MEMORY (local storage key) to this value
        localStorage[key] = JSON.stringify(value);
      },

      // story scripts
      fakeInput: () => {
        // fakes that the game has an input system, but then gut-punches the user on it
        let added = false;
        // add the '> ' with the right colours
        that.textTimer.start();
        this.scripts.addCursor();
        let minTextLength = that.text.text.length;
        let waitCursor = that.textTimer.loop(500, ()=>{
          if (added) {
            // remove the last 2 chars
            that.text.text = that.text.text.substring(0, that.text.text.length - 1);
          } else {
            that.text.text += '_';
          }
          added = !added;
        });

        let removeWaitCursor = () => {
          that.textTimer.remove(waitCursor);
          if (added) {
            added = false;
            that.text.text = that.text.text.substring(0, that.text.text.length - 1);
          }
        };

        let input = '';
        let timedOut = false;

        let removeOtherFakeouts;
        // choose the next scene depending on the user input
        let fakeout = function () {
          removeOtherFakeouts();

          if (input === '') {
            if (!timedOut) that.runScene('fake input: speedy blank');
            else that.runScene('fake input: blank');
          } else if (timedOut) {
            that.runScene('fake input: normal');
          } else {
            that.runScene('fake input: speedy normal');
          }
        };

        // count a click as a submit input, as well
        let fakeoutClick = that.input.onTap.addOnce(fakeout, that);

        // add enter support (ends it)
        that.input.keyboard.addKey(Phaser.KeyCode.ENTER)
          .onDown.addOnce(fakeout, that);

        // now set the keyboard as an input
        that.input.keyboard.addCallbacks(that, null, null, (key) => {
          removeWaitCursor();
          // add the character
          that.text.text += key;

          // add text input for further characters
          that.input.keyboard.addCallbacks(that, null, null, (key) => {
            input += key;
            that.text.text += key;
          });
          // add backspace support
          that.input.keyboard.addKey(Phaser.KeyCode.BACKSPACE)
            .onDown.add(() => {
              // we can't let it delete forever
              if (that.text.text.length > minTextLength)
                that.text.text = that.text.text.substring(0, that.text.text.length - 1);
            }, that);
        });

        // finally, set a timeout of 2 seconds to cancel input anyway
        let fakeoutTimer = that.textTimer.add(2000, ()=>{
          timedOut = true;
          fakeout();
        });

        // and add a way to avoid fakeout racing
        removeOtherFakeouts = function () {
          fakeoutClick.detach();
          that.textTimer.remove(fakeoutTimer);
          that.input.keyboard.onPressCallback = null;
          that.input.keyboard.reset();

          removeWaitCursor();
          that.scripts.resetFormat();
        };
      }

    };
    this.totalBreadcrumb = [];
    this.breadcrumb = [];
  }

  preload () {
    // TODO: Stub
  }

  create () {
    // TODO: Stub
    // this.game.input.onDown.addOnce(() => {
    //   this.text.fontSize = 16;
    //   this.game.input.onDown.addOnce(() => {
    //     this.text.fontSize = '16pt';
    //   });
    // });
    this.plot = this.cache.getJSON('plot');

    // add the scrolling text, bounded to itself
    this.text = this.add.text(10, 10,'',
      {
        font: '16pt Raleway',
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: this.world.width,
        // backgroundColor: 'cyan',
        boundsAlignH: 'left',
        boundsAlignV: 'bottom'
      });
    // this.text.anchor.x = 0;
    // this.text.anchor.y = 1;
    this.text.setTextBounds(0, 0, this.world.width - 20, this.world.height - 20);

    this.textTimer = this.game.time.create(false);
    this.runScene('start of the game');
  }

  update () {
    // TODO: Stub
  }

  enableTextSkip () {
    this.isTextSkipped = false;
    this.textSkipEvent = this.input.onTap.addOnce(()=> {
      this.isTextSkipped = true;
    }, this);
  }

  // runs a specific scene
  runScene (key, start='\n\n') {
    let scene = this.plot[key];
    let iterator = this.parse(scene);
    // enables the option of skipping
    // TODO: make this conditional?
    this.enableTextSkip();

    let that = this;
    // the text pause isn't the function itself
    // but that in pause we don't schredule the next event
    // this function schredules the resume on mouseclick
    // with the double linebreak
    function pauseText () {
      that.textSkipEvent.detach();
      that.input.onTap.addOnce(()=>{
        that.text.text += '\n\n';
        that.enableTextSkip();
        addParsedText();
      }, that);
    }
    let addParsedText = function () {
      let letter;
      // text has been skipped, do ALL at once!
      if (that.isTextSkipped) {
        // loop ends as soon as the text stops being skipped
        // without consuming the whole iterator queue
        while (that.isTextSkipped && !(letter = iterator.next()).done) {
          // also stop the skip if you hit an \n
          if (letter.value === '\n') {
            that.isTextSkipped = false;
            pauseText();
            return;
          }
          that.text.text += letter.value;
        }
      }

      letter = iterator.next();
      if (letter.done) {
        that.endScene(key);
        return;
      }

      // linebreaks (\n) are special
      // as they signal a pause in the scroll
      if (letter.value === '\n') {
        pauseText();
        return;
      }

      // there's one more letter, add me to the future!
      that.textTimer.add(20, () => {
        that.text.text += letter.value;
        addParsedText();
      }, that);
    };
    addParsedText();

    this.totalBreadcrumb.push(key);
    this.text.text += start;
    this.textTimer.start();
  }

  // parses the scene.txt letter by letter, yielding it too
  *parse (scene) {
    let insideCommand = false;
    let command = '';
    for (let letter of scene.text) {
      if (letter === '%') {
        // % has been found, so it can be one of two cases
        if (insideCommand) {
          // we're inside a command prompt
          // and so, we're fininish it up
          insideCommand = false;
          // we then yield back whatever the parse command gives
          // just in case
          // TODO: make it split into letters too!
          yield this.parseCommand(command + '%', scene);
        } else {
          // or starting a command prompt
          insideCommand = true;
          command = '%';
        }
      } else if (insideCommand) {
        // if you're inside a command prompt, don't yield
        // and consume letters until the whole thing is done
        command += letter;
      } else {
        yield letter;
      }
    }
  }

  parseCommand (command, scene) {
    // 1: code, 2: id (if any)
    let regex = /%(\D+)(\d*)%/;
    let result = regex.exec(command);
    switch (result[1]) {
      case 'c':
        this.text.addColor(scene.colors[Number(result[2])], this.text.text.length);
        return '';
      case 'e':
        this.scripts.resetFormat();
        return '';
      case 's':
        let args = command.args || [];
        this.scripts[command.key](...args);
        return '';
      case 'b':
        this.scripts.addBreadcrumb(scene);
        return '';
      case 'f':
        let flag = scene.flags[Number(result[2])];
        this.scripts.setFlag(flag.key, flag.value);
        return '';
      case 'm':
        let memory = scene.memories[Number(result[2])];
        this.scripts.setMemory(memory.key, memory.value);
        return '';
      case '%':
        return '%';
      default:

    }
  }

  // internal, calls the end of the scene logic
  endScene (key) {
    this.textTimer.stop();
    let ending = this.plot[key].end;

    let that = this;
    function getValidScenes (scenes) {
      let validScenes = [];
      for (let scene of scenes) {
        // if scene has a valid field
        if (scene.valid) {
          // run the attached script for truthness
          let args = scene.valid.args || [];
          if (that.scripts[scene.valid.key](...args)) {
            validScenes.push(scene);
          }
          // else just add the sucker
        } else validScenes.push(scene);
      }
      return validScenes;
    }
    function changeChoiceState (dir) {
      // refuse if out of bounds
      if (that.sceneCursor + dir < 0 || that.sceneCursor + dir > that.scenes.length - 1) return;
      that.sceneCursor += dir;
      let scene = that.scenes[that.sceneCursor];

      // display new scene
      // remove the older option
      that.text.text = that.text.text.substring(0, that.minLength);
      for (let index in that.text.colors) {
        // delete past colour info
        if (index > that.minLength) {
          delete that.text.colors[index];
        }
      }
      // add left Gui hint
      if (that.sceneCursor != 0) {
        that.scripts.addColor(that.colors.choiceGui);
        that.text.text += '« ';
      }
      // add the pretended color
      if (scene.color) {
        that.scripts.addColor(scene.color);
      } else {
        that.scripts.addColor(that.colors.choiceText);
      }
      // add the option
      that.text.text += scene.text;
      // add right Gui hint
      if (that.sceneCursor != that.scenes.length - 1) {
        that.scripts.addColor(that.colors.choiceGui);
        that.text.text += ' »';
      }
    }
    function acceptChoiceState () {
      // remove all binded events
      that.input.keyboard.reset();
      that.input.onTap.remove(acceptChoiceState, that);

      // fix option to be just the one chosen
      let scene = that.scenes[that.sceneCursor];
      that.text.text = that.text.text.substring(0, that.minLength);
      that.scripts.addColor(that.colors.choiceGui);
      that.text.text += scene.text;
      that.scripts.resetFormat();

      // start the next scene
      that.runScene(scene.key);
    }

    switch (ending.type) {
      case 'script':
        let script = ending.script;
        script.args = script.args || [];
        this.scripts[script.key](...script.args);
        break;
      case 'choice':
        this.scenes = getValidScenes(ending.choices);
        this.sceneCursor = 0;
        this.scripts.addCursor();
        this.minLength = this.text.text.length;
        let cursorKeys = this.input.keyboard.createCursorKeys();

        // change state: left/right
        cursorKeys.left.onDown.add(changeChoiceState.bind(this, -1), this);
        cursorKeys.right.onDown.add(changeChoiceState.bind(this, 1), this);
        // accept states: Down/Enter/Space/Click
        cursorKeys.down.onDown.add(acceptChoiceState, this);
        this.input.keyboard.addKey(Phaser.KeyCode.ENTER).onDown.addOnce(acceptChoiceState, this);
        this.input.keyboard.addKey(Phaser.KeyCode.SPACE).onDown.addOnce(acceptChoiceState, this);
        this.input.onTap.addOnce(acceptChoiceState, this);

        // start
        changeChoiceState(0);
        break;
      case 'forced':
        let validScenes = getValidScenes(ending.scenes);

        // start a random scene from the valid ones
        let key = Phaser.ArrayUtils.getRandomItem(validScenes).key;
        this.runScene(key, '');
        break;
      case 'breadcrumb':
        this.runScene(this.breadcrumb.pop().key);
        break;
      default:
        // TODO: error logging
    }
  }

  render () {
    // TODO: Stub
  }
}
