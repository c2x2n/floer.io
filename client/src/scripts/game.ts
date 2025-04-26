import { Application, Graphics } from "pixi.js";
import { UI } from "@/ui.ts";
import { EntityPool } from "@common/utils/entityPool";
import { ClientPlayer } from "@/scripts/entities/clientPlayer.ts";
import { loadAssets } from "@/scripts/utils/pixi";
import { Camera } from "@/scripts/render/camera";
import { ClientEntity } from "@/scripts/entities/clientEntity.ts";
import { ActionType, EntityType, GameConstants } from "@common/constants.ts";
import { Inventory, PetalContainer } from "@/scripts/inventory.ts";
import { ClientApplication } from "../main.ts";
import { JoinPacket } from "@common/packets/joinPacket.ts";
import { GameBitStream, Packet, PacketStream } from "@common/net.ts";
import { EntitiesNetData, UpdatePacket } from "@common/packets/updatePacket.ts";
import { ClientPetal } from "@/scripts/entities/clientPetal.ts";
import { Input } from "@/scripts/input.ts";
import { InputPacket } from "@common/packets/inputPacket.ts";
import { Minimap } from "@/scripts/render/minimap.ts";
import { ClientMob } from "@/scripts/entities/clientMob.ts";
import { GameOverPacket } from "@common/packets/gameOverPacket.ts";
import { Tween } from '@tweenjs/tween.js';
import { ClientLoot } from "@/scripts/entities/clientLoot.ts";
import { ClientProjectile } from "@/scripts/entities/clientProjectile.ts";
import { ExpUI } from "@/scripts/render/expUI.ts";
import { Leaderboard } from "@/scripts/render/leaderboard.ts";
import { Config } from "@/config.ts";
import { LoggedInPacket } from "@common/packets/loggedInPacket.ts";
import { ParticleManager } from "@/scripts/utils/particle.ts";
import { Vec2, Vector } from "@common/utils/vector.ts";
import { Petals, SavedPetalDefinitionData } from "@common/definitions/petal.ts";
import { ChatChannel, ChatPacket } from "@common/packets/chatPacket.ts";

import { ZoneName, Zones } from "@common/zones.ts";
import { Rarity } from "@common/definitions/rarity.ts";
import { Bossbar } from "@/scripts/render/bossbar.ts";

const typeToEntity = {
    [EntityType.Player]: ClientPlayer,
    [EntityType.Petal]: ClientPetal,
    [EntityType.Mob]: ClientMob,
    [EntityType.Loot]: ClientLoot,
    [EntityType.Projectile]: ClientProjectile
}


export class Game {
    socket?: WebSocket | undefined;

    readonly app: ClientApplication;
    readonly ui: UI;
    readonly pixi = new Application();

    running = false;

    // This means which player are controlled by the user
    activePlayerID = -1;
    width: number = 0;
    height: number = 0;

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

    readonly miniMap = new Minimap(this);
    readonly exp = new ExpUI(this);
    readonly leaderboard = new Leaderboard(this);
    readonly particleManager = new ParticleManager(this);
    readonly bossbar = new Bossbar(this);

    constructor(app: ClientApplication) {
        this.app = app;
        this.ui = app.ui;
        this.inventory = new Inventory(this);
    }

    mapGraphics = new Graphics({
        zIndex: -99
    })

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
        await this.pixi.init({
            resolution: 1.5,
            resizeTo: window,
            antialias: true,
            preference: "webgl",
            autoDensity: true,
            canvas: document.getElementById("canvas") as HTMLCanvasElement
        });

        this.pixi.stop();
        this.pixi.ticker.add(
            () => this.render()
        );
        this.pixi.renderer.on("resize", () => this.resize());

        this.miniMap.init();
        this.camera.init();
        this.exp.init();
        this.leaderboard.init();
        this.bossbar.init();

        await loadAssets();
        this.inventory.updatePetalRows();

