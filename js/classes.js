/**
 * Sprite class
 */
class Sprite {
    constructor({texture, x, y, width, height, offsetX = 0, offsetY = 0, collisionWidth = 0, collisionHeight = 0}) {
        this.texture = texture;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.offsetX = offsetX;
        this.offsetY = offsetY; 
        this.frame = {sx: 0, xy: 0, sWidth: this.width, sHeight: this.height};  // frame indicates which area of the texture will be drawn
        this.vx = 0;     // velocity on x axis
        this.vy = 0;     // velocity on y axis
        this.collisionWidth = collisionWidth;
        this.collisionHeight = collisionHeight;
    }

    /**
     * draws a unit's texture on canvas
     */
    render() {
        ctx.drawImage(
            Resources.get(this.texture),
            this.frame.sx,
            this.frame.sy,
            this.frame.sWidth,
            this.frame.sHeight,
            this.x + this.offsetX,
            this.y + this.offsetY,
            this.width,
            this.height
        );
    }

    // updates units' position
    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
    }
}

/**
 * Unit class
 * for creating all NPCs
 */
class Unit extends Sprite {
    constructor({texture, x, y, width, height, offsetX = 0, offsetY = 0, collisionWidth = 0, collisionHeight = 0, direction, frameSet}) {
        super({texture, x, y, width, height, offsetX, offsetY, collisionWidth, collisionHeight});
        this.frameSet = frameSet;     // frameSet is a series of animation frames
        this.direction = direction;
        this.destX = this.x;          // destination of moving
        this.destY = this.y;          // destination of moving
        this.speed = 0;               // can move how many blocks per second
        this.lastMoveDistance = 0;    // this value affects animation speed
        this.script;                  // if this function exits, will invoke it every frame; it can be used for enemies' AI
    }

    // check if a unit is moving
    isMoving() {
        return this.vx !== 0 || this.vy !== 0;
    }


    /**
     * Sets the destination and velocity of moving
     * velocity respects unit's speed property
     */
    setMove(direction) {
        
        if (!this.isMoving()) {
            this.direction = direction;
            this.destX = this.x;
            this.destY = this.y;
            switch (this.direction) {
                case 'left':
                    this.destX -= 101;
                    this.vx = -this.speed * 101;
                    break;
                case 'right':
                    this.destX += 101;
                    this.vx = this.speed * 101;
                    break;
                case 'up':
                    this.destY -= 83;
                    this.vy = -this.speed * 83;
                    break;
                case 'down':
                    this.destY += 83;
                    this.vy = this.speed * 83;
                    break;
            }
        }
    }


    /**
     * Updates a unit's position and animation frame
     */
    update(dt) {

        if (this.isMoving()) {

            // prevents move over destination 
            if (Math.abs(this.x - this.destX) < Math.abs(this.vx * dt)) {
                this.x = this.destX;
                this.vx = 0;
                this.lastMoveDistance = 0;
            } else if (Math.abs(this.y - this.destY) < Math.abs(this.vy * dt)) {
                this.y = this.destY;
                this.vy = 0;
                this.lastMoveDistance = 0;
            } else {
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.lastMoveDistance += Math.abs(this.vx * dt + this.vy * dt);
            }

        } else {
            if (this.script) this.script(this);
        }

        // set unit's current texture frame
        this.frame = this.frameSet[this.direction][Math.floor(this.lastMoveDistance / 10) % 4];
    }

    /**
     * moves a unit to a position instantaneously
     */
    teleport(x, y) {
        this.x = x;
        this.destX = x;
        this.y = y;
        this.destY = y;
        this.vx = 0;
        this.vy = 0;
        this.lastMoveDistance = 0;
    }
}

/**
 * Player class
 */
class Player extends Unit {
    constructor({texture, x, y, width, height, offsetX = 0, offsetY = 0, collisionWidth = 0, collisionHeight = 0, direction, frameSet}) {
        super({texture, x, y, width, height, offsetX, offsetY, collisionWidth, collisionHeight, direction, frameSet});
    }


    // player can not move off canvas
    setMove(direction) {
        if (!this.isMoving()) {
            if (
                (direction === 'left' && this.x > 0) ||
                (direction === 'right' && this.x < 606) ||
                (direction === 'up' && this.y > 0) ||
                (direction === 'down' && this.y < 498)
            ) {
                super.setMove(direction);
            }
        }
    }

    /**
     * controls a unit's moving
     */
    handleInput(type, direction) {
        if (type === 'keydown') {
            this.script = (unit) => unit.setMove(direction);
        }
        if (type === 'keyup') {
            this.script = undefined;
        }
    }
}
