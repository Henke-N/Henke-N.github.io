const $ =
    (
        selector,
        root = document
    ) =>
        root.querySelector(
            selector
        );

const reducedMotion =
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );


/* ============================================================
   BASIC UTILITIES
   ============================================================ */

function goTo(selector) {

    const target =
        $(selector);

    if (!target) {
        return;
    }

    target.scrollIntoView({
        behavior:
            reducedMotion.matches
                ? "auto"
                : "smooth",

        block:
            "start"
    });
}


function openExternal(url) {

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );
}


async function copyText(text) {

    if (
        navigator.clipboard
            ?.writeText
    ) {

        return navigator
            .clipboard
            .writeText(text);
    }

    const area =
        document.createElement(
            "textarea"
        );

    area.value =
        text;

    area.style.cssText =
        "position:fixed;opacity:0";

    document.body.appendChild(
        area
    );

    area.select();

    document.execCommand(
        "copy"
    );

    area.remove();
}


function notice(message) {

    let element =
        $(".terminal-notice");

    if (!element) {

        element =
            document.createElement(
                "div"
            );

        element.className =
            "terminal-notice";

        document.body.appendChild(
            element
        );
    }

    element.textContent =
        message;

    element.classList.add(
        "visible"
    );

    clearTimeout(
        element._timer
    );

    element._timer =
        setTimeout(
            () =>
                element.classList.remove(
                    "visible"
                ),
            1400
        );
}


/* ============================================================
   COMMANDS
   ============================================================ */

const commands = [

    [
        "HOME",
        "GO TO SECTION",
        "home top",

        () =>
            goTo("#home")
    ],

    [
        "PROJECTS",
        "GO TO SECTION",
        "projects work portfolio",

        () =>
            goTo("#projects")
    ],

    [
        "CV",
        "GO TO SECTION",
        "cv experience education resume",

        () =>
            goTo("#cv")
    ],

    [
        "CONTACT",
        "GO TO SECTION",
        "contact email",

        () =>
            goTo("#contact")
    ],

    [
        "OPEN FULL CV",
        "DOCUMENT ↗",
        "resume pdf",

        () =>
            openExternal(
                "Files/Henrik_Hedlin_CV.pdf"
            )
    ],

    [
        "GITHUB",
        "EXTERNAL ↗",
        "github source code",

        () =>
            openExternal(
                "https://github.com/Henke-N"
            )
    ],

    [
        "LINKEDIN",
        "EXTERNAL ↗",
        "linkedin profile",

        () =>
            openExternal(
                "https://www.linkedin.com/in/henrik-hedlin-206ba3263/"
            )
    ],

    [
        "COPY EMAIL",
        "CLIPBOARD",
        "email mail copy",

        async () => {

            await copyText(
                "henke_0106@hotmail.com"
            );

            notice(
                "EMAIL COPIED"
            );
        }
    ],

    [
        "TOGGLE SKY MOTION",
        "DISPLAY",
        "motion meteors animation",

        () => {

            const enabled =
                window
                    .portfolioSky
                    ?.toggleMotion
                    ?.();

            notice(
                `SKY MOTION ${
                    enabled === false
                        ? "OFF"
                        : "ON"
                }`
            );
        }
    ],

    [
        "TOGGLE STAR DENSITY",
        "DISPLAY",
        "stars density background",

        () => {

            const density =
                window
                    .portfolioSky
                    ?.toggleDensity
                    ?.();

            notice(
                `SKY DENSITY ${
                    density ||
                    "CHANGED"
                }`
            );
        }
    ]
];


/* ============================================================
   COMMAND PALETTE
   ============================================================ */

const palette =
    document.createElement(
        "div"
    );

palette.className =
    "command-palette";

palette.hidden =
    true;

palette.innerHTML = `

    <div
        class="command-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Portfolio commands"
    >

        <div class="command-head">

            <span class="command-prompt">
                &gt;
            </span>

            <input
                class="command-input"
                autocomplete="off"
                spellcheck="false"
                placeholder="TYPE A COMMAND"
            >

            <span class="command-key">
                ESC
            </span>

        </div>


        <div class="command-list">
        </div>


        <div class="command-help">
            ↑↓ SELECT · ENTER OPEN · / COMMAND · G H/P/V/C NAVIGATE
        </div>

    </div>
`;

document.body.appendChild(
    palette
);


const commandInput =
    $(".command-input", palette);

const commandList =
    $(".command-list", palette);

let filteredCommands =
    commands;

let selectedCommand =
    0;


