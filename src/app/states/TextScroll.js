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
    this.scripts = {
      fakeInput: () => {
        let added = false;
        that.textTimer.start();
        that.text.addColor('rgb(53, 145, 252)', that.text.text.length);
        that.textTimer.loop(500, ()=>{
          if (added) {
            that.text.text -= ' _';
          } else {
            that.text.text += ' _';
          }
        });
      }
    };
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
    this.text = this.add.text(0, 0,'',
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
    this.text.setTextBounds(10, 10, this.world.width - 20, this.world.height - 20);


    this.textTimer = this.game.time.create(false);
    this.runScene('start of the game');
  }

  update () {
    // TODO: Stub
  }

  // pauses the text stream, and sets the resume function as well
  pauseText () {
    this.textTimer.pause();
    this.input.onDown.addOnce(()=>{
      this.textTimer.resume();
    }, this);
  }

  // runs a specific scene
  runScene (key) {
    let scene = this.plot[key];
    let iterator = this.parse(scene);
    this.textTimer.loop(20, () => {
      let nextLetter = iterator.next();
      if(!nextLetter.done) {
        this.text.text += nextLetter.value;
      } else {
        this.endScene(key);
      }
    }, this);
    this.textTimer.start();
  }

  // parses the scene.txt letter by letter, yielding it too
  *parse (scene) {
    let insideCommand = false;
    let command = '';
    for (let letter of scene.text) {
      if(letter === '%') {
        // % has been found, so it can be one of two cases
        if(insideCommand){
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
        if (letter === '\n') {
          // break lines get special treatment, even if a normal char
          // they wait for user feedback before contuinuing on!
          this.pauseText();
          // if you yield anything, it'll be printed anyway :\
          yield '';
          // double line break
          yield '\n';
          // TODO: softnening the "sudden" jump
          yield '\n';
        } else {
          yield letter;
        }
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
      this.text.addColor('#ffffff', this.text.text.length);
      return '';
    case 's':
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
    switch (ending.type) {
    case 'script':

      break;
    case 'choice':

      break;
    case 'forced':

      break;
    default:

    }
  }

  render () {
    // TODO: Stub
  }
}