        this.connect(Config.address);
    }

    startGame(loggedInPacket: LoggedInPacket): void {
        if (this.running) return;

        this.running = true;

        this.ui.startTransition(true);

        this.pixi.start();

        this.inventory.loadInventoryData(loggedInPacket.inventory)

        this.inventory.updatePetalRows();
    }

    endGame() {
        this.running = false;

        for (const entity of this.entityPool) {
            entity.destroy();
        }

        this.camera.clear();
        this.entityPool.clear();
        this.activePlayerID = -1;
        this.playerData.clear();
        this.needUpdateEntities.clear();
        this.tweens.clear();

        this.pixi.stop();

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
        }

        if (packet.playerDataDirty.slot)  {
            this.inventory.setSlotAmount(packet.playerData.slot, GameConstants.player.defaultPrepareSlot);
        }

        if (packet.playerDataDirty.inventory) {
            this.inventory.loadInventoryData(packet.playerData.inventory);
        }

        if (packet.playerDataDirty.exp) {
            this.exp.exp = packet.playerData.exp;
        }

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
            this.width = packet.map.width;
            this.height = packet.map.height;

            this.miniMap.resize();

            const ctx = this.mapGraphics;
            ctx.clear();
            this.camera.addObject(ctx);

            const values = Object.values(Zones);

            const borderDistance = 999;

            ctx.rect(
                Camera.unitToScreen(-borderDistance),
                Camera.unitToScreen(-borderDistance),
                Camera.unitToScreen(borderDistance),
                Camera.unitToScreen(this.height + borderDistance * 2)
            ).fill(values[0].borderColor);

            ctx.rect(
                Camera.unitToScreen(this.width),
                Camera.unitToScreen(-borderDistance),
                Camera.unitToScreen(borderDistance),
                Camera.unitToScreen(this.height + borderDistance * 2)
            ).fill(values[values.length - 1].borderColor);

            for (const zonesKey in Zones) {
                const data = Zones[zonesKey as ZoneName];
                ctx.rect(
                    Camera.unitToScreen(data.x),
                    Camera.unitToScreen(data.y ?? 0),
                    Camera.unitToScreen(data.width),
                    Camera.unitToScreen(data.height ?? this.height)
                ).fill(data.backgroundColor);

                ctx.rect(
                    Camera.unitToScreen(data.x),
                    Camera.unitToScreen(-borderDistance),
                    Camera.unitToScreen(data.width),
                    Camera.unitToScreen(borderDistance)
                ).fill(data.borderColor);

                ctx.rect(
                    Camera.unitToScreen(data.x),
                    Camera.unitToScreen(this.height),
                    Camera.unitToScreen(data.width),
                    Camera.unitToScreen(borderDistance)
                ).fill(data.borderColor);
            }

            const gridSize = 2.5 * Camera.scale;
            const gridWidth = packet.map.width * Camera.scale;
            const gridHeight = packet.map.height * Camera.scale;
            for (let x = 0; x <= gridWidth; x += gridSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, gridHeight);
            }

            for (let y = 0; y <= gridHeight; y += gridSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(gridWidth, y);
            }

            ctx.stroke({
                color: 0x000000,
                alpha: 0.05,
                width: 2
            });
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

    render() {
        this.ui.renderDebug();
        if (!this.running) return;
        const dt = (Date.now() - this.lastRenderTime) / 1000;
        this.debug.fps = Math.round(this.pixi.ticker.FPS);
        this.lastRenderTime = Date.now();

        for (const needUpdateEntity of this.needUpdateEntities) {
            if (!needUpdateEntity) continue;
            needUpdateEntity[0].updateFromData(needUpdateEntity[1], false);
        }

        for (const entity of this.entityPool) {
            entity.render(dt);
        }

        if (this.activePlayer) {
            this.camera.position = this.activePlayer.container.position;
        }

        this.camera.render();
        this.miniMap.render();
        this.exp.render();
        this.leaderboard.render();
        this.particleManager.render(dt);
        this.ui.render();
        this.bossbar.render();

        this.sendInput();

        this.tweens.forEach(tween => {
            tween.update();
        })

        this.needUpdateEntities.clear();

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
        this.camera.resize();
        this.miniMap.resize();
        this.exp.resize();
        this.leaderboard.resize();
        this.bossbar.resize();
    }
}
