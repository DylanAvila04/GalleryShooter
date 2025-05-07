class Feed extends Phaser.scene {
    constructor() {
        super("feedScene");
        this.my = { sprite: {} };
        
        //Hold more than 1 duck in array
        this.ducks = [];
        this.endText = null;

        this.playerX = 300;
        this.playerY = 600;

        this.duckX = 150;
        this.duckY = 100;

        this.waveNumber = 0;
        this.maxWaves = 3;
    }

    preload() {
        //Image load 
        this.load.setPath("./assets/");
        this.load.image("player", "alienBeige_climb2.png");
        this.load.image("projectile", "shot_brown_large.png");
        this.load.image("enemy_projectile","crosshair_blue_small.png");
        this.load.image("enemy","duck_outline_yellow.png");
        this.load.image("strongerEnemy","duck_white.png");
        this.load.image("Duck_Pond","tiles_sheet.png");
        this.load.image("generator","tile_60.png")
        this.load.tilemapTiledJSON("map","DuckPond.json");

        //audio load 
        this.load.audio("throwSound","impactSoft_heavy_003.mp3");
        this.load.audio("duck_hit","075176_duck-quack-40345.mp3");
        this.load.audio("Background_music","jingles_NES00.mp3")


    }

    create() {
        let my = this.my;

        //Audio
        this.throwSound = this.sound.add("throwSound");
        this.duck_hit = this.sound.add("duck_hit");
        this.Background_music = this.sound.add("Background_music");

        //Map
        this.map = this.add.tilemap("map", 32, 32, 18, 24);
        this.tileset = this.map.addTilesetImage("Park","Duck_Pond");
        this.DuckPondLayer = this.map.createLayer("DuckPond", this.tileset, 0, 0);
        this.Rockslayer = this.map.createLayer("Rocks", this.tileset, 0, 0);
       
        //A-D Movement 
        this.aKey = this.input.keyboard.addKey('A');
        this.dKey = this.input.keyboard.addKey('D');
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        //Intialize game which restarts most text after player either loses or wins 
        this.init_game();

    }
    
    init_game() {
        if (this.endText) {
            this.endText.destroy();
            this.endText = null;
        }
        this.score = 0;
        let my = this.my;

        if (this.endText) {
        this.endText.destroy();
        this.endText = null;
        }
        if (this.ducks.length > 0) {
        this.ducks.forEach(duck => duck.destroy());
        }

        this.ducks = [];
        this.enemyProjectiles = [];

        //Restarting texts for when player lose or wins 
        if (my.sprite.player && my.sprite.projectile && this.scoreText && this.healthText) {
            my.sprite.player.destroy();
            my.sprite.projectile.destroy();
            this.scoreText.destroy();
            this.healthText();
        }

        this.waveNumber = 0;
        this.startNextWave();


        this.playerHealth = 3;
        this.score = 0;
        this.gameOver = false;
    
        my.sprite.projectile = null;
    
        this.scoreText = this.add.text(10, 10, "Score: 0", { fontSize: '24px', fill: '#fff' });
        this.healthText = this.add.text(10, 40, "Health: 3", { fontSize: '24px', fill: '#fff' });

         // Add and scale the player sprite
        my.sprite.player = this.add.sprite(this.playerX, this.playerY, "player");
        my.sprite.player.setScale(0.75); 

        my.sprite.projectile = null;

        //Sprites for generator 
        this.generators = [];
        //Placement of generator 1 sprite at 160 and 550 
        let gen1 = this.add.sprite(160, 550, "generator");
        gen1.setScale(0.35);
        this.generators.push(gen1);
       
        //Placement of generator 2 sprite at 450 and 550 
        let gen2 = this.add.sprite(450, 550, "generator");
        gen2.setScale(0.35);
        this.generators.push(gen2);

    }

    startNextWave() {
        this.ducks = [];
    
        let duckCount = 5;
        for (let i = 0; i < duckCount; i++) {
            let texture = (i === Math.floor(duckCount / 2)) ? "strongerEnemy" : "enemy";
    
            let duck = this.add.sprite(100 + i * 100, 100, texture);
            duck.setScale(0.5);
    
            // Custom manual movement setup
            duck.speed = 2;
            duck.direction = 1;  
            duck.leftBound = duck.x - 50;
            duck.rightBound = duck.x + 50;
    
            this.ducks.push(duck);
        }
    
        this.waveNumber++;
        
        this.time.addEvent({
            delay: 2000, // every 2 seconds
            callback: () => {
                if (this.gameOver) return; 

                this.ducks.forEach(duck => {
                    // Fire from duck's current position
                    let shot = this.add.sprite(duck.x, duck.y + 20, "enemy_projectile");
                    shot.setScale(0.5);
                    this.enemyProjectiles.push(shot);
                });
            },
            callbackScope: this,
            loop: true
        });
    }
    

    update() {
        let my = this.my;
        let speed = 5;

      
        if (this.aKey.isDown) {
            my.sprite.player.x -= speed;
        }
        if (this.dKey.isDown) {
            my.sprite.player.x += speed;
        }

        // Keeping player from going beyond the left or right wall 
        const playerHalfWidth = my.sprite.player.displayWidth / 2;
        my.sprite.player.x = Phaser.Math.Clamp(my.sprite.player.x, playerHalfWidth, 600 - playerHalfWidth);

        // Shoot
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && my.sprite.projectile == null) {
            my.sprite.projectile = this.add.sprite(my.sprite.player.x, my.sprite.player.y - 30, "projectile");
            my.sprite.projectile.setScale(0.65);  
            this.throwSound.play();
            
        }

     
        if (my.sprite.projectile) {
            my.sprite.projectile.y -= 10;
            if (my.sprite.projectile.y < -my.sprite.projectile.displayHeight) {
                my.sprite.projectile.destroy();
                my.sprite.projectile = null;
            }
        }

        //Projectile hitting genrators and ducks
        if (my.sprite.projectile) {
            for (let gen of this.generators) {
                if (Phaser.Geom.Intersects.RectangleToRectangle(
                    my.sprite.projectile.getBounds(),
                    gen.getBounds()
                )) {
                    my.sprite.projectile.destroy();
                    my.sprite.projectile = null;
                    return;  
                }
            }

            for (let i = 0; i < this.ducks.length; i++) {
                let duck = this.ducks[i];
                if (Phaser.Geom.Intersects.RectangleToRectangle(my.sprite.projectile.getBounds(), duck.getBounds())) {
                    // Hit!
                    duck.destroy();                     // Remove the duck
                    this.ducks.splice(i, 1);            // Remove duck from array
                    my.sprite.projectile.destroy();     // Remove projectile
                    my.sprite.projectile = null;
                    this.duck_hit.play();
                    // Increase score
                    this.score += 100;
                    this.scoreText.setText("Score: " + this.score);
                    break;  
            
                }
            }
        }
        let remainingProjectiles = [];

        for (let shot of this.enemyProjectiles) {
            shot.y += 5;
        
            let hitGenerator = false;
            for (let gen of this.generators) {
                if (Phaser.Geom.Intersects.RectangleToRectangle(shot.getBounds(), gen.getBounds())) {
                    shot.destroy();
                    hitGenerator = true;
                    break;
                }
            }
            if (hitGenerator) continue;

            //If player is hit then the health increments down by -1
            if (!this.gameOver &&
                Phaser.Geom.Intersects.RectangleToRectangle(
                    shot.getBounds(),
                    this.my.sprite.player.getBounds()
                )
            ) {
                shot.destroy();
                this.playerHealth--;
                this.healthText.setText("Health: " + this.playerHealth);
                continue;
            }
        

            if (shot.y > this.sys.game.config.height + shot.displayHeight) {
                shot.destroy();
                continue;
            }
            remainingProjectiles.push(shot);
        }
        
        // Replace with cleaned list
        this.enemyProjectiles = remainingProjectiles;

        //You win \ text popping up 
        if (this.ducks.length === 0 && !this.gameOver) {
            this.gameOver = true;
        
            this.endText = this.add.text(300, 300, "YOU WIN!\nPress R to Restart", {
                fontSize: "32px",
                fill: "#fff",
                align: "center"
            }).setOrigin(0.5).setScrollFactor(0);  // keep text on screen
        }
        
        //You lose text popping up 
        if (this.playerHealth <= 0 && !this.gameOver) {
            this.gameOver = true;
            this.endText = this.add.text(300, 300, "GAME OVER\nPress R to Restart", {
                fontSize: "32px",
                fill: "#fff",
                align: "center"
            }).setOrigin(0.5);
        }
        //Restart key for R 
        if (this.gameOver ) {
            if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
                this.scene.restart()
                console.log("hello world");
            }
            return;
        }

        //Direction of movement depending on bounds 
        for (let duck of this.ducks) {
            duck.x += duck.speed * duck.direction;
            if (duck.x >= duck.rightBound || duck.x <= duck.leftBound) {
                duck.direction *= -1;
            }
        }
        
    }
}
