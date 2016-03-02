// Entry point of our game, create from Phaser.Game class
var game = new Phaser.Game(960, 540, Phaser.AUTO, '', {preload: preload, create: create, update: update, render: render});

// Constants for easy editing of values during development
var PLAYER_SPEED = 300;
var LAZER_SPEED = 400;
var LAZER_DELAY = 200;
var ENEMY_DELAY = 1;

// Preload function, called first.
// Used to load in visual and audio assets
function preload() {
  game.load.image('background', 'assets/starfield3.png');
  game.load.spritesheet('player', 'assets/Lightning.png', 32, 32);
  game.load.image('lazer', 'assets/beam.png');
  game.load.image('enemy', 'assets/enemy-guy.png');
  game.load.spritesheet('explosion', 'assets/explosion.png', 64, 64);

  game.load.audio('bgMusic', ['assets/SpaceAwesome.mp3', 'assets/SpaceAwesome.ogg']);
  game.load.audio('lazerSound', ['assets/laser.mp3', 'assets/laser.ogg']);
  game.load.audio('explosionSound', ['assets/explosion.mp3', 'assets/explosion.ogg']);
};

// Long list of variables
// Put outside functions so variables are accessible
var background;
var player;
var enemies;
var cursors;
var lazers;
var fireButton
var lazerTimer = 0;
var lazerSound;
var bgMusic;
var explosions;
var explosionSound;
var score = 0;
var scoreText;

// Create function, called after Preload
// Used for instantiating actual sprites into
// game view and editing values
function create() {

  // Start physics
  game.physics.startSystem(Phaser.Physics.ARCADE);

  background = game.add.tileSprite(0, 0, 960, 540, 'background');

  // Build player sprite object
  player = game.add.sprite(game.world.width / 2, game.world.height / 2, 'player');
  player.anchor.setTo(0.5);
  player.scale.setTo(2);
  player.animations.add('spin', [0, 1, 2, 3], 10, true);
  player.animations.play('spin');
  game.physics.arcade.enable(player);
  //player.body.collideWorldBounds = true;

  // Build lazers sprite group
  lazers = game.add.group();
  lazers.enableBody = true;
  lazers.physicsBodyType = Phaser.Physics.ARCADE;
  lazers.createMultiple(30, 'lazer');
  lazers.setAll('anchor.x', 0.5);
  lazers.setAll('anchor.y', 1);
  lazers.setAll('outOfBoundsKill', true);
  lazers.setAll('checkWorldBounds', true);

  // Build enemies sprite group
  enemies = game.add.group();
  enemies.enableBody = true;
  enemies.physicsBodyType = Phaser.Physics.ARCADE;
  enemies.createMultiple(20, 'enemy');
  enemies.setAll('body.immovable', true);
  enemies.setAll('anchor.x', 0.5);
  enemies.setAll('anchor.y', 0.5);

  // Build explosions sprite group
  explosions = game.add.group();
  explosions.createMultiple(20, 'explosion');
  explosions.setAll('anchor.x', 0.5);
  explosions.setAll('anchor.y', 0.5);
  explosions.callAll('animations.add', 'animations', 'explosion');

  // Build text for score
  scoreText = game.add.text(game.world.width / 2, 32, 'Score: ' + score, {font: '40px Arial', fill: '#ff0000'});
  scoreText.anchor.setTo(0.5);

  // Create input keys for user input.
  // arrow keys and spacebar
  cursors = game.input.keyboard.createCursorKeys();
  fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

  // Build audio sprites
  lazerSound = game.add.audio('lazerSound', 0.5, false);
  explosionSound = game.add.audio('explosionSound', 1, false);
  bgMusic = game.add.audio('bgMusic', 0.7, true);
  bgMusic.play();

  // Continuous loop for deploying enemies. Calls 'spawnEnemies'
  // every 2 seconds
  game.time.events.loop(Phaser.Timer.SECOND * ENEMY_DELAY, getSideChoice, this);

};

function getSideChoice() {
  var sideChoice = game.rnd.integerInRange(1,2);
  spawnEnemies(sideChoice);
}

