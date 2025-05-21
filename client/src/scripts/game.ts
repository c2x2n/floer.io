import { UI } from "../ui";
import { EntityPool } from "../../../common/src/misc/entityPool";
import { ClientPlayer } from "./entities/clientPlayer";
import { Camera } from "./render/camera";
import { ClientEntity } from "./entities/clientEntity";
import { EntityType, GameConstants } from "../../../common/src/constants";
import { Inventory } from "./inventory";
import { ClientApplication } from "../main";
import { JoinPacket } from "../../../common/src/engine/net/packets/joinPacket";
import { GameBitStream, Packet, PacketStream } from "../../../common/src/engine/net/net";
import { UpdatePacket } from "../../../common/src/engine/net/packets/updatePacket";
import { ClientPetal } from "./entities/clientPetal";
import { Input } from "./input";
import { InputPacket } from "../../../common/src/engine/net/packets/inputPacket";
import { ClientMob } from "./entities/clientMob";
import { GameOverPacket } from "../../../common/src/engine/net/packets/gameOverPacket";
import { Tween } from "@tweenjs/tween.js";
import { ClientLoot } from "./entities/clientLoot";
import { ClientProjectile } from "./entities/clientProjectile";
import { Config } from "../config";
import { LoggedInPacket } from "../../../common/src/engine/net/packets/loggedInPacket";
import { Petals, SavedPetalDefinitionData } from "../../../common/src/definitions/petals";
import { ChatChannel, ChatPacket } from "../../../common/src/engine/net/packets/chatPacket";
import { ClientWall } from "./entities/clientWall";
import { Settings } from "../settings";
import { Minimap } from "./ui/game/minimap";
import { Leaderboard } from "./ui/game/leaderboard";
import { ExpUI } from "./ui/game/expUI";
import { ParticleManager } from "./render/particle";
import { Bossbar } from "./ui/game/bossbar";
import $ from "jquery";
import { EntitiesNetData } from "../../../common/src/engine/net/entitySerializations";

const typeToEntity = {
    [EntityType.Player]: ClientPlayer,
    [EntityType.Petal]: ClientPetal,
    [EntityType.Mob]: ClientMob,
    [EntityType.Loot]: ClientLoot,
    [EntityType.Projectile]: ClientProjectile,
    [EntityType.Wall]: ClientWall
};

export class Game {
    socket?: WebSocket | undefined;

    readonly app: ClientApplication;
    readonly ui: UI;

    running = false;

    // This means which player are controlled by the user
    activePlayerID = -1;

    gameWidth = 0;
    gameHeight = 0;

    screenWidth = 0;
    screenHeight = 0;

    debug: {
        fps: number
        ping: number
        particles: number
        entities: {
            mobs: number
            loot: number
            projectiles: number
            players: number
            petals: number
        }
    } = {
            fps: 0,
            ping: 0,
            particles: 0,
            entities: {
                mobs: 0,
                loot: 0,
                projectiles: 0,
                players: 0,
                petals: 0
            }
        };

    tweens = new Set<Tween>();
    private lastUpdateTime = 0;

    get activePlayer(): ClientPlayer | undefined {
        if (this.activePlayerID) return this.entityPool.get(this.activePlayerID) as ClientPlayer;
        return undefined;
    }

    activePlayerName = "";

    readonly entityPool = new EntityPool<ClientEntity>();
    readonly playerData = new Map<number,
        { name: string, exp: number, id: number }>();

    readonly camera = new Camera(this);

    readonly input = new Input(this);

    readonly settings: Settings;

    readonly miniMap = new Minimap(this);
    readonly leaderboard = new Leaderboard(this);
    readonly expUI = new ExpUI(this);
    readonly particles = new ParticleManager(this);
    readonly bossbar = new Bossbar(this);

    readonly playerIsOnMobile: boolean = false;

    constructor(app: ClientApplication) {
        this.app = app;
        this.ui = app.ui;
        this.inventory = new Inventory(this);
        this.settings = app.settings;

        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

        const isTouchScreen = ("ontouchstart" in window) || ((navigator as any).msMaxTouchPoints > 0);

        this.playerIsOnMobile = mobileRegex.test(userAgent) || isTouchScreen;

        if (this.playerIsOnMobile) {
            this.ui.mobileInit();

            this.leaderboard.on = false;
        }
    }

    inventory: Inventory;

    serverDt = 0;

    addTween(tween: Tween, resolve?: () => void): Tween {
        this.tweens.add(tween);
        tween.start();
        tween.onComplete(() => {
            this.removeTween(tween);
            if (resolve) resolve();
        });
        return tween;
    }

    removeTween(tween: Tween): void {
        this.tweens.delete(tween);
    }

    async init() {
        window.onresize = () => {
            this.resize();
        };

        this.resize();

        this.inventory.updatePetalRows();

        this.reconnect();
    }

