/* Engine.js
 * This file provides the game loop functionality (update entities and render),
 * draws the initial game board on the screen, and then calls the update and
 * render methods on your player and enemy objects (defined in your app.js).
 *
 * A game engine works by drawing the entire game screen over and over, kind of
 * like a flipbook you may have created as a kid. When your player moves across
 * the screen, it may look like just that image/character is moving or being
 * drawn but that is not the case. What's really happening is the entire "scene"
 * is being drawn over and over, presenting the illusion of animation.
 *
 * This engine makes the canvas' context (ctx) object globally available to make 
 * writing app.js a little simpler to work with.
 */

var Engine = (function(global) {
    /* Predefine the variables we'll be using within this scope,
     * create the canvas element, grab the 2D context for that canvas
     * set the canvas elements height/width and add it to the DOM.
     */
    const doc = global.document;
    const win = global.window;
    const canvas = doc.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const restartBtn = document.querySelector('div.btn-restart');
    const levelDisplay = document.querySelector('.level span');
    const highestDisplay = document.querySelector('.highest-level span');
    const lifeDisplay = document.querySelector('.life span');

    let lastTime;
    let isPaused = false;
    let textContent;
    let textPosition = {x: 0, y: 0};
    let currentLevel = 1;
    let highestLevel = 0;
    let extraLives = 2;

    let player;
    let enemies;
    let runLevel;
    let clearLevel;
    let getPlayer;
    let getEnemies;

    canvas.width = 707;
    canvas.height = 707;
    doc.body.appendChild(canvas);

    /* This function serves as the kickoff point for the game loop itself
     * and handles properly calling the update and render methods.
     */
    function main() {
        /* Get our time delta information which is required if your game
         * requires smooth animation. Because everyone's computer processes
         * instructions at different speeds we need a constant value that
         * would be the same for everyone (regardless of how fast their
         * computer is) - hurray time!
         */
        var now = Date.now(),
            dt = (now - lastTime) / 1000.0;

        /* Call our update/render functions, pass along the time delta to
         * our update function since it may be used for smooth animation.
         */
        // if game is paused, do not update
        if (!isPaused) {
            update(dt);
        }
        
        render();

        /* Set our lastTime variable which is used to determine the time delta
         * for the next time this function is called.
         */
        lastTime = now;

        /* Use the browser's requestAnimationFrame function to call this
         * function again as soon as the browser is able to draw another frame.
         */
        win.requestAnimationFrame(main);
    }

    /* This function does some initial setup that should only occur once,
     * particularly setting the lastTime variable that is required for the
     * game loop.
     */
    function init() {

        // handles click on restart button
        restartBtn.addEventListener('click', () => {
            isPaused = false;
            textContent = undefined;
            currentLevel = 1;
            extraLives = 2;
            reset();
        });

        // init Levels
        LevelMaker(global)
        runLevel = Levels.run;
        clearLevel = Levels.clear;
        getPlayer = Levels.getPlayer;
        getEnemies = Levels.getEnemies;

        reset();
        lastTime = Date.now();
        main();
    }


     /* This function does nothing but it could have been a good place to
     * handle game reset states - maybe a new game menu or a game over screen
     * those sorts of things. It's only called once by the init() method.
     */
    function reset() {

        // clear the previous level's data
        clearLevel();
        player = undefined;
        enemies = []
        
        // if no more lives left, a player lost the game
        if (extraLives < 0) {
            showText('YOU LOST!', 110, 285, -1, '72px Nosifer', 'black');
            return;
        }

        // displays highest level and lives
        highestDisplay.textContent = highestLevel;
        lifeDisplay.textContent = extraLives;

        // run the next level
        let hasLevel = runLevel(currentLevel - 1); 

        if (hasLevel) {
            // displays current level
            levelDisplay.textContent = currentLevel;
            pause(1500);
            showText(`LEVEL ${currentLevel}`, 265, 285, 1500, '72px Creepster', 'red');
            player = getPlayer();
            enemies = getEnemies();
        // if no more levels left, a player won the game
        } else {
            showText('YOU WON!', 195, 292, -1, '96px Creepster', 'white');
            return;
        }
    }

    /* This function is called by main (our game loop) and itself calls all
     * of the functions which may need to update entity's data. Based on how
     * you implement your collision detection (when two entities occupy the
     * same space, for instance when your character should die), you may find
     * the need to add an additional function call here. For now, we've left
     * it commented out - you may or may not want to implement this
     * functionality this way (you could just implement collision detection
     * on the entities themselves within your app.js file).
     */
    function update(dt) {

        // updates only when units exist
        if (player && enemies.length > 0) {
            updateEntities(dt);
            checkCollisions();
            checkGoal();
        }
    }

    /* This is called by the update function and loops through all of the
     * objects within your allEnemies array as defined in app.js and calls
     * their update() methods. It will then call the update function for your
     * player object. These update methods should focus purely on updating
     * the data/properties related to the object. Do your drawing in your
     * render methods.
     */
    function updateEntities(dt) {

        player.update(dt);
        enemies.forEach(sprite => sprite.update(dt));
    }


    /**
     * checks if player collide with an enemy
     */
    function checkCollisions() {

        enemies.forEach(e => {

            if (Math.abs(e.x - player.x) < Math.min(e.collisionWidth, player.collisionWidth) &&
                Math.abs(e.y - player.y) < Math.min(e.collisionHeight, player.collisionHeight)) {
                
                // if collision happens, a player loses 1 life
                extraLives--;
                pause(3000);
                showText('YOU DIED', 125, 285, 1500, '72px Nosifer', 'red');

                setTimeout(() => {
                    reset();
                }, 1600);

                return;
            }
        });
    }

    /**
     * checks if player meet the goal
     */
    function checkGoal() {
        if (player.y === 0) {

            
            if (highestLevel < currentLevel) {
                highestLevel = currentLevel;
            }
            currentLevel++;
            pause(2200);
            showText('LEVEL COMPLETE', 155, 285, 2000, '72px Creepster', 'white');
            
            setTimeout(() => {
                reset();
            }, 2100);

            return;
        }
    }

    /* This function initially draws the "game level", it will then call
     * the renderEntities function. Remember, this function is called every
     * game tick (or loop of the game engine) because that's how games work -
     * they are flipbooks creating the illusion of animation but in reality
     * they are just drawing the entire screen over and over.
     */
    function render() {
        /* This array holds the relative URL to the image used
         * for that particular row of the game level.
         */
        var rowImages = [
                'images/Stone Block.png',   // Top row is water
                'images/Grass Block.png',   // Row 1 of 3 of stone
                'images/Grass Block.png',   // Row 2 of 3 of stone
                'images/Grass Block.png',   // Row 3 of 3 of stone
                'images/Grass Block.png',   // Row 1 of 2 of grass
                'images/Grass Block.png',    // Row 2 of 2 of grass
                'images/Stone Block.png'
            ],
            numRows = 7,
            numCols = 7,
            row, col;
        
        // Before drawing, clear existing canvas
        ctx.clearRect(0,0,canvas.width,canvas.height)

        /* Loop through the number of rows and columns we've defined above
         * and, using the rowImages array, draw the correct image for that
         * portion of the "grid"
         */
        for (row = 0; row < numRows; row++) {
            for (col = 0; col < numCols; col++) {
                /* The drawImage function of the canvas' context element
                 * requires 3 parameters: the image to draw, the x coordinate
                 * to start drawing and the y coordinate to start drawing.
                 * We're using our Resources helpers to refer to our images
                 * so that we get the benefits of caching these images, since
                 * we're using them over and over.
                 */
                ctx.drawImage(Resources.get(rowImages[row]), col * 101, row * 83);
            }
        }

        renderEntities();

        // if textContent is defined, draw text on canvas
        if (textContent) {
            ctx.fillText(textContent, textPosition.x, textPosition.y);
        }
    }

    /* This function is called by the render function and is called on each game
     * tick. Its purpose is to then call the render functions you have defined
     * on your enemy and player entities within app.js
     */
    function renderEntities() {
        
        // updates only when units exist
        if (player) {
            player.render();
        }
        if (enemies.length > 0) {
            enemies.forEach(sprite => sprite.render());
        }
    }

    /**
     * shows a text on the canvas
     * if timeMS is less than 0, text will not automatically disappear
     */
    function showText(text, x, y, timeMS, font = '72px sans-serif', color = 'red') {
        ctx.fillStyle = color;
        ctx.font = font;
        textContent = text;
        textPosition.x = x;
        textPosition.y = y;
        if (timeMS >= 0) {
            setTimeout(() => {
                textContent = undefined;
            }, timeMS);
        }
    }

    /**
     * pauses the game for a period of time
     */
    function pause(timeMS) {
        isPaused = true;
        setTimeout(() => {
            isPaused = false;
        }, timeMS);
    }

    /* Go ahead and load all of the images we know we're going to need to
     * draw our game level. Then set init as the callback method, so that when
     * all of these images are properly loaded our game will start.
     */
    Resources.load([
        'images/Stone Block.png',
        'images/Grass Block.png',
        'images/Cat Girl.png',
        'images/Goul.png',
        'images/Orc.png',
        'images/Murloc.png',
        'images/Wolf.png',
        'images/Spider.png',
        'images/Werewolf.png'
    ]);
    Resources.onReady(init);

    /* Assign the canvas' context object to the global variable (the window
     * object when run in a browser) so that developers can use it more easily
     * from within their app.js files.
     */
    global.ctx = ctx;
})(this);