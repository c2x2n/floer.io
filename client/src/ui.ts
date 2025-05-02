import $ from "jquery";
import { ClientApplication} from "@/main.ts";
import { GameOverPacket } from "@common/packets/gameOverPacket.ts";
import { Game } from "@/scripts/game.ts";
import { SettingsData } from "@/settings.ts";
import { ChatData } from "@common/packets/updatePacket.ts";
import { ChatChannel } from "@common/packets/chatPacket.ts";
import { Rarity, RarityName } from "@common/definitions/rarity.ts";
import { MathNumeric } from "@common/utils/math.ts";
import { EntityType, GameConstants } from "@common/constants.ts";
import { Petals } from "@common/definitions/petal.ts";
import { Random } from "@common/utils/random.ts";
import { getGameAssetsFile, getGameAssetsPath } from "@/scripts/utils/render.ts";

const version = `0.2.8.1`

export function getVersion() {
    return `v${version}`;
}


export class UI {
    readonly app: ClientApplication;

    readonly canvas = $<HTMLCanvasElement>("#canvas");

    readonly version = $<HTMLDivElement>("#floer-version");
    readonly readyButton = $<HTMLDivElement>("#btn-ready");

    readonly inGameScreen =  $<HTMLDivElement>("#in-game-screen");
    readonly outGameScreen =  $<HTMLDivElement>("#out-game-screen");

    readonly transitionRing = $<HTMLDivElement>("#transition-ring");

    readonly main =  $<HTMLDivElement>("#main");
    readonly hud = $<HTMLDivElement>("#hud");

    readonly animationContainer = $<HTMLDivElement>('#animation-container');

    readonly petalColumn= $<HTMLDivElement>(".petal-column");
    readonly equippedPetalRow= $<HTMLDivElement>(".equipped-petals-row");
    readonly preparationPetalRow= $<HTMLDivElement>(".preparation-petals-row");

    readonly nameInput = $<HTMLInputElement>("#name");

    readonly gameInfo = $<HTMLDivElement>("#game-info");
    readonly debugInfo = $<HTMLDivElement>("#debug-info");

    readonly gameOverScreen = $<HTMLDivElement>("#game-over-screen");

    readonly gameOverMurderer = $<HTMLDivElement>("#game-over-murderer");

    readonly gameOverKills = $<HTMLDivElement>("#game-over-kills");

    readonly continueButton = $<HTMLDivElement>("#btn-continue");

    readonly moveHigh = $<HTMLDivElement>("#move-high");

    readonly moveHighTime = $<HTMLDivElement>("#move-high-time");

    readonly deletePetal = $<HTMLDivElement>("<div id='delete-petal'></div>");

    readonly petalInformation =
        $<HTMLDivElement>("<div class='petal-information'></div>");

    readonly settingsButton = $<HTMLDivElement>("#btn-settings");
    readonly settingsDialog = $<HTMLDivElement>("#settings-dialog");

    readonly creditButton = $<HTMLDivElement>("#btn-credit");
    readonly creditDialog = $<HTMLDivElement>("#credit-dialog");

    readonly keyboardMovement = $<HTMLDivElement>("#keyboard-movement");
    readonly newControl = $<HTMLDivElement>("#new-control");
    readonly lowResolution = $<HTMLDivElement>("#low-resolution");
    readonly blockMytAnn = $<HTMLDivElement>("#block-myt-ann");
    readonly screenShake = $<HTMLDivElement>("#screen-shake");

    readonly chatInput = $<HTMLInputElement>("#chat-input");
    readonly chatMessagesBox = $<HTMLDivElement>("#chat-messages");
    readonly chatChannel = $<HTMLDivElement>("#chat-channel");

    readonly loader = $<HTMLDivElement>("#loader");

    openedDialog?: JQuery<HTMLDivElement>;
    get game(): Game {
        return this.app.game;
    }

    private transitionRunning: boolean = false;

    private animationInterval: number | null = null;

