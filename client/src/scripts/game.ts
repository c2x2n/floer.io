import { UI } from "@/ui.ts";
import { EntityPool } from "@common/utils/entityPool";
import { ClientPlayer } from "@/scripts/entities/clientPlayer.ts";
import { Camera } from "@/scripts/render/camera";
import { ClientEntity } from "@/scripts/entities/clientEntity.ts";
import { EntityType, GameConstants } from "@common/constants.ts";
import { Inventory } from "@/scripts/inventory.ts";
import { ClientApplication } from "../main.ts";
import { JoinPacket } from "@common/packets/joinPacket.ts";
import { GameBitStream, Packet, PacketStream } from "@common/net.ts";
import { EntitiesNetData, UpdatePacket } from "@common/packets/updatePacket.ts";
import { ClientPetal } from "@/scripts/entities/clientPetal.ts";
import { Input } from "@/scripts/input.ts";
import { InputPacket } from "@common/packets/inputPacket.ts";
import { ClientMob } from "@/scripts/entities/clientMob.ts";
import { GameOverPacket } from "@common/packets/gameOverPacket.ts";
import { Tween } from '@tweenjs/tween.js';
import { ClientLoot } from "@/scripts/entities/clientLoot.ts";
import { ClientProjectile } from "@/scripts/entities/clientProjectile.ts";
import { Config } from "@/config.ts";
import { LoggedInPacket } from "@common/packets/loggedInPacket.ts";
import { Petals, SavedPetalDefinitionData } from "@common/definitions/petal.ts";
import { ChatChannel, ChatPacket } from "@common/packets/chatPacket.ts";
import { ClientWall } from "@/scripts/entities/clientWall.ts";
import { Settings } from "@/settings.ts";
import { Minimap } from "@/scripts/render/minimap.ts";
import { Leaderboard } from "@/scripts/render/leaderboard.ts";
import { ExpUI } from "@/scripts/render/expUI.ts";
import { ParticleManager } from "@/scripts/utils/particle.ts";
import { Bossbar } from "@/scripts/render/bossbar.ts";

const typeToEntity = {
    [EntityType.Player]: ClientPlayer,
    [EntityType.Petal]: ClientPetal,
    [EntityType.Mob]: ClientMob,
    [EntityType.Loot]: ClientLoot,
    [EntityType.Projectile]: ClientProjectile,
    [EntityType.Wall]: ClientWall
}


export class Game {
    socket?: WebSocket | undefined;

    readonly app: ClientApplication;
    readonly ui: UI;

    running = false;

    // This means which player are controlled by the user
    activePlayerID = -1;

    gameWidth: number = 0;
    gameHeight: number = 0;

    screenWidth: number = 0;
    screenHeight: number = 0;

    debug: {
        fps: number,
        ping: number,
        particles: number,
        entities: {
            mobs: number,
            loot: number,
            projectiles: number,
            players: number,
            petals: number,
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
            petals: 0,
        }
    }

    private lastPingTime: number = 0;
    private pingSentTime: number = 0;

    tweens = new Set<Tween>;
    private lastUpdateTime: number = 0;

    get activePlayer(): ClientPlayer | undefined {
        if (this.activePlayerID) return this.entityPool.get(this.activePlayerID) as ClientPlayer;
        return undefined;
    }

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

    constructor(app: ClientApplication) {
        this.app = app;
        this.ui = app.ui;
        this.inventory = new Inventory(this);
        this.settings = app.settings;
    }

    inventory: Inventory;

    serverDt: number = 0;

    addTween(tween: Tween, resolve?: Function): Tween {
        this.tweens.add(tween);
        tween.start();
        tween.onComplete(() => {
            this.removeTween(tween);
            if(resolve) resolve();
        })
        return tween
    }

    removeTween(tween: Tween): void {
        this.tweens.delete(tween);
    }

    async init() {
        window.onresize = () => {
            this.resize();
        }

        this.resize();

        this.inventory.updatePetalRows();

        this.connect(Config.address);
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

        this.running = true;

        this.ui.startTransition(true);
        this.inventory.loadInventoryData(loggedInPacket.inventory)
        this.inventory.updatePetalRows();
        this.render();
    }

