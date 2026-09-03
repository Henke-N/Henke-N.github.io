(() => {
    "use strict";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    const sectionLinks = $$('.section-nav-links a[href^="#"]');
    const sections = sectionLinks
        .map((link) => $(link.getAttribute("href")))
        .filter(Boolean);

    const pointer = $(".nav-pointer");
    const degreeReadout = $(".nav-readout");
    const markerContainer = $(".nav-section-markers");
    const minorMarkerContainer = $(".nav-minor-markers");

    let sectionTriggerPositions = [];
    let activeSectionId = null;

    function calculateNavigationScale() {
        if (!pointer || !markerContainer || !minorMarkerContainer || sections.length === 0) {
            return;
        }

        const maxScroll = Math.max(
            0,
            document.documentElement.scrollHeight - window.innerHeight
        );
        const observationOffset = window.innerHeight * 0.42;

        sectionTriggerPositions = sections.map((section) => {
            const targetScroll = section.offsetTop - observationOffset;
            return Math.max(0, Math.min(maxScroll, targetScroll));
        });

        minorMarkerContainer.replaceChildren();

        for (let i = 0; i <= 20; i++) {
            const marker = document.createElement("span");
            marker.className = "nav-minor-marker";
            marker.style.left = `${i * 5}%`;
            minorMarkerContainer.appendChild(marker);
        }

        markerContainer.replaceChildren();

        sectionTriggerPositions.forEach((position) => {
            const marker = document.createElement("span");
            marker.className = "nav-section-marker";
            const percentage = maxScroll > 0 ? position / maxScroll : 0;
            marker.style.left = `${percentage * 100}%`;
            markerContainer.appendChild(marker);
        });

        updateNavigation();
    }

    function updateNavigation() {
        if (!pointer) {
            return;
        }

        const maxScroll = Math.max(
            0,
            document.documentElement.scrollHeight - window.innerHeight
        );
        const scrollPosition = Math.max(0, Math.min(maxScroll, window.scrollY));
        const progress = maxScroll > 0 ? scrollPosition / maxScroll : 0;

        pointer.style.left = `${progress * 100}%`;

        if (degreeReadout) {
            degreeReadout.textContent = `${String(
                Math.round(progress * 360)
            ).padStart(3, "0")}°`;
        }

        let currentIndex = 0;

        sectionTriggerPositions.forEach((position, index) => {
            if (scrollPosition >= position) {
                currentIndex = index;
            }
        });

        sectionLinks.forEach((link, index) => {
            link.classList.toggle("active", index === currentIndex);
        });

        const nextSectionId = sections[currentIndex]?.id || "home";

        if (nextSectionId !== activeSectionId) {
            activeSectionId = nextSectionId;
            window.dispatchEvent(
                new CustomEvent("portfolio:sectionchange", {
                    detail: { id: nextSectionId }
                })
            );
        }
    }

    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function goTo(target) {
        const element = typeof target === "string" ? $(target) : target;
        element?.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "start"
        });
    }

    let noticeTimer = null;

    function showNotice(message) {
        let notice = $(".terminal-notice");

        if (!notice) {
            notice = document.createElement("div");
            notice.className = "terminal-notice";
            notice.setAttribute("role", "status");
            document.body.appendChild(notice);
        }

        notice.textContent = message;
        notice.classList.add("visible");
        window.clearTimeout(noticeTimer);
        noticeTimer = window.setTimeout(() => {
            notice.classList.remove("visible");
        }, 1800);
    }

    async function copyEmail() {
        const email = "henke_0106@hotmail.com";

        try {
            await navigator.clipboard.writeText(email);
        } catch {
            const field = document.createElement("textarea");
            field.value = email;
            field.setAttribute("readonly", "");
            field.style.position = "fixed";
            field.style.opacity = "0";
            document.body.appendChild(field);
            field.select();
            document.execCommand("copy");
            field.remove();
        }

        showNotice("EMAIL COPIED");
    }

    $$('[data-copy-email]').forEach((button) => {
        button.addEventListener("click", copyEmail);
    });

    const palette = $(".command-palette");
    const commandInput = $(".command-input");
    const commandList = $(".command-list");
    const projectCards = $$(".project-card");

    const commands = [
        { label: "HOME", hint: "GO TO COVER", keywords: "top start", run: () => goTo("#home") },
        { label: "PROJECTS", hint: "GO TO SELECTED WORK", keywords: "work portfolio", run: () => goTo("#projects") },
        { label: "CMP REMOVAL MODEL", hint: "PRJ-001", keywords: "cmp thesis validation process model", run: () => goTo(projectCards[0]) },
        { label: "CMP RECIPE OPTIMISER", hint: "PRJ-002", keywords: "cmp python slsqp pressure recipe", run: () => goTo(projectCards[1]) },
        { label: "GAS ATOMISATION CFD", hint: "PRJ-003", keywords: "cfd ansys fluent bachelor", run: () => goTo(projectCards[2]) },
        { label: "CV", hint: "GO TO EXPERIENCE", keywords: "education background", run: () => goTo("#cv") },
        { label: "CONTACT", hint: "GO TO DIRECT LINKS", keywords: "email links", run: () => goTo("#contact") },
        { label: "COPY EMAIL", hint: "COPY TO CLIPBOARD", keywords: "contact address", run: copyEmail },
        {
            label: "GITHUB",
            hint: "OPEN EXTERNAL",
            keywords: "code source",
            run: () => window.open("https://github.com/Henke-N", "_blank", "noopener,noreferrer")
        },
        {
            label: "LINKEDIN",
            hint: "OPEN EXTERNAL",
            keywords: "profile employment",
            run: () => window.open(
                "https://www.linkedin.com/in/henrik-hedlin-206ba3263/",
                "_blank",
                "noopener,noreferrer"
            )
        },
        {
            label: "TOGGLE SKY MOTION",
            hint: "DISPLAY CONTROL",
            keywords: "reduce pause animation meteor",
            run: () => {
                const enabled = window.portfolioSky?.toggleMotion();
                showNotice(enabled ? "SKY MOTION ON" : "SKY MOTION OFF");
            }
        },
        {
            label: "TOGGLE STAR DENSITY",
            hint: "DISPLAY CONTROL",
            keywords: "reduce background stars",
            run: () => {
                const mode = window.portfolioSky?.toggleDensity();
                showNotice(`STAR DENSITY ${mode || "UNCHANGED"}`);
            }
        }
    ];

    let visibleCommands = commands;
    let selectedCommandIndex = 0;

    function renderCommands() {
        if (!commandList) {
            return;
        }

        commandList.replaceChildren();

        if (visibleCommands.length === 0) {
            const empty = document.createElement("div");
            empty.className = "command-empty";
            empty.textContent = "NO MATCHING COMMAND";
            commandList.appendChild(empty);
            return;
        }

        visibleCommands.forEach((command, index) => {
            const button = document.createElement("button");
            const label = document.createElement("span");
            const hint = document.createElement("span");

            button.className = "command-item";
            button.type = "button";
            button.setAttribute("role", "option");
            button.setAttribute("aria-selected", String(index === selectedCommandIndex));
            label.textContent = command.label;
            hint.className = "command-item-hint";
            hint.textContent = command.hint;
            button.append(label, hint);

            button.addEventListener("pointerenter", () => {
                if (selectedCommandIndex !== index) {
                    selectedCommandIndex = index;
                    renderCommands();
                }
            });
            button.addEventListener("click", () => runCommand(index));
            commandList.appendChild(button);
        });
    }

    function filterCommands() {
        const query = commandInput?.value.trim().toLowerCase() || "";
        visibleCommands = commands.filter((command) =>
            `${command.label} ${command.keywords}`.toLowerCase().includes(query)
        );
        selectedCommandIndex = 0;
        renderCommands();
    }

    function openCommands() {
        if (!palette || !commandInput) {
            return;
        }

        palette.hidden = false;
        document.body.classList.add("command-open");
        commandInput.value = "";
        filterCommands();
        window.requestAnimationFrame(() => commandInput.focus());
    }

    function closeCommands() {
        if (!palette) {
            return;
        }

        palette.hidden = true;
        document.body.classList.remove("command-open");
    }

    function runCommand(index) {
        const command = visibleCommands[index];
        if (!command) {
            return;
        }
        closeCommands();
        command.run();
    }

    commandInput?.addEventListener("input", filterCommands);
    palette?.addEventListener("click", (event) => {
        if (event.target === palette) {
            closeCommands();
        }
    });
    $$('[data-open-command]').forEach((button) => {
        button.addEventListener("click", openCommands);
    });

    let observation = null;

    function openObservation(figure) {
        const source = $("img", figure);
        if (!source) {
            return;
        }

        if (!observation) {
            observation = document.createElement("div");
            observation.className = "observation-view";
            observation.hidden = true;
            observation.setAttribute("role", "dialog");
            observation.setAttribute("aria-modal", "true");
            observation.setAttribute("aria-label", "Expanded project figure");
            observation.innerHTML = `
                <button class="observation-close" type="button">[ ESC / CLOSE ]</button>
                <div class="observation-frame">
                    <div class="observation-meta"></div>
                    <img class="observation-image" alt="">
                    <div class="observation-caption"></div>
                </div>
            `;
            document.body.appendChild(observation);
            observation.addEventListener("click", (event) => {
                if (event.target === observation || event.target.closest(".observation-close")) {
                    closeObservation();
                }
            });
        }

        const image = $(".observation-image", observation);
        image.src = source.currentSrc || source.src;
        image.alt = source.alt;
        $(".observation-meta", observation).textContent =
            figure.dataset.observationMeta || "OBSERVATION PLATE";
        $(".observation-caption", observation).textContent =
            $("figcaption", figure)?.innerText.trim() || "";
        observation.hidden = false;
        document.body.classList.add("observation-open");
        $(".observation-close", observation)?.focus();
    }

    function closeObservation() {
        if (!observation) {
            return;
        }
        observation.hidden = true;
        document.body.classList.remove("observation-open");
    }

    document.addEventListener("click", (event) => {
        const figure = event.target.closest(".project-card .project-figure[data-observe]");
        if (figure) {
            event.preventDefault();
            openObservation(figure);
        }
    });

    const skyLabel = $(".sky-label");

    window.addEventListener("portfolio:skyhover", (event) => {
        const detail = event.detail;
        if (!skyLabel || !detail) {
            if (skyLabel) {
                skyLabel.hidden = true;
            }
            return;
        }

        const title = document.createElement("strong");
        const coordinates = document.createElement("span");
        title.textContent = detail.isPolaris
            ? "α UMi / POLARIS"
            : `${detail.id.toUpperCase()} / ${detail.name.toUpperCase()}`;
        coordinates.textContent =
            `RA ${Number(detail.ra).toFixed(2)}h · ` +
            `DEC ${Number(detail.dec).toFixed(2)}° · ` +
            `MAG ${Number(detail.magnitude).toFixed(2)}`;
        skyLabel.replaceChildren(title, coordinates);

        if (detail.isPolaris) {
            const note = document.createElement("em");
            note.textContent = "NAVIGATION REFERENCE · CLICK FOR HOME";
            skyLabel.appendChild(note);
        }

        skyLabel.style.left = `${Math.max(8, Math.min(window.innerWidth - 300, detail.clientX + 15))}px`;
        skyLabel.style.top = `${Math.max(8, Math.min(window.innerHeight - 90, detail.clientY + 15))}px`;
        skyLabel.hidden = false;
    });

    window.addEventListener("portfolio:polaris", () => goTo("#home"));

    document.addEventListener("keydown", (event) => {
        const isEditable = event.target.matches(
            "input, textarea, select, [contenteditable='true']"
        );

        if (
            (event.key === "/" && !isEditable) ||
            ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")
        ) {
            event.preventDefault();
            openCommands();
            return;
        }

        if (observation && !observation.hidden) {
            if (event.key === "Escape") {
                closeObservation();
            }
            return;
        }

        if (!palette || palette.hidden) {
            return;
        }

        if (event.key === "Escape") {
            closeCommands();
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            selectedCommandIndex = visibleCommands.length
                ? Math.min(
                    visibleCommands.length - 1,
                    selectedCommandIndex + 1
                )
                : 0;
            renderCommands();
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            selectedCommandIndex = Math.max(0, selectedCommandIndex - 1);
            renderCommands();
        } else if (event.key === "Enter") {
            event.preventDefault();
            runCommand(selectedCommandIndex);
        }
    });

    window.addEventListener("scroll", updateNavigation, { passive: true });
    window.addEventListener("resize", calculateNavigationScale);
    window.addEventListener("load", calculateNavigationScale);
    document.fonts?.ready.then(calculateNavigationScale);

    renderCommands();
    calculateNavigationScale();
})();