    constructor(app: ClientApplication) {
        this.app = app;

        // Create container for animations
        this.animationContainer = $("<div id='animation-container'></div>");
        $("body").append(this.animationContainer);

        this.readyButton.on("click", (e: Event) => {
            if (!this.transitionRunning) this.app.game.sendJoin();
        });

        this.continueButton.on("click", (e: Event) => {
            this.app.game.endGame();
        });

        this.settingsButton.on("click", (e: Event) => {
            this.toggleDialog(this.settingsDialog);
        })

        this.creditButton.on("click", (e: Event) => {
            this.toggleDialog(this.creditDialog);
        })

        this.nameInput.val(this.app.settings.data.playerName);

        this.nameInput.on("input", (e: Event) => {
            this.app.settings.changeSettings("playerName", this.nameInput.val() ?? "");
        })

        this.chatInput.on("focus", (e: Event) => {
            this.chatMessagesBox.addClass("opened")
            for (const chatMessage of this.chatMessages) {
                chatMessage.updateOpacity(1)
            }
        })

        this.chatInput.on("input", (e: Event) => {
            const content = this.chatInput.val();
            if (!content) return;
            let charsCount = 0;
            let bytesCount = 0;
            for (let i = 0; i < content.length; i++) {
                charsCount ++;
                bytesCount += new Blob([content.charAt(i)]).size;
                if (bytesCount > GameConstants.player.maxChatLength) {
                    this.chatInput.val(content.substring(0, i));
                    return;
                }
            }
        })

        this.chatInput.on("blur", (e: Event) => {
            this.chatMessagesBox.removeClass("opened")
            this.scrollToEnd(this.chatMessagesBox);
            for (const chatMessage of this.chatMessages) {
                chatMessage.updateOpacity()
            }
        })

        $(document).ready(function() {
            $("input").on({
                focus: function() {
                    $(this).addClass("focused");
                },
                blur: function() {
                    $(this).removeClass("focused");
                }
            });
        });

        window.addEventListener("beforeunload", (ev) => {
            if (this.game.running) {
                ev.preventDefault();
            }
        });

        this.gameOverScreen.css("display", "none");

        this.initSettingsDialog();

        this.startRandomEntityAnimation();

        this.loader.animate({ opacity: 0 }, 100, ()=>{ this.loader.css("display", "none");});

        const content  = `floer.io ${getVersion()}`;
        this.version.text(content);
        this.version.attr("textStroke", content)
    }

    initSettingsDialog() {
        this.initCheckbox(this.keyboardMovement, "keyboardMovement");
        this.initCheckbox(this.newControl, "newControl");
        this.initCheckbox(this.lowResolution, "lowResolution");
        this.initCheckbox(this.blockMytAnn, "blockMytAnn");
        this.initCheckbox(this.screenShake, "screenShake");
    }

    initCheckbox(jq: JQuery, key: keyof SettingsData) {
        jq.prop("checked", this.app.settings.data[key]);

        jq.on("click", (e: Event) => {
            this.app.settings.changeSettings(
                key, jq.prop("checked")
            );
        })
    }


    startRandomEntityAnimation(): void {
        // Clear any existing interval
        if (this.animationInterval) {
            window.clearInterval(this.animationInterval);
        }

        this.animationInterval = window.setInterval(() => {
            this.spawnRandomEntity();
        }, 200);
    }