    getDOMCanvas() {
        const canvas = this.ui.canvas.get(0);
        if (!canvas) throw new Error("Canvas not found.");
        return canvas;
    }

    getCanvasCtx() {
        return this.app.renderer.ctx;
    }

    startGame(loggedInPacket: LoggedInPacket): void {
        if (this.running) return;

        for (const entity of this.entityPool) {
            entity.destroy();
        }

        this.running = true;

        if (this.ui.openedDialog) this.ui.toggleDialog(this.ui.openedDialog);

        if (!this.playerIsOnMobile) this.ui.hud.append(this.ui.settingsButton);
        this.ui.canvas.insertBefore(this.ui.hud);
        this.ui.canvas.css("opacity", 1);

        this.app.renderer.containers.clear();
        this.entityPool.clear();
        this.playerData.clear();
        this.needUpdateEntities.clear();
        this.tweens.clear();
        this.followID = -1;

        this.input.actionsToSend.clear();

        this.ui.startTransition(true);
        this.inventory.loadInventoryData(loggedInPacket.inventory);
        this.inventory.updatePetalRows();

        if (!this.alreadyStartedRender) {
            this.render();
            this.alreadyStartedRender = true;
        }
    }

    endGame() {
        this.running = false;

        this.ui.settingsButton.insertBefore(this.ui.creditButton);
        this.ui.canvas.css("opacity", 0.8);
        const body = $("body");

        body.append(this.ui.canvas);
        body.css("background-size", "0");
        this.ui.stopRandomEntityAnimation();
        $(".floating-entity").remove();

        this.ui.startTransition(false);
        this.ui.gallery.renderPetalGallery();
        this.ui.gallery.renderMobGallery();

        this.inventory.updatePetalRows();
        this.inventory.keyboardSelectingPetal = undefined;
    }

    get follower(): ClientEntity | undefined {
        if (this.followID) { return this.entityPool.get(this.followID)!; }
        return undefined;
    }

    followID = -1;

    onMessage(data: ArrayBuffer): void {
        const packetStream = new PacketStream(data);
        while (true) {
            const packet = packetStream.deserializeServerPacket();
            if (packet === undefined) break;

            switch (true) {
                case packet instanceof LoggedInPacket: {
                    this.startGame(packet);
                    break;
                }
                case packet instanceof UpdatePacket: {
                    this.updateFromPacket(packet);
                    break;
                }
                case packet instanceof GameOverPacket: {
                    this.ui.showGameOverScreen(packet);
                    this.followID = packet.killerID;
                    break;
                }
            }
        }
    }

    needUpdateEntities = new Map<ClientEntity, EntitiesNetData[EntityType]>();

