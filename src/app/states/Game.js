/*
 * Game state
 * ============================================================================
 *
 * A sample Game state, displaying the Phaser logo.
 */


export default class Game extends Phaser.State {

  create () {
    const { centerX: x, centerY: y } = this.world;

    this.logo = this.add.image(x, y, 'phaser');
    this.logo.anchor.set(0.5);
    this.game.input.onDown.add(this.onDown, this);
  }

  update () {
    this.logo.angle += 0.1;
  }

  onDown () {
    // we HAVE to keep the text
    this.state.start('TextScroll');
  }

}
