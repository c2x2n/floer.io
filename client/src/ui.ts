import $ from "jquery";
import { ClientApplication } from "./main";
import { GameOverPacket } from "../../common/src/engine/net/packets/gameOverPacket";
import { Game } from "./scripts/game";
import { SettingsData } from "./settings";
import { ChatData } from "../../common/src/engine/net/packets/updatePacket";
import { ChatChannel } from "../../common/src/engine/net/packets/chatPacket";
import { ActionType, EntityType, GameConstants } from "../../common/src/constants";
import { Random } from "../../common/src/engine/maths/random";
import { Gallery } from "./scripts/gallery";
import { Config } from "./config";
import { Numeric } from "../../common/src/engine/maths/numeric";

const version = "0.3.1 TEST";

export function getVersion() {
    return `v${version}`;
}

export class UI {
    readonly app: ClientApplication;

    readonly canvas = $<HTMLCanvasElement>("#canvas");

    readonly version = $<HTMLDivElement>("#floer-version");
    readonly readyButton = $<HTMLDivElement>("#btn-ready");

    readonly inGameScreen = $<HTMLDivElement>("#in-game-screen");
    readonly outGameScreen = $<HTMLDivElement>("#out-game-screen");

    readonly transitionRing = $<HTMLDivElement>("#transition-ring");

    readonly main = $<HTMLDivElement>("#main");
    readonly hud = $<HTMLDivElement>("#hud");

    readonly animationContainer = $<HTMLDivElement>("#animation-container");

    readonly petalColumn = $<HTMLDivElement>(".petal-column");
    readonly equippedPetalRow = $<HTMLDivElement>(".equipped-petals-row");
    readonly preparationPetalRow = $<HTMLDivElement>(".preparation-petals-row");

    readonly nameInput = $<HTMLInputElement>("#name");

    readonly gameInfo = $<HTMLDivElement>("#game-info");
    readonly debugInfo = $<HTMLDivElement>("#debug-info");

    readonly gameOverScreen = $<HTMLDivElement>("#game-over-screen");
    readonly gameOverMurderer = $<HTMLDivElement>("#game-over-murderer");
    readonly gameOverKills = $<HTMLDivElement>("#game-over-kills");
    readonly continueButton = $<HTMLDivElement>("#btn-continue");
    readonly closeButton = $<HTMLDivElement>("#btn-close");
    readonly abandon = $<HTMLDivElement>("#abandon");

    readonly moveHigh = $<HTMLDivElement>("#move-high");
    readonly moveHighTime = $<HTMLDivElement>("#move-high-time");

    readonly deletePetal = $<HTMLDivElement>("<div id='delete-petal'></div>");

    readonly settingsButton = $<HTMLDivElement>("#btn-settings");
    readonly settingsDialog = $<HTMLDivElement>("#settings-dialog");

    readonly creditButton = $<HTMLDivElement>("#btn-credit");
    readonly creditDialog = $<HTMLDivElement>("#credit-dialog");

    readonly petalGalleryButton = $<HTMLDivElement>("#btn-petal-gallery");
    readonly petalGalleryDialog = $<HTMLDivElement>("#petal-gallery-dialog");
    readonly petalGalleryContents = $<HTMLDivElement>("#petal-gallery-contents");

    readonly mobGalleryButton = $<HTMLDivElement>("#btn-mob-gallery");
    readonly mobGalleryDialog = $<HTMLDivElement>("#mob-gallery-dialog");
    readonly mobGalleryContents = $<HTMLDivElement>("#mob-gallery-contents");

    readonly keyboardMovement = $<HTMLDivElement>("#keyboard-movement");
    readonly newControl = $<HTMLDivElement>("#new-control");
    readonly blockMytAnn = $<HTMLDivElement>("#block-myt-ann");
    readonly screenShake = $<HTMLDivElement>("#screen-shake");

    readonly chatInput = $<HTMLInputElement>("#chat-input");
    readonly chatMessagesBox = $<HTMLDivElement>("#chat-messages");
    readonly chatChannel = $<HTMLDivElement>("#chat-channel");

    readonly loader = $<HTMLDivElement>("#loader");

    readonly mobileControls = $<HTMLDivElement>("#mobile-controls");
    readonly joystickArea = $<HTMLDivElement>("#joystick-area");

    readonly buttonA = $<HTMLDivElement>("#mobile-button-a");
    readonly buttonB = $<HTMLDivElement>("#mobile-button-b");