function renderCommands(
    reset = true
) {

    const query =
        commandInput
            .value
            .trim()
            .toLowerCase();

    filteredCommands =
        commands.filter(
            (
                [
                    label,
                    hint,
                    keywords
                ]
            ) =>

                `${label} ${hint} ${keywords}`
                    .toLowerCase()
                    .includes(query)
        );


    if (reset) {
        selectedCommand = 0;
    }


    selectedCommand =
        Math.max(
            0,
            Math.min(
                selectedCommand,
                filteredCommands.length -
                1
            )
        );


    if (
        filteredCommands.length ===
        0
    ) {

        commandList.innerHTML = `
            <div class="command-empty">
                NO MATCHING COMMAND
            </div>
        `;

        return;
    }


    commandList.innerHTML =
        filteredCommands
            .map(
                (
                    [
                        label,
                        hint
                    ],
                    index
                ) => `

                    <button
                        class="command-item"
                        type="button"
                        data-command-index="${index}"
                        aria-selected="${
                            index ===
                            selectedCommand
                        }"
                    >

                        <span>
                            ${label}
                        </span>

                        <span
                            class="command-item-hint"
                        >
                            ${hint}
                        </span>

                    </button>
                `
            )
            .join("");
}


function updateCommandSelection() {

    commandList
        .querySelectorAll(
            ".command-item"
        )
        .forEach(
            (
                item,
                index
            ) => {

                item.setAttribute(
                    "aria-selected",
                    index ===
                        selectedCommand
                );
            }
        );


    commandList
        .querySelector(
            `[data-command-index="${selectedCommand}"]`
        )
        ?.scrollIntoView({
            block:
                "nearest"
        });
}


function openPalette() {

    palette.hidden =
        false;

    document.body
        .classList
        .add(
            "command-open"
        );

    commandInput.value =
        "";

    renderCommands();

    requestAnimationFrame(
        () =>
            commandInput.focus()
    );
}


function closePalette() {

    palette.hidden =
        true;

    document.body
        .classList
        .remove(
            "command-open"
        );
}


async function runCommand(
    index =
        selectedCommand
) {

    const command =
        filteredCommands[
            index
        ];

    if (!command) {
        return;
    }

    closePalette();

    await command[3]();
}


commandInput.addEventListener(
    "input",
    renderCommands
);


commandInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key ===
            "ArrowDown"
        ) {

            event.preventDefault();

            selectedCommand =
                Math.min(
                    selectedCommand + 1,
                    filteredCommands.length -
                    1
                );

            updateCommandSelection();
        }


        if (
            event.key ===
            "ArrowUp"
        ) {

            event.preventDefault();

            selectedCommand =
                Math.max(
                    selectedCommand - 1,
                    0
                );

            updateCommandSelection();
        }


        if (
            event.key ===
            "Enter"
        ) {

            event.preventDefault();

            runCommand();
        }
    }
);


commandList.addEventListener(
    "click",
    (event) => {

        const item =
            event.target.closest(
                "[data-command-index]"
            );

        if (!item) {
            return;
        }

        runCommand(
            Number(
                item.dataset
                    .commandIndex
            )
        );
    }
);


palette.addEventListener(
    "pointerdown",
    (event) => {

        if (
            event.target ===
            palette
        ) {

            closePalette();
        }
    }
);


/* ============================================================
   COPY BUTTON + COMMAND BUTTON
   ============================================================ */

document.addEventListener(
    "click",
    async (event) => {

        if (
            event.target.closest(
                "[data-command-open]"
            )
        ) {

            openPalette();
        }


        const copyButton =
            event.target.closest(
                "[data-copy-email]"
            );

        if (!copyButton) {
            return;
        }

        const original =
            copyButton.textContent;

        try {

            await copyText(
                "henke_0106@hotmail.com"
            );

            copyButton.textContent =
                "[ COPIED ]";

            setTimeout(
                () => {

                    copyButton.textContent =
                        original;
                },
                1600
            );

        } catch {

            copyButton.textContent =
                "[ COPY FAILED ]";
        }
    }
);


/* ============================================================
   KEYBOARD NAVIGATION
   /       command palette
   Ctrl+K  command palette

   g h     Home
   g p     Projects
   g v     CV
   g c     Contact
   ============================================================ */

let gotoArmed =
    false;

let gotoTimer =
    null;


window.addEventListener(
    "keydown",
    (event) => {

        const typing =
            event.target.closest?.(
                "input, textarea, select, [contenteditable='true']"
            );


        if (
            event.key ===
            "Escape"
        ) {

            closePalette();
            closeObservation();

            return;
        }


        if (
            (
                event.ctrlKey ||
                event.metaKey
            ) &&
            event.key
                .toLowerCase() ===
                "k"
        ) {

            event.preventDefault();

            openPalette();

            return;
        }


        if (
            event.key === "/" &&
            !typing
        ) {

            event.preventDefault();

            openPalette();

            return;
        }


        if (
            typing ||
            !palette.hidden
        ) {
            return;
        }


        const key =
            event.key
                .toLowerCase();


        if (
            key === "g"
        ) {

            gotoArmed =
                true;

            clearTimeout(
                gotoTimer
            );

            gotoTimer =
                setTimeout(
                    () =>
                        gotoArmed =
                            false,
                    900
                );

            return;
        }


        if (!gotoArmed) {
            return;
        }


        gotoArmed =
            false;

        clearTimeout(
            gotoTimer
        );


        const destination = {

            h:
                "#home",

            p:
                "#projects",

            v:
                "#cv",

            c:
                "#contact"

        }[key];


        if (destination) {

            event.preventDefault();

            goTo(
                destination
            );
        }
    }
);


