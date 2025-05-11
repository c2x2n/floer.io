import { Vec2 } from "@common/utils/vector.ts";
import { type Game } from "./game";
import { Geometry, halfPI, PI } from "@common/utils/math.ts";
import { DirectionIn, InputAction } from "@common/net/packets/inputPacket.ts";


export class Input {
    readonly game: Game;

    private _inputsDown: Record<string, boolean> = {};

    actionsToSend = new Set<InputAction>();

    clientDirection = 0;
    mouseMovementDistance = 0;
    isInputDown(input: string): boolean {
        return this._inputsDown[input] ?? false;
    }

    setVirtualInput(input: string, down: boolean): void {
        this._inputsDown[input] = down;
    }

    setVirtualMousePosition(x: number, y: number): void {
        this.clientDirection = Math.atan2(y - window.innerHeight / 2, x - window.innerWidth / 2);

        this.mouseMovementDistance = Vec2.length(
            Vec2.new(
                y - window.innerHeight / 2, x - window.innerWidth / 2
            )
        );
    }

    oldDirection: DirectionIn = {
        direction: 0,
        mouseDirection: 0
    };

    get direction(): DirectionIn {
        const direction = this.moveDirection ?? this.oldDirection.direction;
        const oldDirection = {
            direction,
                mouseDirection: this.clientDirection
        }
        this.oldDirection = oldDirection;
        return oldDirection;
    }

    get moveDirection(): number | undefined {
        if (this.game.app.settings.data.keyboardMovement && !this.game.playerIsOnMobile) {
            let hMove = 0;
            let vMove = 0;
            if (this.isInputDown("KeyD")) hMove += 1;
            if (this.isInputDown("KeyA")) hMove -= 1;
            if (this.isInputDown("KeyW")) vMove += 1;
            if (this.isInputDown("KeyS")) vMove -= 1;

            const hRad = -halfPI * hMove + halfPI;
            const vRad = PI / 2 * vMove + PI / 2 + halfPI;

            const hDir = Geometry.radiansToDirection(hRad);
            const vDir = Geometry.radiansToDirection(vRad);

            if (hMove != 0 && vMove != 0) {
                return Geometry.directionToRadians(Vec2.add(vDir, hDir))
            } else if (hMove != 0) {
                return hRad
            } else if (vMove != 0) {
                return vRad
            }

            return;
        }else {
            return this.clientDirection
        }
    }

    get moveDistance(): number {
        const maxDistance = 255;
        let distance: number;
        if (this.game.app.settings.data.keyboardMovement && !this.game.playerIsOnMobile) {
            if (this.moveDirection != undefined) distance = maxDistance;
            else distance = 0;
        }else {
            distance = this.mouseMovementDistance;
        }

        if (distance > maxDistance) return maxDistance;
        return distance;
    }

    clientPosition: {
        clientX: number,
        clientY: number
    } = {
        clientX: 0,
        clientY: 0
    };

    constructor(game: Game) {
        this.game = game;

        document.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });

        window.addEventListener("mousedown",
            this.handleMouseEvent.bind(this, true)
        );
        window.addEventListener("mouseup",
            this.handleMouseEvent.bind(this, false)
        );
        window.addEventListener("keydown",
            this.handleKeyboardEvent.bind(this, true));

        window.addEventListener("keyup",
            this.handleKeyboardEvent.bind(this, false))

        window.addEventListener("mousemove", e => {
            if (this.game.playerIsOnMobile) return;

            this.clientDirection = Math.atan2(e.clientY - window.innerHeight / 2, e.clientX - window.innerWidth / 2);

            this.mouseMovementDistance = Vec2.length(
                Vec2.new(
                    e.clientY - window.innerHeight / 2, e.clientX - window.innerWidth / 2
                )
            );

            this.clientPosition = {
                clientX: e.clientX,
                clientY: e.clientY
            }
        });

        window.addEventListener("touchmove", e => {
            this.clientPosition = {
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            }
        });
    }


    handleMouseEvent(down: boolean, event: MouseEvent): void {
        const key = this.getKeyFromInputEvent(event);

        this._inputsDown[key] = down;
    }

    handleKeyboardEvent(down: boolean, event: KeyboardEvent): void {
        if (!this.game.running) return;

        const key = this.getKeyFromInputEvent(event);

        const upperCaseKey = event.code;

        const input = document.querySelector("input.focused");

        if ((upperCaseKey === "Enter" || event.keyCode === 13) && down) {
            if (this.game.ui.chatInput.hasClass("focused")) {
                setTimeout(() => {
                    this.game.ui.sendChat();
                }, 100)
            } else {
                this.game.ui.openChat();
            }
            return;
        }

        if (upperCaseKey === "Tab" && down) {
            if (this.game.ui.chatInput.hasClass("focused")) {
                this.game.ui.changeChatChannel();
            }
            return event.preventDefault();
        }

        if (input) return;

        if (down) {
            if (["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].includes(event.key)) {
                const index = event.key === "0" ? 9 : +event.key - 1;
                if (this.game.app.settings.data.newControl) {
                    if (this.isInputDown("KeyT")) {
                        this.game.inventory.deleteSlot(
                            this.game.inventory.equippedPetals.length + index
                        );
                    } else {
                        this.game.inventory.switchSlot(index);
                    }
                }else {
                    this.game.inventory.switchSelectingSlotTo(index);
                }
            }

            if (!this.game.app.settings.data.newControl) {
                if (upperCaseKey === "KeyQ") {
                    this.game.inventory.moveSelectSlot(-1);
                }

                if (upperCaseKey === "KeyE") {
                    this.game.inventory.moveSelectSlot(1);
                }

                if (upperCaseKey === "KeyT") {
                    this.game.inventory.deleteSelectingSlot();
                }
            }

            if (upperCaseKey === "KeyK") {
                this.game.ui.keyboardMovement.trigger("click");
            }

            if (upperCaseKey === "KeyG") {
                this.game.app.settings.changeSettings(
                    "hitbox", !this.game.app.settings.data.hitbox
                );
            }

            if (upperCaseKey === "KeyL") {
                this.game.app.settings.changeSettings(
                    "debug", !this.game.app.settings.data.debug
                );

                this.game.ui.renderDebug();
            }

            if (upperCaseKey === "KeyX" || upperCaseKey === "KeyR") {
                this.game.inventory.transformAllSlot();
            }
        }

        this._inputsDown[key] = down;
    }

    getKeyFromInputEvent(event: MouseEvent | KeyboardEvent): string {
        let key = "";
        if (event instanceof MouseEvent) {
            key = `Mouse${event.button}`;
        }

        if (event instanceof KeyboardEvent) {
            key = event.code;
        }

        return key;
    }
}
