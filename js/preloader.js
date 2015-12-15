;(function () {
  'use strict'

  function Preloader () {
    this.asset = null
    this.ready = false
  }

  Preloader.prototype = {
    preload: function () {
      // you can't set the anchor on the loading bar, so hence this workaround
      this.asset = this.add.sprite(this.game.width * 0.5 - 110, this.game.height * 0.5 - 10, 'preloader')
      this.load.setPreloadSprite(this.asset)

      // this.load.onLoadComplete.addOnce(this.onLoadComplete, this)
      this.loadResources()
      //
      // this.ready = true
    },

    loadTextFiles: function () {
      // TODO: Add all the story families
      this.load.text('story-forest', '/assets/story/forest.txt')
    },

    loadFonts: function () {
      window.WebFontConfig = window.WebFontConfig || {}
      // workaround so the function calls the inside function
      let that = this
      window.WebFontConfig.active = () => {
        // this will always be the last load
        that.onLoadComplete()
      }
      this.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js')
    },

    loadResources: function () {
      this.loadFonts()
    },

    create: function () {},

    update: function () {
      if (this.ready) {
        this.game.state.start('menu')
      }
    },

    onLoadComplete: function () {
      this.ready = true
    }
  }

  window['phaser-adumbrate'] = window['phaser-adumbrate'] || {}
  window['phaser-adumbrate'].Preloader = Preloader
}())