/* ============================================================
   SKY CATALOGUE LABEL
   ============================================================ */

const skyLabel =
    document.createElement(
        "div"
    );

skyLabel.className =
    "sky-label";

skyLabel.hidden =
    true;

document.body.appendChild(
    skyLabel
);


function formatRa(hours) {

    const h =
        Math.floor(hours);

    const minutes =
        Math.round(
            (
                hours -
                h
            ) *
            60
        );

    return (
        `${String(h).padStart(
            2,
            "0"
        )}h ` +
        `${String(minutes).padStart(
            2,
            "0"
        )}m`
    );
}


function formatDec(degrees) {

    const sign =
        degrees < 0
            ? "−"
            : "+";

    const absolute =
        Math.abs(
            degrees
        );

    const d =
        Math.floor(
            absolute
        );

    const minutes =
        Math.round(
            (
                absolute -
                d
            ) *
            60
        );

    return (
        `${sign}` +
        `${String(d).padStart(
            2,
            "0"
        )}° ` +
        `${String(minutes).padStart(
            2,
            "0"
        )}′`
    );
}


window.addEventListener(
    "portfolio:skyhover",
    (event) => {

        const data =
            event.detail;

        if (!data) {

            skyLabel.hidden =
                true;

            return;
        }


        skyLabel.innerHTML = `

            <strong>
                ${data.id} /
                ${data.name.toUpperCase()}
            </strong>

            <span>
                RA ${formatRa(data.ra)}
                ·
                DEC ${formatDec(data.dec)}
                ·
                MAG ${data.magnitude.toFixed(2)}
            </span>

            ${
                data.isPolaris
                    ? `
                        <em>
                            POLARIS · CLICK TO RETURN HOME
                        </em>
                    `
                    : ""
            }
        `;


        skyLabel.style.left =
            `${Math.min(
                data.clientX + 16,
                window.innerWidth -
                310
            )}px`;

        skyLabel.style.top =
            `${Math.min(
                data.clientY + 16,
                window.innerHeight -
                90
            )}px`;

        skyLabel.hidden =
            false;
    }
);


window.addEventListener(
    "portfolio:polaris",
    () =>
        goTo("#home")
);


/* ============================================================
   OBSERVATION VIEW

   This stays dormant until a project has figures.
   Activate by adding:

   data-observe
   data-observation-meta="FIG. 02 / PRJ-001"

   to a .project-figure.
   ============================================================ */

let observation =
    null;


function openObservation(
    figure
) {

    const source =
        $("img", figure);

    if (!source) {
        return;
    }


    if (!observation) {

        observation =
            document.createElement(
                "div"
            );

        observation.className =
            "observation-view";

        observation.hidden =
            true;

        observation.innerHTML = `

            <button
                class="observation-close"
                type="button"
            >
                [ ESC / CLOSE ]
            </button>

            <div class="observation-frame">

                <div
                    class="observation-meta"
                ></div>

                <img
                    class="observation-image"
                    alt=""
                >

                <div
                    class="observation-caption"
                ></div>

            </div>
        `;

        document.body.appendChild(
            observation
        );


        observation.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                        observation ||
                    event.target.closest(
                        ".observation-close"
                    )
                ) {

                    closeObservation();
                }
            }
        );
    }


    const image =
        $(
            ".observation-image",
            observation
        );

    image.src =
        source.currentSrc ||
        source.src;

    image.alt =
        source.alt;


    $(
        ".observation-meta",
        observation
    ).textContent =
        figure.dataset
            .observationMeta ||
        "OBSERVATION PLATE";


    $(
        ".observation-caption",
        observation
    ).textContent =
        $(
            "figcaption",
            figure
        )?.innerText
            .trim() ||
        "";


    observation.hidden =
        false;

    document.body
        .classList
        .add(
            "observation-open"
        );
}


function closeObservation() {

    if (!observation) {
        return;
    }

    observation.hidden =
        true;

    document.body
        .classList
        .remove(
            "observation-open"
        );
}


document.addEventListener(
    "click",
    (event) => {

        const figure =
            event.target.closest(
                ".project-card .project-figure[data-observe]"
            );

        if (!figure) {
            return;
        }

        event.preventDefault();

        openObservation(
            figure
        );
    }
);


renderCommands();