    readonly serverButton = $<HTMLDivElement>("#server-seleceted");
    readonly serverName = $<HTMLDivElement>("#server-name");
    readonly serverPlayerCount = $<HTMLDivElement>("#server-player-count");
    readonly serverList = $<HTMLDivElement>("#server-list");

    joystick: JQuery | null = null;
    joystickHandle: JQuery | null = null;

    openedDialog?: JQuery<HTMLDivElement>;
    get game(): Game {
        return this.app.game;
    }

    private transitionRunning = false;

    private animationInterval: number | null = null;

    readonly gallery = new Gallery(this);

    private joystickPosition = { x: 0, y: 0 };
    private joystickRadius = 60;
    private handleRadius = 30;

    private activePointerId: number | null = null;

    buttonAPressed = false;
    buttonBPressed = false;

    private joystickActive = false;
    private joystickDirection = 0;
    private joystickDistance = 0;

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
        });

        this.creditButton.on("click", (e: Event) => {
            this.toggleDialog(this.creditDialog);
        });

        this.petalGalleryButton.on("click", (e: Event) => {
            this.toggleDialog(this.petalGalleryDialog);
        });

        this.mobGalleryButton.on("click", (e: Event) => {
            this.toggleDialog(this.mobGalleryDialog);
        });

        this.nameInput.val(this.app.settings.data.playerName);

        this.nameInput.on("input", (e: Event) => {
            this.app.settings.changeSettings("playerName", this.nameInput.val() ?? "");
        });

        this.chatInput.on("focus", (e: Event) => {
            this.chatMessagesBox.addClass("opened");
            for (const chatMessage of this.chatMessages) {
                chatMessage.updateOpacity(1);
            }
        });

        this.chatInput.on("input", (e: Event) => {
            const content = this.chatInput.val();
            if (!content) return;
            let charsCount = 0;
            let bytesCount = 0;
            for (let i = 0; i < content.length; i++) {
                charsCount++;
                bytesCount += new Blob([content.charAt(i)]).size;
                if (bytesCount > GameConstants.player.maxChatLength) {
                    this.chatInput.val(content.substring(0, i));
                    return;
                }
            }
        });

        this.chatInput.on("blur", (e: Event) => {
            this.chatMessagesBox.removeClass("opened");
            this.scrollToEnd(this.chatMessagesBox);
            for (const chatMessage of this.chatMessages) {
                chatMessage.updateOpacity();
            }
        });

        $(document).ready(() => {
            $("input").on({
                focus: function() {
                    $(this).addClass("focused");
                },
                blur: function() {
                    $(this).removeClass("focused");
                }
            });
        });

        window.addEventListener("beforeunload", ev => {
            if (this.game.running) { ev.preventDefault(); }
        });

        this.gameOverScreen.css("display", "none");

        this.initSettingsDialog();

        this.startRandomEntityAnimation();

        this.loader.animate({ opacity: 0 }, 100, () => { this.loader.css("display", "none"); });

        const content = `floer.io ${getVersion()}`;
        this.version.attr("textin", content);

        this.gallery.renderPetalGallery();
        this.gallery.renderMobGallery();

        this.closeButton.on("click", () => {
            this.gameOverScreen.animate({
                opacity: "0"
            }, () => { this.gameOverScreen.css("display", "none"); });
        });

        this.abandon.on("click", () => {
            if (!this.transitionRunning) {
                this.game.input.actionsToSend.add({
                    type: ActionType.Left
                });
                this.game.sendInput();
                this.game.endGame();
            }
        });

        this.serverButton.on("click", () => {
            if (this.serverList.hasClass("active")) {
                this.serverList.removeClass("active");
            } else {
                this.serverList.addClass("active");
            }
        });

        this.fetchServerInfo();
    }

    serverInfo: Record<string, { playerCount: number, build: string }> = {};

    fetchServerInfo() {
        for (const server in Config.servers) {
            const data = Config.servers[server];
            try {
                void fetch(`${data.fetchAddress}server_info`).then(r => r.json())
                    .then(data => {
                        this.serverInfo[server] = {
                            playerCount: data.playerCount ?? 0,
                            build: data.build ?? "0"
                        };

                        if (server === this.app.settings.data.server) {
                            this.updateServerInfo();
                        }
                        this.updateServerList();
                    });
            } catch (Exception) {
                console.error("Error fetching server info:", Exception, "Skipping.");
                this.serverInfo[server] = {
                    playerCount: 0,
                    build: "0"
                };
            }
        }
    }

    updateServerList() {
        this.serverList.empty();
        for (const server in Config.servers) {
            if (!Object.prototype.hasOwnProperty.call(this.serverInfo, server)) break;
            const data = Config.servers[server];
            const serverInfo = this.serverInfo[server];
            const serverElement = $("<li class='server-item'></li>");
            const serverItem = $("<div class='server-item-content'></div>");
            const serverName = $("<div class='server-name'></div>");
            const serverPlayerCount = $("<div class='server-info'></div>");
            serverName.text(data.name);
            serverPlayerCount.text(`${serverInfo.playerCount} Player${serverInfo.playerCount != 1 ? "s" : ""}`);
            serverItem.append(serverName);
            serverItem.append(serverPlayerCount);
            serverElement.append(serverItem);
            this.serverList.append(serverElement);
            if (serverInfo.build != version) {
                serverElement.addClass("unavailable");
                const status = $("<div class='server-item-status'></div>");
                serverElement.append(status);
                const unavailable = $("<div></div>");
                unavailable.attr("textin", "Unavailable");
                status.append(unavailable);
            }

            serverElement.on("click", () => {
                this.app.settings.changeSettings("server", server);
                this.updateServerInfo();
                this.serverList.removeClass("active");
                this.game.reconnect();
            });
        }
    }

    updateServerInfo() {
        const serverSelected = this.app.settings.data.server;
        if (Object.prototype.hasOwnProperty.call(Config.servers, serverSelected)) {
            const data = Config.servers[serverSelected];
            this.serverName.attr("textin", data.name);
            const info = this.serverInfo[serverSelected];
            this.serverPlayerCount.attr("textin", `${info.playerCount} Player${info.playerCount != 1 ? "s" : ""}`);
        }
    }

    mobileInit() {
        $("#floer-logo").remove();
        this.abandon.css("top", "10px");
        this.abandon.css("left", "10px");
        this.abandon.css("width", "20px");
        this.abandon.css("height", "20px");
        this.petalColumn.addClass("mobile");
        $("#chat-box").addClass("mobile");

        this.mobileControls.addClass("active");
        this.joystickArea.addClass("active");
        this.setupButtonEvents();
        this.setupJoystickEvents();
    }

    private setupButtonEvents(): void {
        this.buttonA.on("touchstart", () => {
            this.buttonAPressed = true;
            this.game.input.setVirtualInput("Mouse0", true);
        });

        this.buttonA.on("touchend touchcancel", () => {
            this.buttonAPressed = false;
            this.game.input.setVirtualInput("Mouse0", false);
        });

        this.buttonB.on("touchstart", () => {
            this.buttonBPressed = true;
            this.game.input.setVirtualInput("Mouse2", true);
        });

        this.buttonB.on("touchend touchcancel", () => {
            this.buttonBPressed = false;
            this.game.input.setVirtualInput("Mouse2", false);
        });
    }

    private setupJoystickEvents(): void {
        this.canvas.on("touchstart", (e: any) => {
            if (this.joystick || this.activePointerId !== null) return;
            if (!this.game.running) return;
            const touch = e.originalEvent?.touches[0];
            if (!touch) return;
            this.activePointerId = touch.identifier;
            const touchX = touch.clientX;
            const touchY = touch.clientY;
            this.joystickPosition = { x: touchX, y: touchY };
            this.createJoystick(touchX, touchY);
            this.joystickActive = true;
        });

        this.canvas.on("touchmove", (e: any) => {
            if (!this.joystick || !this.joystickHandle || this.activePointerId === null) return;

            e.preventDefault();
            const touchList = e.originalEvent?.touches;
            if (!touchList) return;

            let touch = null;
            for (let i = 0; i < touchList.length; i++) {
                if (touchList[i].identifier === this.activePointerId) {
                    touch = touchList[i];
                    break;
                }
            }

            if (!touch) return;
            const deltaX = touch.clientX - this.joystickPosition.x;
            const deltaY = touch.clientY - this.joystickPosition.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const angle = Math.atan2(deltaY, deltaX);
            const actualDistance = Math.min(distance, this.joystickRadius - this.handleRadius);
            const x = Math.cos(angle) * actualDistance;
            const y = Math.sin(angle) * actualDistance;
            this.joystickHandle.css({
                transform: `translate(${x}px, ${y}px)`
            });
            this.joystickDirection = angle;
            this.joystickDistance = Math.min(distance, this.joystickRadius - this.handleRadius);
            this.updateVirtualMousePosition();
        });

        this.canvas.on("touchend touchcancel", (e: any) => {
            const touchList = e.originalEvent?.changedTouches;
            if (!touchList) return;

            for (let i = 0; i < touchList.length; i++) {
                if (touchList[i].identifier === this.activePointerId) {
                    this.removeJoystick();
                    this.activePointerId = null;
                    this.joystickActive = false;

                    this.joystickDirection = 0;
                    this.joystickDistance = 0;

                    this.updateVirtualMousePosition();
                    break;
                }
            }
        });
    }

    private createJoystick(x: number, y: number): void {
        this.joystick = $("<div class='joystick'></div>");
        this.joystickHandle = $("<div class='joystick-handle'></div>");
        this.joystick.append(this.joystickHandle);
        this.joystick.css({
            left: `${x - this.joystickRadius}px`,
            top: `${y - this.joystickRadius}px`
        });
        this.joystickArea.append(this.joystick);
    }

    private removeJoystick(): void {
        if (this.joystick) {
            this.joystick.remove();
            this.joystick = null;
            this.joystickHandle = null;
        }
    }

    private updateVirtualMousePosition(): void {
        if (!this.joystickActive) {
            this.game.input.setVirtualMousePosition(
                window.innerWidth / 2,
                window.innerHeight / 2
            );
            return;
        }
        const scale = 5;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const mouseX = centerX + Math.cos(this.joystickDirection) * this.joystickDistance * scale;
        const mouseY = centerY + Math.sin(this.joystickDirection) * this.joystickDistance * scale;
        this.game.input.setVirtualMousePosition(mouseX, mouseY);
    }

    initSettingsDialog() {
        this.initCheckbox(this.keyboardMovement, "keyboardMovement");
        this.initCheckbox(this.newControl, "newControl");
        this.initCheckbox(this.blockMytAnn, "blockMytAnn");
        this.initCheckbox(this.screenShake, "screenShake");
    }

    initCheckbox(jq: JQuery, key: keyof SettingsData) {
        jq.prop("checked", this.app.settings.data[key]);

        jq.on("click", (e: Event) => {
            this.app.settings.changeSettings(
                key, jq.prop("checked")
            );
        });
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

    spawnRandomEntity(): void {
        if (this.game.running) {
            // stop spawning if in game
            return;
        }

        // Select a random entity from the appropriate array
        const petalType
            = this.gallery.petalGallery[Random.int(0, this.gallery.petalGallery.length - 1)];

        const entity = $(`<div class="floating-entity
            petal-${petalType}-bkg"></div>`);

        // Set random vertical position (between 5% and 95% of screen height)
        const topPosition = Math.random() * 90 + 5;

        // Set random size (between 50px and 70px) mob is 1.5x
        const size = Random.int(25, 50) * 3;

        // Set random speed in seconds (between 8 and 12 seconds to cross the screen)
        const speed = Math.random() * 4 + 8;

        // Set random rotation
        const rotation = Math.random() * 360;

        // Set random spin duration (between 8s and 20s for mobs, 5s and 15s for petals)
        const spinDuration = Math.random() * 10 + 5;

        // Apply styles
        entity.css({
            "position": "fixed",
            "top": `${topPosition}vh`,
            "left": "-100px",
            "width": `${size}px`,
            "height": `${size}px`,
            "z-index": "-6",
            "opacity": 1,
            "transform": `rotate(${rotation}deg)`,
            "pointer-events": "none",
            "border": "none", // petals have border by default?
            "--spin-duration": `${spinDuration}s`
        });

        // Add to container
        this.animationContainer.append(entity);

        // Animate movement
        entity.animate({
            left: `${window.innerWidth + 100}px`
        }, speed * 1000, "linear", function() {
            // Remove element when animation completes
            entity.animate({ opacity: 0 }, 200, () => { $(this).remove(); });
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
        this.gameInfo.attr("textin", t);
        const text = `${debug.ping.toFixed(2)}ms | ${debug.fps} FPS / ${debug.particles} Particles / ${debug.entities.loot} Loot / ${debug.entities.mobs} Mobs / ${debug.entities.petals} Petals / ${debug.entities.projectiles} Projectiles / ${debug.entities.players} Players`;
        this.debugInfo.attr("textin", text);
    }

    toggleDialog(dialog: JQuery<HTMLDivElement>): void {
        const isVDialog = dialog.hasClass("bottom-left-dialog");

        if (this.openedDialog === dialog) {
            dialog.css("animation", `close_dialog${isVDialog ? "_v" : ""} 0.5s cubic-bezier(0,0,.2,1) forwards`);
        } else if (!this.openedDialog) {
            dialog.css("animation", `open_dialog${isVDialog ? "_v" : ""} 0.5s cubic-bezier(0,.85,0,1) forwards`);
        } else if (this.openedDialog) {
            const isVOpenedDialog = this.openedDialog.hasClass("bottom-left-dialog");
            this.openedDialog.css("animation", `close_dialog${isVOpenedDialog ? "_v" : ""} 0.5s cubic-bezier(0,0,.2,1) forwards`);
            dialog.css("animation", `open_dialog${isVDialog ? "_v" : ""} 0.5s cubic-bezier(0,.85,0,1) forwards`);
        }
        this.openedDialog
            = this.openedDialog === dialog ? undefined : dialog;
    }

    showGameOverScreen(packet: GameOverPacket) {
        this.gameOverScreen.css("display", "flex");
        this.gameOverScreen.css("opacity", "0");

        this.gameOverMurderer.attr("textin", packet.murderer);
        const kills = `You killed ${packet.kills} flower${packet.kills != 1 ? "s" : ""} this run.`;
        this.gameOverKills.attr("textin", kills);

        this.gameOverScreen.animate({
            opacity: "1"
        }, () => {
            if (
                this.game.playerData.has(this.game.activePlayerID)
            ) this.gameOverScreen.css("display", "none");
        });
    }

    showOverleveled(time?: number) {
        if (!time && time !== 0) {
            this.moveHigh.css("display", "none");
            return;
        }

        let content = `${time}s`;
        if (time <= 0) content = "MOVE NOW";
        this.moveHigh.css("display", "block");
        this.moveHighTime.attr("textin", content);
    }

    chatMessages: ChatMessage[] = [];

    receiveChatMessage(msg: ChatData) {
        if (
            this.app.settings.data.blockMytAnn
            && (msg.content.startsWith("The Mythic") || msg.content.startsWith("A Mythic"))
        ) return;

        const jq = $(
            `<div
                class="chat-message"
                style="color: #${msg.color.toString(16)}; transform: translateX(-150%);"
            ></div>`
        );

        jq.attr("textin", msg.content);

        this.chatMessagesBox.append(jq);

        setTimeout(() => {
            jq.css({
                transition: "transform 0.5s cubic-bezier(0,.65,0,1)",
                transform: "translateX(0px)"
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
        ChatChannel.Local
    ];

    chattingChannel: ChatChannel = ChatChannel.Global;

    changeChatChannel() {
        let index = this.changeableChannel.indexOf(this.chattingChannel) + 1;
        if (index >= this.changeableChannel.length) {
            index = 0;
        }
        this.chattingChannel = this.changeableChannel[index];

        this.chatChannel.attr("textin", `[${ChatChannel[this.changeableChannel[index]]}]`);
    }

    scrollToEnd(jq: JQuery<HTMLDivElement>) {
        const scrollHeight = jq[0].scrollHeight;
        const height = jq.height() ?? scrollHeight;
        const scrollPosition = scrollHeight - height;
        jq.scrollTop(scrollPosition);
    }

    renderGame(): void {
        if (!this.chatInput.hasClass("focused")) {
            for (const chatMessage of this.chatMessages) {
                chatMessage.updateOpacity();
            }
        }
    }

    startTransition(expanding = true) {
        if (this.transitionRunning) { return; }

        if (!this.inGameScreen || !this.transitionRing) return;
        this.transitionRing.css("opacity", "1"); // this need to show up nomatter what

        this.transitionRunning = true;

        // Common animation setup
        let radius = expanding ? 0 : window.innerWidth; // Start from 0 or maxRadius

        const maxRadius = window.innerWidth;
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
            this.outGameScreen.css({ display: "block" });
            this.outGameScreen.css({ "z-index": "4" });
            // it seems like you cant perfectly sort their zLayer so fade gameover screen out.
            // opacity needs to be set back to 1 so that it shows up next death
            this.gameOverScreen.animate({ opacity: 0 }, 250, () => {
                this.gameOverScreen.css({
                    display: "none",
                    opacity: "1"
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
                width: `${diameter}px`,
                height: `${diameter}px`
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (!expanding) {
                // case: animation finished, expanding is false.
                this.inGameScreen.css({
                    visibility: "hidden",
                    opacity: "0"
                });
                this.transitionRing.css({
                    opacity: "0"
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
                    width: `${diameter}px`,
                    height: `${diameter}px`
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
            return Numeric.clamp(
                (1
                - (timePassed - messageHidingTime) / (messageExistTime - messageHidingTime)
                ), 0, 1
            );
        }
        return 1;
    }

    updateOpacity(force?: number) {
        if (!force) {
            const opacity = this.getOpacity();
            return this.jq.css("opacity", opacity);
        }
        this.jq.css("opacity", force);
    }
}