    updateFromPacket(packet: UpdatePacket): void {
        this.serverDt = (Date.now() - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = Date.now();

        this.debug.ping = performance.now() - this.lastPingTime;
        this.lastPingTime = performance.now();

        if (packet.playerDataDirty.id) {
            this.activePlayerID = packet.playerData.id;
            this.followID = this.activePlayerID;
        }

        if (packet.playerDataDirty.zoom) {
            this.camera.zoom = packet.playerData.zoom;
            this.camera.resize();
        }

        if (packet.playerDataDirty.slot) {
            this.inventory.setSlotAmount(packet.playerData.slot, GameConstants.player.defaultPrepareSlot);
        }

        if (packet.playerDataDirty.inventory) {
            this.inventory.loadInventoryData(packet.playerData.inventory);
        }

        if (packet.playerDataDirty.exp) {
            this.expUI.exp = packet.playerData.exp;
        }

        if (packet.playerDataDirty.overleveled) {
            this.ui.showOverleveled(packet.playerData.overleveled);
        } else {
            this.ui.showOverleveled();
        }

        if (packet.playerDataDirty.collect) {
            packet.playerData.collect.forEach(e => {
                this.ui.gallery.addMobGallery(e);
            });
        }

        for (const id of packet.deletedEntities) {
            this.entityPool.get(id)?.destroy();
            this.entityPool.deleteByID(id);
        }

        this.playerData.clear();
        for (const newPlayer of packet.players) {
            this.playerData.set(newPlayer.id, {
                name: newPlayer.name,
                exp: newPlayer.exp,
                id: newPlayer.id
            });
        }

        for (const entityData of packet.fullEntities) {
            let entity = this.entityPool.get(entityData.id);

            let isNew = false;
            if (!entity) {
                isNew = true;
                entity = new typeToEntity[entityData.type](this, entityData.id);
                this.entityPool.add(entity);
            }
            entity.updateFromData(entityData.data, isNew);
        }

        for (const entityPartialData of packet.partialEntities) {
            const entity = this.entityPool.get(entityPartialData.id);

            if (!entity) {
                console.warn(`Unknown partial Entity with ID ${entityPartialData.id}`);
                continue;
            }
            this.needUpdateEntities.set(entity, entityPartialData.data);
        }

        if (packet.chatDirty) {
            packet.chatMessages.forEach(msg => {
                this.ui.receiveChatMessage(msg);
            });
        }

        if (packet.petalData.length) {
            this.inventory.petalData = packet.petalData;
        }

        if (packet.mapDirty) {
            this.gameWidth = packet.map.width;
            this.gameHeight = packet.map.height;

            this.app.renderer.initWorldMap();
            this.miniMap.update();
            this.miniMap.resize();
        }
    }

    reconnect() {
        this.socket?.close();
        if (Object.prototype.hasOwnProperty.call(Config.servers, this.app.settings.data.server)) {
            this.connect(`${Config.servers[this.app.settings.data.server].address}play`);
        }
    }

    sendPacket(packet: Packet) {
        if (!this.socket || this.socket.readyState === this.socket.CLOSED) {
            this.reconnect();
        }

        if (this.socket && this.socket.readyState === this.socket.OPEN) {
            const packetStream = new PacketStream(GameBitStream.create(128));
            packetStream.serializeClientPacket(packet);
            this.socket.send(packetStream.getBuffer());
        }
    }

    connect(address: string) {
        this.ui.readyButton.prop("disabled", true);

        this.socket = new WebSocket(address);

        this.socket.binaryType = "arraybuffer";

        this.socket.onmessage = msg => {
            this.onMessage(msg.data);
        };

        this.socket.onopen = () => {};

        this.socket.onclose = () => {
            this.endGame();
        };

        this.socket.onerror = error => {
            console.error(error);
            this.endGame();
        };

        this.inventory.setSlotAmount(GameConstants.player.defaultSlot, GameConstants.player.defaultPrepareSlot);
        this.inventory.loadArrays(
            GameConstants.player.defaultEquippedPetals,
            GameConstants.player.defaultPreparationPetals
        );

        this.inventory.updatePetalRows();
    }

    sendJoin(): void {
        const joinPacket = new JoinPacket();
        const name = this.ui.nameInput.val();
        joinPacket.name = name ? name : GameConstants.player.defaultName;
        this.activePlayerName = joinPacket.name;
        joinPacket.secret = localStorage.getItem("secret") ?? "";
        const petals = JSON.parse(localStorage.getItem("petals") ?? "[]");
        if (petals instanceof Array && petals.length > 0) {
            const petalData: SavedPetalDefinitionData[] = [];
            for (const petal of petals) {
                petalData.push(Petals.fromStringData(petal));
            }
            joinPacket.petals = petalData;
        }
        this.sendPacket(joinPacket);
    }

    lastRenderTime = Date.now();
    dt = 0;

    lastFPSCountingTime: number = performance.now();
    FPS = 0;

    private lastPingTime = 0;
    // private pingSentTime: number = 0;

    alreadyStartedRender = false;

    render() {
        this.dt = (Date.now() - this.lastRenderTime) / 1000;

        this.lastRenderTime = Date.now();

        if (performance.now() - this.lastFPSCountingTime >= 1000) {
            this.debug.fps = this.FPS;
            this.FPS = 0;
            this.lastFPSCountingTime = performance.now();
        }
        this.FPS++;

        if (this.follower) { this.camera.position = this.follower.container.position; }

        if (this.app.settings.data.debug) { this.ui.renderDebug(); }

        this.camera.render();
        this.app.renderer.render();

        this.ui.renderGame();

        for (const needUpdateEntity of this.needUpdateEntities) {
            if (!needUpdateEntity) continue;
            needUpdateEntity[0].updateFromData(needUpdateEntity[1], false);
        }

        this.sendInput();

        this.tweens.forEach(tween => {
            tween.update();
        });

        this.needUpdateEntities.clear();

        window.requestAnimationFrame(() => this.render());
    }

    sendInput() {
        const inputPacket = new InputPacket();
        inputPacket.isAttacking = this.input.isInputDown("Mouse0")
        || this.input.isInputDown("Space");
        inputPacket.isDefending = this.input.isInputDown("Mouse2")
        || this.input.isInputDown("ShiftLeft")
        || this.input.isInputDown("ShiftRight");

        inputPacket.direction = this.input.direction;
        inputPacket.movementDistance = this.input.moveDistance;

        inputPacket.actions = Array.from(this.input.actionsToSend);
        this.input.actionsToSend.clear();

        this.sendPacket(inputPacket);
    }

    sendChat(message: string, channel: ChatChannel): void {
        const packet = new ChatPacket();
        packet.chat = message;
        packet.channel = channel;
        this.sendPacket(packet);
    }

    resize() {
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;

        const canvas = this.getDOMCanvas();
        canvas.width = this.screenWidth;
        canvas.height = this.screenHeight;

        this.miniMap.resize();
        this.leaderboard.resize();
        this.expUI.resize();
        this.bossbar.resize();
    }
}