// Custom function for creating enemies
function spawnEnemies(sideChoice) {

  // Grab first 'dead' sprite in group
  var enemy = enemies.getFirstExists(false);

  // Reset sprite to random x/y coordinates and make alive
  if(sideChoice === 1) {
    enemy.reset(game.rnd.integerInRange(-50, 0), game.rnd.integerInRange(-50, 0));
  } else {
    enemy.reset(game.rnd.integerInRange(game.world.width, game.world.width + 50), game.rnd.integerInRange(-50, 0));
  }

  // Create initial tween of enemy using random values
  var tween = game.add.tween(enemy);
  tween.to({x: game.rnd.integerInRange(10, 920), y: game.rnd.integerInRange(10, 380)}, 2000, Phaser.Easing.Linear.None, false)
  
  // OnComplete callback for when the initial tween finishes.
  // Calls 'continueTween' and passes in a random number
  // for number of iterations/number of tweens to create

  /*-----------------------Callback function-------------------------------------*/
  /*------------------------------|------Context---------------------------------*/
  /*------------------------------|---------|-Priority---------------------------*/
  /*------------------------------|---------|---|-------Iterations argument------*/
  /*------------------------------|---------|---|----------------|---------------*/
  /*------------------------------V---------V---V----------------V---------------*/
  tween.onComplete.addOnce(continueTween, this, 0, game.rnd.integerInRange(1, 6), sideChoice);

  // Start the initial tween
  tween.start();
}

// Custom function that creates another tween on the sprite
// if the iterator is above 0 and creates the final
// tween if the iterator runs out
function continueTween(sprite, tween, iterations, sideChoice) {
  // Check for amount of iterations
  if (iterations > 0) {

    // Decrease iterations amount
    iterations -= 1;

    // Create next tween on sprite object
    var tween = game.add.tween(sprite);
    tween.to({x: game.rnd.integerInRange(10, 920), y: game.rnd.integerInRange(10, 380)}, 2000, Phaser.Easing.Linear.None, false);
    
    // Since there are still iterators left call 'continueTween' again
    // with the decreased iterator passed in
    tween.onComplete.addOnce(continueTween, this, 0, iterations, sideChoice);
    tween.start();
  } else {

    // Create another tween that calls the
    // 'tweenExit' function onComplete
    var tween = game.add.tween(sprite);
    tween.to({x: game.rnd.integerInRange(10, 920), y: game.rnd.integerInRange(10, 380)}, 2000, Phaser.Easing.Linear.None, false);
    tween.onComplete.addOnce(tweenExit, this, 0, sideChoice);
    tween.start();
  }
}

// Custom function for instantiating the final
// tween on our enemy sprite
function tweenExit(enemy, tween, sideChoice) {

  // Instantiate final tween that
  // onComplete will kill the enemy sprite
  // freeing it up for use
  var tween = game.add.tween(enemy);

  if (sideChoice === 1) {
    tween.to({x: -150, y: game.rnd.integerInRange(10, 380)}, 2000, Phaser.Easing.Linear.None, false);
    tween.onComplete.addOnce(function() {
      enemy.kill();
    }, this);  
  } else {
    tween.to({x: game.world.width + 150, y: game.rnd.integerInRange(10, 380)}, 2000, Phaser.Easing.Linear.None, false);
    tween.onComplete.addOnce(function() {
      enemy.kill();
    }, this);
  }
  
  tween.start();
}

// Update function called after Create
// executes 60 times per second equating
// to 60FPS
function update() {

  game.world.wrap(player);

  game.physics.arcade.overlap(lazers, enemies, lazerHitEnemy, null, this);
  game.physics.arcade.overlap(player, enemies, enemyHitPlayer, null, this);

  background.tilePosition.y += 5;

  player.body.velocity.setTo(0, 0);

  if (cursors.left.isDown) {
    player.body.velocity.x = -PLAYER_SPEED;
  } else if (cursors.right.isDown) {
    player.body.velocity.x = PLAYER_SPEED;
  }

  if (cursors.up.isDown) {
    player.body.velocity.y = -PLAYER_SPEED;
  } else if (cursors.down.isDown) {
    player.body.velocity.y = PLAYER_SPEED;
  }

  if (fireButton.isDown) {
    fireLazers();
  }

};

// Custom function to handle callbacks
// from collisions between player and enemies
function enemyHitPlayer(player, enemy) {
  enemy.kill();
  player.kill();
  location.reload();
}

// Custom function to handle callbacks
// from collisions between lazers and enemies
function lazerHitEnemy(lazer, enemy) {
  game.tweens.removeFrom(enemy);
  lazer.kill();
  enemy.kill();
  var explosion = explosions.getFirstExists(false);
  explosion.reset(enemy.x, enemy.y);
  explosion.play('explosion', 30, false, true);
  explosionSound.play();
  score += 10;
  scoreText.text = 'Score: ' + score;
}

// Custom function for creating
// and deploying lazers
function fireLazers() {
  if (game.time.now > lazerTimer) {
    var lazer = lazers.getFirstExists(false);

    if (lazer) {
      lazer.reset(player.x, player.y + 10);
      lazer.body.velocity.y = -LAZER_SPEED;
      lazerTimer = game.time.now + LAZER_DELAY;
      lazerSound.play();
    }
  }
}

// Render function. Called after
// Update function, also runs 60 times a second.
// Used primarily for debugging.
function render() {};