    stopRandomEntityAnimation(): void {
        if (this.animationInterval) {
            window.clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    private availablePetals: string[] = [
        'basic', 'faster', 'stinger', 'bubble', 'yinyang', 'rose',
        'wing', 'heavy', 'iris', 'web', 'antennae', 'pollen',
        'leaf', 'cactus', 'rock', 'honey', 'dandelion', 'egg', 'chip', 'dice',
        'rice', 'salt', 'sand', 'talisman', 'uranium', 'shell', 'starfish',
        'jelly'
    ];

    spawnRandomEntity(): void {
        if (this.game.running) {
            // stop spawning if in game
            return;
        }

        // Select a random entity from the appropriate array
        const petalType =
            this.availablePetals[Random.int(0, this.availablePetals.length - 1)]

        const entity = $(`<div class="floating-entity"></div>`);

        // Set random vertical position (between 5% and 95% of screen height)
        const topPosition = Math.random() * 90 + 5;

        // Set random size (between 50px and 70px) mob is 1.5x
        const size = Random.int(25, 50);

        // Set random speed in seconds (between 8 and 12 seconds to cross the screen)
        const speed = Math.random() * 4 + 8;

        // Set random rotation
        const rotation = Math.random() * 360;

        // Set random spin duration (between 8s and 20s for mobs, 5s and 15s for petals)
        const spinDuration = Math.random() * 10 + 5;

        // Apply styles
        entity.css({
            'position': 'fixed',
            'top': `${topPosition}vh`,
            'left': '-100px',
            'width': `${size}px`,
            'height': `${size}px`,
            'background-image': `url(./img/game/petal/${petalType}.svg)`,
            'background-size': 'contain',
            'background-repeat': 'no-repeat',
            'background-position': 'center',
            'z-index': '-6',
            'opacity': 1,
            'transform': `rotate(${rotation}deg)`,
            'pointer-events': 'none',
            'border': 'none', // petals have border by default?
            '--spin-duration': `${spinDuration}s`
        });

        // Add to container
        this.animationContainer.append(entity);

        // Animate movement
        entity.animate({
            left: `${window.innerWidth + 100}px`
        }, speed * 1000, 'linear', function() {
            // Remove element when animation completes
            entity.animate({opacity: 0}, 200, ()=>{$(this).remove()});
        });
    }

    renderDebug(): void {
        if (!this.game.app.settings.data.debug) {
            this.debugInfo.css("display", "none");
            this.gameInfo.css("display", "none");
            return;
        }

        this.debugInfo.css("display", "block");
        this.gameInfo.css("display", "block");

        this.game.debug.particles = this.game.particles.particlesCount();
        this.game.debug.entities.loot = this.game.entityPool.countType(EntityType.Loot);
        this.game.debug.entities.mobs = this.game.entityPool.countType(EntityType.Mob);
        this.game.debug.entities.petals = this.game.entityPool.countType(EntityType.Petal);
        this.game.debug.entities.projectiles = this.game.entityPool.countType(EntityType.Projectile);
        this.game.debug.entities.players = this.game.entityPool.countType(EntityType.Player);
        const debug = this.game.debug;
        const t = `floer.io BETA ${getVersion()}`;
        this.gameInfo.attr("textStroke", t);
        this.gameInfo.text(t);
        const text = `${debug.fps} FPS / ${debug.particles} Particles / ${debug.entities.loot} Loot / ${debug.entities.mobs} Mobs / ${debug.entities.petals} Petals / ${debug.entities.projectiles} Projectiles / ${debug.entities.players} Players`;
        this.debugInfo.text(text)
        this.debugInfo.attr("textStroke", text);
    }

    toggleDialog(dialog: JQuery<HTMLDivElement>): void {
        if (this.openedDialog === dialog) {
            dialog.css("animation", "close_dialog 0.5s cubic-bezier(0,0,.2,1) forwards");
        } else if (!this.openedDialog) {
            dialog.css("animation", "open_dialog 0.5s cubic-bezier(0,.85,0,1) forwards");
        } else if (this.openedDialog) {
            this.openedDialog.css("animation", "close_dialog 0.5s cubic-bezier(0,0,.2,1) forwards");
            dialog.css("animation", "open_dialog 0.5s cubic-bezier(0,.85,0,1) forwards");
        }
        this.openedDialog =
            this.openedDialog === dialog ? undefined : dialog;
    }

    showGameOverScreen(packet: GameOverPacket) {
        this.gameOverScreen.css("display", "flex");

        this.gameOverMurderer.attr("textStroke", packet.murderer);
        this.gameOverMurderer.text(packet.murderer);
        const kills = `You killed ${packet.kills} flower${packet.kills != 1 ? "s" : ""} this run.`
        this.gameOverKills.attr("textStroke", kills);
        this.gameOverKills.text(kills);
    }

    showOverleveled(time?: number) {
        if (!time && time !== 0) {
            this.moveHigh.css("display", "none");
            return;
        }

        let content = `${time}s`;
        if (time <= 0) content = "MOVE NOW";
        this.moveHigh.css("display", "block");
        this.moveHighTime.attr("textStroke", content);
        this.moveHighTime.text(content);
    }

    chatMessages: ChatMessage[] = [];

    receiveChatMessage(msg: ChatData) {
        if (
            this.app.settings.data.blockMytAnn &&
            (msg.content.startsWith("The Mythic") || msg.content.startsWith("A Mythic"))
        ) return;

        const jq = $(
            `<div
                class="chat-message"
                textStroke="${msg.content}"
                style="color: #${msg.color.toString(16)}; transform: translateX(-150%);"
            >
                ${msg.content}
            </div>`
        );

        this.chatMessagesBox.append(jq)

        setTimeout(() => {
            jq.css({
                "transition": "transform 0.5s cubic-bezier(0,.65,0,1)",
                "transform": "translateX(0px)"
            });
        }, 10);

        this.chatMessages.push(new ChatMessage(msg, jq, Date.now()));

        if (this.chatMessages.length > 30) {
            const oldestMessage = this.chatMessages.shift();
            if (oldestMessage?.jq) {
                oldestMessage.jq.animate({ opacity: 0 }, 150, () => {
                    oldestMessage.jq.remove();
                });
            }
        }

        this.scrollToEnd(this.chatMessagesBox);
    }

    openChat(): void {
        this.chatInput.focus();
    }

    sendChat(): void {
        const content = this.chatInput.val();
        if (content && typeof content === "string") {
            this.app.game.sendChat(content, this.chattingChannel);
        }
        this.chatInput.val("");
        this.chatInput.trigger("blur");
    }

    readonly changeableChannel = [
        ChatChannel.Global,
        ChatChannel.Local,
    ]

    chattingChannel: ChatChannel = ChatChannel.Global;

    changeChatChannel() {
        let index = this.changeableChannel.indexOf(this.chattingChannel) + 1;
        if (index >= this.changeableChannel.length) {
            index = 0
        }
        this.chattingChannel = this.changeableChannel[index];

        this.chatChannel.text(`[${ChatChannel[this.changeableChannel[index]]}]`);
        this.chatChannel.attr("textStroke", `[${ChatChannel[this.changeableChannel[index]]}]`);
    }

    scrollToEnd(jq: JQuery<HTMLDivElement>) {
        let scrollHeight = jq[0].scrollHeight;
        let height = jq.height() ?? scrollHeight;
        let scrollPosition = scrollHeight - height;
        jq.scrollTop(scrollPosition);
    }

    render(): void {
        if (!this.chatInput.hasClass("focused")) {
            for (const chatMessage of this.chatMessages) {
                chatMessage.updateOpacity()
            }
        }
    }
    startTransition(expanding: boolean = true) {
        if (this.transitionRunning) {
            return;
        }

        if (!this.inGameScreen || !this.transitionRing) return;
        this.transitionRing.css("opacity", "1"); // this need to show up nomatter what

        this.transitionRunning = true;

        // Common animation setup
        let radius = expanding ? 0 : window.innerWidth * 1; // Start from 0 or maxRadius

        const maxRadius = window.innerWidth * 1;
        const duration = expanding ? 1500 : 1200; // Slightly faster for collapsing
        const startTime = performance.now();

        // both needs in game screen be displayed
        this.inGameScreen.css("visibility", "visible");
        this.inGameScreen.css("opacity", "1");
        if (expanding) {
            this.inGameScreen.addClass("display");
            this.transitionRing.addClass("expand");
            this.outGameScreen.css("z-index", "-999999");
        } else {
            this.inGameScreen.removeClass("display");
            this.transitionRing.removeClass("expand");
            // initialize out game screen with 0 opacity so that it can fade in after animation is finished.
            this.outGameScreen.css({"display": "block"});
            this.outGameScreen.css({"z-index": "-5"});
            // it seems like you cant perfectly sort their zLayer so fade gameover screen out.
            // opacity needs to be set back to 1 so that it shows up next death
            this.gameOverScreen.animate({"opacity": 0}, 250, ()=>{
                this.gameOverScreen.css({
                    "display": "none",
                    "opacity": "1"
                });
            });
        }

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Custom easing for collapsing to make it faster at the beginning
            let eased;
            if (expanding) {
                // Standard easeInOutQuad for expanding
                eased = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            } else {
                // Modified easing for collapsing - starts faster
                // Use a cubic curve that drops quickly at the start
                eased = 1 - Math.pow(1 - progress, 3);
            }

            if (expanding) {
                radius = eased * maxRadius;
            } else {
                radius = maxRadius * (1 - eased);
            }

            this.inGameScreen.css("clip-path", `circle(${radius}px at center)`);

            const diameter = radius * 2;
            this.transitionRing.css({
                "width": `${diameter}px`,
                "height": `${diameter}px`
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (!expanding) {
                // case: animation finished, expanding is false.
                this.inGameScreen.css({
                    "visibility": "hidden",
                    "opacity": "0"
                });
                this.transitionRing.css({
                    "opacity": "0"
                });
                this.transitionRunning = false;
            } else {
                // case: animation finished, expanding is true. Dont need to hide ring because it is out of screen.
                // set outgamescreen to 0 opacity after animation is finished, reset zindex
                this.outGameScreen.css("display", "none");
                this.outGameScreen.css("z-index", "4");
                // set transition ring and clip path circle to very big so that user wont see even if they zoom out a lot
                this.inGameScreen.css("clip-path", `circle(${window.innerWidth * 10}px at center)`);
                const diameter = window.innerWidth * 10 * 2;
                this.transitionRing.css({
                    "width": `${diameter}px`,
                    "height": `${diameter}px`
                });
                this.transitionRunning = false;
            }
        };


        requestAnimationFrame(animate);
    }
}

const messageExistTime = 10;
const messageHidingTime = 6;

class ChatMessage {
    constructor(public content: ChatData, public jq: JQuery, public createdTime: number) {}

    getOpacity() {
        const timePassed = (Date.now() - this.createdTime) / 1000;
        if (timePassed > messageHidingTime) {
            return MathNumeric.clamp(
                (1 -
                    (timePassed - messageHidingTime) / (messageExistTime - messageHidingTime)
                ), 0, 1
            )
        }
        return 1
    }

    updateOpacity(force?: number) {
        if (!force) {
            const opacity = this.getOpacity();
            return this.jq.css("opacity", opacity);
        }
        this.jq.css("opacity", force);
    }
}
