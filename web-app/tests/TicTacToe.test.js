const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const load_game = async function () {
    const html = fs.readFileSync(
        path.resolve(__dirname, "../index.html"),
        "utf8"
    );

    const dom = new JSDOM(html, {
        runScripts: "dangerously",
        resources: "usable",
        pretendToBeVisual: true,
        beforeParse(window) {
            window.HTMLCanvasElement.prototype.getContext = () => ({
                clearRect() {},
                beginPath() {},
                moveTo() {},
                lineTo() {},
                stroke() {},
                arc() {},
            });

            window.HTMLCanvasElement.prototype.getBoundingClientRect =
                function () {
                    return { left: 0, top: 0 };
                };

            window.console.log = () => {};
        },
    });

    await new Promise((resolve) => {
        dom.window.addEventListener("load", () => setTimeout(resolve, 0));
    });

    return dom;
};

const status = (dom) => {
    const element = dom.window.document.getElementById("status");
    return element.innerText ?? element.textContent;
};

const start = (dom) => {
    dom.window.document.getElementById("reset").click();
};

const click_cell = function (dom, row, column) {
    const canvas = dom.window.document.getElementById("can");
    const size = canvas.width / 3;

    canvas.dispatchEvent(
        new dom.window.MouseEvent("click", {
            clientX: column * size + size / 2,
            clientY: row * size + size / 2,
            bubbles: true,
        })
    );
};

const play = (dom, moves) => {
    moves.forEach(([row, column]) => click_cell(dom, row, column));
};

describe("Tic-Tac-Toe game-end behaviour", function () {
    let dom;

    afterEach(function () {
        if (dom) dom.window.close();
    });

    const ended_games = [
        {
            name: "Player X wins with a horizontal line",
            moves: [
                [0, 0], [1, 0],
                [0, 1], [1, 1],
                [0, 2],
            ],
            expected: "Player X wins!",
        },
        {
            name: "Player O wins with a vertical line",
            moves: [
                [0, 0], [0, 1],
                [0, 2], [1, 1],
                [1, 0], [2, 1],
            ],
            expected: "Player O wins!",
        },
        {
            name: "Player X wins with a diagonal line",
            moves: [
                [0, 0], [0, 1],
                [1, 1], [0, 2],
                [2, 2],
            ],
            expected: "Player X wins!",
        },
        {
            name: "The game ends in a draw",
            moves: [
                [0, 0], [0, 1], [0, 2],
                [1, 1], [1, 0], [1, 2],
                [2, 1], [2, 0], [2, 2],
            ],
            expected: "DRAW!",
        },
    ];

    ended_games.forEach(({ name, moves, expected }) => {
        it(name, async function () {
            dom = await load_game();
            start(dom);
            play(dom, moves);

            assert.equal(
                status(dom),
                expected,
                `Unexpected result for: ${name}`
            );
        });
    });
});