    endGame() {
        this.running = false;

        for (const entity of this.entityPool) {
            entity.destroy();
        }

        // this.camera.clear();
        this.entityPool.clear();
        this.activePlayerID = -1;
        this.playerData.clear();
        this.needUpdateEntities.clear();
        this.tweens.clear();

        this.ui.startTransition(false);

        this.inventory.updatePetalRows();
        this.inventory.keyboardSelectingPetal = undefined;
    }

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
                    break;
                }
            }
        }
    }

    needUpdateEntities = new Map<ClientEntity, EntitiesNetData[EntityType]>();

    updateFromPacket(packet: UpdatePacket): void {
        if (!this.running) return;

        this.serverDt = (Date.now() - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = Date.now();

        if (packet.playerDataDirty.id) {
            this.activePlayerID = packet.playerData.id;
        }

        if (packet.playerDataDirty.zoom) {
            this.camera.zoom = packet.playerData.zoom;
            this.camera.resize()
        }

        if (packet.playerDataDirty.slot)  {
            this.inventory.setSlotAmount(packet.playerData.slot, GameConstants.player.defaultPrepareSlot);
        }

        if (packet.playerDataDirty.inventory) {
            this.inventory.loadInventoryData(packet.playerData.inventory);
        }

        // if (packet.playerDataDirty.exp) {
        //     this.exp.exp = packet.playerData.exp;
        // }

        if (packet.playerDataDirty.overleveled) {
            this.ui.showOverleveled(packet.playerData.overleveled);
        }else {
            this.ui.showOverleveled();
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
            })
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
                console.warn(`Unknown partial Entity with ID ${entityPartialData.id}`)
                continue;
            }
            this.needUpdateEntities.set(entity, entityPartialData.data);
        }

        if (packet.chatDirty) {
            packet.chatMessages.forEach((msg) => {
                this.ui.receiveChatMessage(msg)
            })
        }

        if (packet.mapDirty) {
            this.gameWidth = packet.map.width;
            this.gameHeight = packet.map.height;

            this.app.renderer.initWorldMap();
            this.miniMap.resize();
        }
    }

    sendPacket(packet: Packet) {
        if (!this.socket) {
            this.connect(Config.address);
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
            GameConstants.player.defaultPreparationPetals,
        )

        this.inventory.updatePetalRows();
    }

    sendJoin(): void {
        const joinPacket = new JoinPacket();
        const name = this.ui.nameInput.val();
        joinPacket.name = name ? name : GameConstants.player.defaultName;
        joinPacket.secret = localStorage.getItem("secret") ?? "";
        const petals = JSON.parse(localStorage.getItem("petals") ?? "[]");
        if (petals instanceof Array && petals.length > 0) {
            let petalData: SavedPetalDefinitionData[] = [];
            for (const petal of petals) {
                petalData.push(Petals.fromStringData(petal));
            }
            joinPacket.petals = petalData;
        }
        this.sendPacket(joinPacket);
    }

    lastRenderTime = Date.now();
    dt: number = 0;

    render() {
        if (!this.running) return;

        this.dt = (Date.now() - this.lastRenderTime) / 1000;
        this.debug.fps = Math.round(0);
        this.lastRenderTime = Date.now();

        if (this.activePlayer) {
            this.camera.position = this.activePlayer.container.position;
        }

        this.camera.render();
        this.app.renderer.render();

        this.ui.render();

        for (const needUpdateEntity of this.needUpdateEntities) {
            if (!needUpdateEntity) continue;
            needUpdateEntity[0].updateFromData(needUpdateEntity[1], false);
        }

        this.sendInput();

        this.tweens.forEach(tween => {
            tween.update();
        })

        this.needUpdateEntities.clear();

        window.requestAnimationFrame(() => this.render());
    }

    lastDirection: {
        direction: number;
        mouseDirection: number
    } = {direction:0,mouseDirection:0};

    sendInput() {
        const inputPacket = new InputPacket();
        inputPacket.isAttacking = this.input.isInputDown("Mouse0")
            || this.input.isInputDown("Space");
        inputPacket.isDefending = this.input.isInputDown("Mouse2")
            || this.input.isInputDown("ShiftLeft")
            || this.input.isInputDown("ShiftRight");

        const direction = this.input.moveDirection;
        inputPacket.direction = direction ?? this.lastDirection;
        this.lastDirection = inputPacket.direction;
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
        this.leaderboard.resize()
        this.expUI.resize();
        this.bossbar.resize();
    }
}
