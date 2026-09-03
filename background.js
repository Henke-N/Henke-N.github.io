const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");

const WORLD_WIDTH = 8000;
const WORLD_HEIGHT = 5000;
const BACKGROUND_STAR_COUNT = 2200;
const CONSTELLATION_LINE_ALPHA = 0.11;
const CONSTELLATION_STAR_ALPHA = 0.82;

const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

let lastFrameTime = 0;

let width = 0;
let height = 0;
let cameraX = 0;
let cameraY = 0;

const backgroundStars = [];
const visibleBackgroundStars = [];

const shootingStars = [];
const renderedConstellations = [];

const SECTION_CONSTELLATIONS = {
    home: "UMi",
    projects: "Ori",
    cv: "Mic",
    contact: "Aql"
};

let activeConstellationId = SECTION_CONSTELLATIONS.home;
let motionEnabled = !window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;
let skyDensityMode = "FULL";
let skyDensityStep = 1;
let lastSkyHoverKey = null;

// Each star is:
// [right ascension in hours, declination in degrees, magnitude]
//
// Each line is an array of indexes into that constellation's stars.
//
// Everything is stored locally.
// No fetch() or external constellation file.
const constellationCatalogue = [
    {
        id: "Ant",
        name: "Antlia",
        x: 2500,
        y: 3900,
        size: 250,
        rotation: 0.2,

        lines: [
            [0, 1, 2]
        ],

        stars: [
            [10.94530963897705, -37.13780212402344, 4.6],
            [10.452529907226562, -31.06780242919922, 4.25],
            [9.487420082092285, -35.95140075683594, 4.51]
        ]
    },

    {
        id: "Aps",
        name: "Apus",
        x: 5600,
        y: 3900,
        size: 270,
        rotation: -0.15,

        lines: [
            [0, 1],
            [2, 3, 4]
        ],

        stars: [
            [14.797670364379883, -79.04469299316406, 3.83],
            [16.448299407958984, -78.79649353027344, 4.68],
            [16.339109420776367, -78.69580078125, 4.68],
            [16.718000411987305, -77.51750183105469, 4.24],
            [16.5575008392334, -78.89720153808594, 3.89]
        ]
    },

    {
        id: "Ara",
        name: "Ara",
        x: 5900,
        y: 3300,
        size: 270,
        rotation: 0.1,

        lines: [
            [0, 1, 2, 3, 4, 5, 6, 5, 7]
        ],

        stars: [
            [17.423219680786133, -56.3778076171875, 3.3],
            [17.518299102783203, -60.68389892578125, 3.6],
            [16.829750061035156, -59.04139709472656, 3.76],
            [16.976999282836914, -55.99029541015625, 3.13],
            [16.993080139160156, -53.16059875488281, 4.06],
            [17.530689239501953, -49.8760986328125, 3.0],
            [18.110530853271484, -50.091705322265625, 3.66],
            [17.42167091369629, -55.529998779296875, 2.85]
        ]
    },

    {
        id: "Aql",
        name: "Aquila",
        x: 4700,
        y: 2450,
        size: 300,
        rotation: 0.15,

        lines: [
            [0, 1, 2, 3, 4, 3, 5, 3, 6, 7],
            [8, 5],
            [4, 9],
            [7, 10, 4, 5]
        ],

        stars: [
            [19.921890258789062, 6.406700134277344, 3.71],
            [19.846389770507812, 8.868301391601562, 0.77],
            [19.770999908447266, 10.613296508789062, 2.72],
            [19.424970626831055, 3.1147003173828125, 3.4],
            [19.10413932800293, -4.882499694824219, 3.44],
            [19.09016990661621, 13.863296508789062, 2.99],
            [19.87455940246582, 1.0055999755859375, 3.78],
            [20.188419342041016, -0.8214035034179688, 3.23],
            [18.99371910095215, 15.06829833984375, 4.02],
            [19.027999877929688, -5.738899230957031, 4.02],
            [19.612030029296875, -1.2863998413085938, 4.36]
        ]
    },

    {
        id: "Cae",
        name: "Caelum",
        x: 2900,
        y: 3100,
        size: 230,
        rotation: -0.4,

        lines: [
            [0, 1, 2, 3]
        ],

        stars: [
            [5.073440074920654, -35.483299255371094, 4.55],
            [4.70097017288208, -37.14440155029297, 5.05],
            [4.676030158996582, -41.86390686035156, 4.45],
            [4.513919830322266, -44.95390319824219, 5.07]
        ]
    },

    {
        id: "Cep",
        name: "Cepheus",
        x: 5250,
        y: 1500,
        size: 300,
        rotation: -0.1,

        lines: [
            [0, 1, 2, 3, 2, 4, 3, 5, 6, 7, 8, 1],
            [9, 0]
        ],

        stars: [
            [20.75482940673828, 61.838897705078125, 3.41],
            [21.309669494628906, 62.585601806640625, 2.44],
            [21.477670669555664, 70.56079864501953, 3.19],
            [22.827999114990234, 66.20059967041016, 3.52],
            [23.655780792236328, 77.63249969482422, 3.21],
            [22.486190795898438, 58.41529846191406, 3.4],
            [22.180919647216797, 58.20109939575195, 3.35],
            [22.250560760498047, 57.04359817504883, 4.19],
            [21.725109100341797, 58.779998779296875, 4.08],
            [20.493030548095703, 62.99420166015625, 4.22]
        ]
    },

    {
        id: "Cir",
        name: "Circinus",
        x: 5100,
        y: 3400,
        size: 220,
        rotation: 0.25,

        lines: [
            [0, 1, 2]
        ],

        stars: [
            [15.291890144348145, -58.80110168457031, 4.07],
            [14.708439826965332, -64.97529602050781, 3.19],
            [15.389639854431152, -59.32080078125, 4.51]
        ]
    },

    {
        id: "Crv",
        name: "Corvus",
        x: 6200,
        y: 2600,
        size: 250,
        rotation: 0.15,

        lines: [
            [0, 1, 2, 3, 0],
            [2, 4]
        ],

        stars: [
            [12.497750282287598, -16.515602111816406, 2.95],
            [12.263440132141113, -17.541900634765625, 2.59],
            [12.168749809265137, -22.61969757080078, 3.0],
            [12.57310962677002, -23.396697998046875, 2.65],
            [12.140219688415527, -24.728897094726562, 4.0]
        ]
    },

    {
        id: "For",
        name: "Fornax",
        x: 3000,
        y: 3500,
        size: 260,
        rotation: 0.25,

        lines: [
            [0, 1, 2]
        ],

        stars: [
            [3.2011899948120117, -28.987197875976562, 3.85],
            [2.8181700706481934, -32.405799865722656, 4.46],
            [2.0748300552368164, -29.296897888183594, 4.69]
        ]
    },

    {
        id: "Lib",
        name: "Libra",
        x: 4250,
        y: 2950,
        size: 240,
        rotation: 0.1,

        lines: [
            [0, 1],
            [0, 2],
            [1, 3, 0, 3, 4, 5]
        ],

        stars: [
            [14.847970008850098, -16.041702270507812, 2.75],
            [15.28345012664795, -9.383102416992188, 2.61],
            [15.067830085754395, -25.281898498535156, 3.29],
            [15.592109680175781, -14.789398193359375, 3.91],
            [15.617079734802246, -28.13500213623047, 3.58],
            [15.644280433654785, -29.777801513671875, 3.66]
        ]
    },

    {
        id: "Mic",
        name: "Microscopium",
        x: 3650,
        y: 3350,
        size: 250,
        rotation: 0.1,

        lines: [
            [0, 1, 2, 3, 4, 0]
        ],

        stars: [
            [21.021520614624023, -32.25779724121094, 4.67],
            [21.298959732055664, -32.17250061035156, 4.71],
            [21.345989227294922, -40.80949401855469, 4.8],
            [20.808059692382812, -43.98829650878906, 5.11],
            [20.832799911499023, -33.779701232910156, 4.89]
        ]
    },

    {
        id: "Nor",
        name: "Norma",
        x: 4650,
        y: 3300,
        size: 210,
        rotation: -0.2,

        lines: [
            [0, 1, 2, 3, 0]
        ],

        stars: [
            [16.053550720214844, -49.229705810546875, 4.65],
            [16.330669403076172, -50.15550231933594, 4.02],
            [16.453079223632812, -47.55499267578125, 4.47],
            [16.108169555664062, -45.17329406738281, 4.72]
        ]
    },

    {
        id: "Ori",
        name: "Orion",
        x: 3600,
        y: 2700,
        size: 340,
        rotation: 0.05,

        lines: [
            [0, 1, 2, 1, 3, 4, 5, 4, 6, 7],
            [0, 5, 8, 9, 0],
            [10, 11, 12, 13, 14, 5, 14, 15, 16, 17],
            [0, 18, 19],
            [20, 21, 22, 23]
        ],

        stars: [
            [5.919529914855957, 7.406898498535156, 0.5],
            [5.679309844970703, -1.9428024291992188, 1.6],
            [5.795939922332764, -9.669700622558594, 2.06],
            [5.603559970855713, -1.2018966674804688, 1.7],
            [5.533440113067627, -0.29920196533203125, 2.2],
            [5.418859958648682, 6.349700927734375, 1.64],
            [5.407969951629639, -2.3968963623046875, 3.35],
            [5.242310047149658, -8.201698303222656, 0.12],
            [5.585639953613281, 9.934402465820312, 3.3],
            [5.585690021514893, 9.93499755859375, 5.6],
            [5.0761399269104, 15.404197692871094, 4.68],
            [4.939529895782471, 13.514396667480469, 4.07],
            [4.914939880371094, 10.150802612304688, 4.65],
            [4.843530178070068, 8.900299072265625, 4.37],
            [4.83066987991333, 6.961402893066406, 3.19],
            [4.853439807891846, 5.605003356933594, 3.7],
            [4.9041900634765625, 2.4405975341796875, 3.72],
            [4.9758100509643555, 1.714202880859375, 4.47],
            [6.039720058441162, 9.647499084472656, 4.12],
            [6.162600040435791, 14.4884033203125, 3.8],
            [6.198999881744385, 14.208602905273438, 4.47],
            [6.0653300285339355, 20.13829803466797, 4.6],
            [5.906360149383545, 20.276100158691406, 4.41],
            [6.126190185546875, 14.768302917480469, 4.42]
        ]
    },

    {
        id: "UMi",
        name: "Ursa Minor",
        x: 4050,
        y: 2150,
        size: 300,
        rotation: -0.15,

        polarisIndex: 0,

        lines: [
            [0, 1, 2, 3, 4, 5, 6, 3]
        ],

        stars: [
            [2.5301899909973145, 89.26419830322266, 2.02],
            [17.53692054748535, 86.5864028930664, 4.36],
            [16.76613998413086, 82.03720092773438, 4.23],
            [15.734310150146484, 77.79440307617188, 4.32],
            [16.291749954223633, 75.75530242919922, 4.95],
            [15.345470428466797, 71.83390045166016, 3.03],
            [14.845080375671387, 74.15560150146484, 2.05]
        ]
    },

    {
        id: "Vul",
        name: "Vulpecula",
        x: 6500,
        y: 1950,
        size: 300,
        rotation: -0.15,

        lines: [
            [0, 1]
        ],

        stars: [
            [19.47842025756836, 24.665000915527344, 4.44],
            [19.891029357910156, 24.079696655273438, 4.58]
        ]
    },

    {
        id: "Car",
        name: "Carina",
        x: 2850,
        y: 1700,
        size: 340,
        rotation: 0.1,

        lines: [
            [0, 1, 2, 3, 4, 5, 6, 7],
            [4, 8],
            [3, 9, 10, 11, 8],
            [6, 12, 13, 14]
        ],

        stars: [
            [6.3991899490356445, -52.69560241699219, 0.72],
            [9.220000267028809, -69.71719360351562, 1.7],
            [10.2289400100708, -70.03810119628906, 3.3],
            [10.715940475463867, -64.39439392089844, 2.78],
            [10.533720016479492, -61.685302734375, 3.3],
            [10.284720420837402, -61.33219909667969, 3.4],
            [9.284830093383789, -59.275299072265625, 2.2],
            [8.821599960327148, -55.462005615234375, 1.95],
            [10.891559600830078, -58.853302001953125, 3.78],
            [11.109000205993652, -62.42390441894531, 4.61],
            [11.210029602050781, -60.3175048828125, 4.6],
            [11.143170356750488, -58.975006103515625, 3.9],
            [8.37522029876709, -59.50970458984375, 1.86],
            [7.946310043334961, -52.98219299316406, 3.5],
            [8.126799583435059, -48.28300476074219, 4.27]
        ]
    },

    {
        id: "Vel",
        name: "Vela",
        x: 2300,
        y: 1900,
        size: 320,
        rotation: -0.15,

        lines: [
            [0, 1, 2, 3, 4, 5, 6, 7, 8]
        ],

        stars: [
            [8.745059967041016, -54.70829772949219, 1.95],
            [8.158889770507812, -47.336700439453125, 1.8],
            [9.133279800415039, -43.4324951171875, 2.21],
            [9.511670112609863, -40.466705322265625, 3.6],
            [10.245610237121582, -42.12190246582031, 3.8],
            [10.779500007629395, -49.41999816894531, 2.69],
            [9.94771957397461, -54.56779479980469, 3.5],
            [9.368559837341309, -55.01080322265625, 2.5],
            [8.74468994140625, -54.70030212402344, 5.1]
        ]
    },

    {
        id: "Pup",
        name: "Puppis",
        x: 1950,
        y: 2400,
        size: 350,
        rotation: 0.1,

        lines: [
            [0, 1, 2, 3, 4, 5, 6, 7, 8],
            [5, 9, 10, 3]
        ],

        stars: [
            [8.144000053405762, -46.34800720214844, 4.27],
            [8.059749603271484, -40.0032958984375, 2.2],
            [8.125720024108887, -24.30419921875, 2.81],
            [7.821579933166504, -24.859703063964844, 3.35],
            [7.64709997177124, -26.802696228027344, 4.5],
            [7.589670181274414, -28.369400024414062, 4.64],
            [7.285719871520996, -37.097503662109375, 2.7],
            [6.629360198974609, -43.19610595703125, 3.2],
            [6.453700065612793, -50.76100158691406, 0.72],
            [7.730110168457031, -28.955001831054688, 3.96],
            [7.8014397621154785, -25.93720245361328, 4.5]
        ]
    }
];


// ============================================================
// SEEDED RANDOM
// ============================================================

function mulberry32(seed) {
    return function () {
        let t = seed += 0x6D2B79F5;

        t = Math.imul(
            t ^ (t >>> 15),
            t | 1
        );

        t ^=
            t +
            Math.imul(
                t ^ (t >>> 7),
                t | 61
            );

        return (
            (t ^ (t >>> 14)) >>> 0
        ) / 4294967296;
    };
}

const random = mulberry32(123456789);


// ============================================================
// CANVAS / CAMERA
// ============================================================

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;

    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );
    canvas.width =
        Math.round(width * dpr);

    canvas.height =
        Math.round(height * dpr);

    canvas.style.width =
        `${width}px`;

    canvas.style.height =
        `${height}px`;

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    cameraX =
        (WORLD_WIDTH - width) / 2;

    cameraY =
        (WORLD_HEIGHT - height) / 2;

    if (
        backgroundStars.length > 0
    ) {
        updateVisibleBackgroundStars();
    }
}

window.addEventListener(
    "resize",
    resizeCanvas
);


// ============================================================
// BACKGROUND STARS
// ============================================================

class BackgroundStar {
    constructor() {
        this.x =
            random() * WORLD_WIDTH;

        this.y =
            random() * WORLD_HEIGHT;

        this.twinkles =
            random() < 0.25;

        this.radius =
            random() * 1.15 + 0.25;

        this.baseOpacity =
            random() * 0.45 + 0.15;

        this.twinkleSpeed =
            random() * 0.0015 + 0.0003;

        this.twinkleOffset =
            random() * Math.PI * 2;
    }

    draw(time) {
        const x =
            this.x - cameraX;

        const y =
            this.y - cameraY;

        if (
            x < -10 ||
            x > width + 10 ||
            y < -10 ||
            y > height + 10
        ) {
            return;
        }

        let opacity =
            this.baseOpacity;


        if (
            this.twinkles
        ) {

            opacity +=
                Math.sin(
                    time *
                    this.twinkleSpeed +
                    this.twinkleOffset
                ) *
                0.12;
        }

        opacity =
            Math.max(
                0.05,
                opacity
            );

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            this.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            `rgba(220,230,245,${opacity})`;

        ctx.fill();
    }
}


function createBackgroundStars() {

    backgroundStars.length = 0;


    for (
        let i = 0;
        i < BACKGROUND_STAR_COUNT;
        i++
    ) {

        backgroundStars.push(
            new BackgroundStar()
        );
    }


    updateVisibleBackgroundStars();
}


function updateVisibleBackgroundStars() {

    visibleBackgroundStars.length = 0;


    const margin = 20;


    const left =
        cameraX - margin;

    const right =
        cameraX +
        width +
        margin;

    const top =
        cameraY - margin;

    const bottom =
        cameraY +
        height +
        margin;


    for (
        const star of
        backgroundStars
    ) {

        if (
            star.x >= left &&
            star.x <= right &&
            star.y >= top &&
            star.y <= bottom
        ) {

            visibleBackgroundStars.push(
                star
            );
        }
    }
}

// ============================================================
// CELESTIAL PROJECTION
// ============================================================

function hoursToRadians(hours) {
    return (
        hours *
        15 *
        Math.PI /
        180
    );
}


function degreesToRadians(degrees) {
    return (
        degrees *
        Math.PI /
        180
    );
}


function wrapRadians(angle) {
    while (
        angle > Math.PI
    ) {
        angle -=
            Math.PI * 2;
    }

    while (
        angle < -Math.PI
    ) {
        angle +=
            Math.PI * 2;
    }

    return angle;
}


function findSphericalCentre(stars) {
    let x = 0;
    let y = 0;
    let z = 0;

    for (
        const star of stars
    ) {
        const ra =
            hoursToRadians(
                star[0]
            );

        const dec =
            degreesToRadians(
                star[1]
            );

        const cosDec =
            Math.cos(dec);

        x +=
            cosDec *
            Math.cos(ra);

        y +=
            cosDec *
            Math.sin(ra);

        z +=
            Math.sin(dec);
    }

    const vectorLength =
        Math.sqrt(
            x * x +
            y * y +
            z * z
        );

    x /=
        vectorLength;

    y /=
        vectorLength;

    z /=
        vectorLength;

    return {
        ra:
            Math.atan2(
                y,
                x
            ),

        dec:
            Math.atan2(
                z,
                Math.sqrt(
                    x * x +
                    y * y
                )
            )
    };
}


function projectStar(
    star,
    centre
) {
    const ra =
        hoursToRadians(
            star[0]
        );

    const dec =
        degreesToRadians(
            star[1]
        );

    const deltaRa =
        wrapRadians(
            ra -
            centre.ra
        );

    const sinDec =
        Math.sin(dec);

    const cosDec =
        Math.cos(dec);

    const sinCentre =
        Math.sin(
            centre.dec
        );

    const cosCentre =
        Math.cos(
            centre.dec
        );

    const denominator =
        1 +
        sinCentre * sinDec +
        cosCentre *
        cosDec *
        Math.cos(deltaRa);

    const k =
        2 /
        Math.max(
            denominator,
            0.000001
        );

    return {
        x:
            k *
            cosDec *
            Math.sin(deltaRa),

        y:
            k *
            (
                cosCentre *
                sinDec -
                sinCentre *
                cosDec *
                Math.cos(deltaRa)
            )
    };
}


// ============================================================
// BUILD CONSTELLATIONS
// ============================================================

function buildConstellation(
    config
) {
    const centre =
        findSphericalCentre(
            config.stars
        );

    const projected =
        config.stars.map(
            star =>
                projectStar(
                    star,
                    centre
                )
        );

    let minimumX =
        Infinity;

    let maximumX =
        -Infinity;

    let minimumY =
        Infinity;

    let maximumY =
        -Infinity;

    for (
        const point of projected
    ) {
        minimumX =
            Math.min(
                minimumX,
                point.x
            );

        maximumX =
            Math.max(
                maximumX,
                point.x
            );

        minimumY =
            Math.min(
                minimumY,
                point.y
            );

        maximumY =
            Math.max(
                maximumY,
                point.y
            );
    }

    const localCentreX =
        (
            minimumX +
            maximumX
        ) / 2;

    const localCentreY =
        (
            minimumY +
            maximumY
        ) / 2;

    const spanX =
        maximumX -
        minimumX;

    const spanY =
        maximumY -
        minimumY;

    const largestSpan =
        Math.max(
            spanX,
            spanY,
            0.000001
        );

    const scale =
        config.size /
        largestSpan;

    const cosRotation =
        Math.cos(
            config.rotation
        );

    const sinRotation =
        Math.sin(
            config.rotation
        );

    const stars =
        projected.map(
            (
                point,
                index
            ) => {
                const localX =
                    (
                        point.x -
                        localCentreX
                    ) *
                    scale;

                const localY =
                    -(
                        point.y -
                        localCentreY
                    ) *
                    scale;

                const rotatedX =
                    localX *
                    cosRotation -
                    localY *
                    sinRotation;

                const rotatedY =
                    localX *
                    sinRotation +
                    localY *
                    cosRotation;

                return {
                    x:
                        config.x +
                        rotatedX,

                    y:
                        config.y +
                        rotatedY,

                    magnitude:
                        config.stars[index][2],

                    ra:
                        config.stars[index][0],

                    dec:
                        config.stars[index][1]
                };
            }
        );

    return {
        id:
            config.id,

        name:
            config.name,

        x:
            config.x,

        y:
            config.y,

        size:
            config.size,

        lines:
            config.lines,

        stars,

        polarisIndex:
            config.polarisIndex ??
            null,

        emphasis: 0
    };
}


function buildConstellationCatalogue() {
    renderedConstellations.length = 0;

    for (
        const config of
        constellationCatalogue
    ) {
        renderedConstellations.push(
            buildConstellation(
                config
            )
        );
    }
}


// ============================================================
// STAR BRIGHTNESS
// ============================================================

function magnitudeToRadius(
    magnitude
) {
    return Math.max(
        0.75,
        Math.min(
            2.6,
            2.55 -
            magnitude *
            0.30
        )
    );
}


function magnitudeToOpacity(
    magnitude
) {
    return Math.max(
        0.42,
        Math.min(
            1,
            1.10 -
            magnitude *
            0.10
        )
    );
}


// ============================================================
// DRAW CONSTELLATIONS
// ============================================================

function drawConstellation(
    constellation,
    time
) {
    const centreX =
        constellation.x -
        cameraX;

    const centreY =
        constellation.y -
        cameraY;

    const targetEmphasis =
        constellation.id === activeConstellationId
            ? 1
            : 0;

    constellation.emphasis +=
        (targetEmphasis - constellation.emphasis) * 0.04;

    const lineAlpha =
        CONSTELLATION_LINE_ALPHA *
        (1 + constellation.emphasis * 0.36);

    const starBoost =
        1 + constellation.emphasis * 0.12;

    const margin =
        constellation.size *
        1.7;

    if (
        centreX < -margin ||
        centreX > width + margin ||
        centreY < -margin ||
        centreY > height + margin
    ) {
        return;
    }


    // Lines
    for (
        const line of
        constellation.lines
    ) {
        if (
            line.length < 2
        ) {
            continue;
        }

        const first =
            constellation.stars[
                line[0]
            ];

        ctx.beginPath();

        ctx.moveTo(
            first.x -
            cameraX,

            first.y -
            cameraY
        );

        for (
            let i = 1;
            i < line.length;
            i++
        ) {
            const star =
                constellation.stars[
                    line[i]
                ];

            ctx.lineTo(
                star.x -
                cameraX,

                star.y -
                cameraY
            );
        }

        ctx.strokeStyle =
            `rgba(
                125,
                155,
                195,
                ${lineAlpha}
            )`;

        ctx.lineWidth =
            0.8;

        ctx.stroke();
    }


    // Stars
    for (
        let i = 0;
        i <
        constellation.stars.length;
        i++
    ) {
        const star =
            constellation.stars[i];

        const screenX =
            star.x -
            cameraX;

        const screenY =
            star.y -
            cameraY;

        if (
            constellation.polarisIndex ===
            i
        ) {
            drawPolaris(
                screenX,
                screenY,
                time
            );

            continue;
        }

        const pulse =
            0.94 +
            Math.sin(
                time *
                0.001 +
                i *
                1.7
            ) *
            0.06;

        const radius =
            magnitudeToRadius(
                star.magnitude
            );

        const opacity =
            Math.min(
                1,
                magnitudeToOpacity(
                    star.magnitude
                ) *
                pulse *
                CONSTELLATION_STAR_ALPHA *
                starBoost
            );

        ctx.beginPath();

        ctx.arc(
            screenX,
            screenY,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            `rgba(
                230,
                238,
                255,
                ${opacity}
            )`;

        ctx.fill();
    }
}


// ============================================================
// POLARIS
// ============================================================

function drawPolaris(
    x,
    y,
    time
) {
    const pulse =
        0.90 +
        Math.sin(
            time *
            0.0018
        ) *
        0.10;

    const halo =
        ctx.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            34
        );

    halo.addColorStop(
        0,
        `rgba(
            225,
            238,
            255,
            ${0.28 * pulse}
        )`
    );

    halo.addColorStop(
        1,
        "rgba(225,238,255,0)"
    );

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        34,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        halo;

    ctx.fill();


    // Bright centre
    ctx.beginPath();

    ctx.arc(
        x,
        y,
        3.3,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        `rgba(
            255,
            255,
            255,
            ${pulse}
        )`;

    ctx.fill();


    // Cross flare
    ctx.beginPath();

    ctx.moveTo(
        x - 16,
        y
    );

    ctx.lineTo(
        x + 16,
        y
    );

    ctx.moveTo(
        x,
        y - 16
    );

    ctx.lineTo(
        x,
        y + 16
    );

    ctx.strokeStyle =
        `rgba(
            225,
            238,
            255,
            ${0.25 * pulse}
        )`;

    ctx.lineWidth =
        1;

    ctx.stroke();
}


// ============================================================
// SHOOTING STARS
// ============================================================

class ShootingStar {
    constructor(
        delay = 0,
        showerAngle = null
    ) {
        this.x =
            cameraX +
            Math.random() *
            width *
            0.85;

        this.y =
            cameraY +
            Math.random() *
            height *
            0.35;

        const normalAngle =
            Math.PI /
            4 +
            (
                Math.random() -
                0.5
            ) *
            0.25;

        this.angle =
            (
                showerAngle ??
                normalAngle
            ) +
            (
                Math.random() -
                0.5
            ) *
            0.06;

        this.speed =
            Math.random() *
            4 +
            8;

        this.vx =
            Math.cos(
                this.angle
            ) *
            this.speed;

        this.vy =
            Math.sin(
                this.angle
            ) *
            this.speed;

        this.length =
            Math.random() *
            120 +
            100;

        this.life =
            1;

        this.delay =
            delay;
    }


    update() {
        if (
            this.delay > 0
        ) {
            this.delay--;

            return;
        }

        this.x +=
            this.vx;

        this.y +=
            this.vy;

        this.life -=
            0.012;
    }


    draw() {
        if (
            this.delay > 0
        ) {
            return;
        }

        const x =
            this.x -
            cameraX;

        const y =
            this.y -
            cameraY;

        const tailX =
            x -
            Math.cos(
                this.angle
            ) *
            this.length;

        const tailY =
            y -
            Math.sin(
                this.angle
            ) *
            this.length;

        const gradient =
            ctx.createLinearGradient(
                tailX,
                tailY,
                x,
                y
            );

        gradient.addColorStop(
            0,
            "rgba(255,255,255,0)"
        );

        gradient.addColorStop(
            1,
            `rgba(
                230,
                240,
                255,
                ${this.life}
            )`
        );

        ctx.beginPath();

        ctx.moveTo(
            tailX,
            tailY
        );

        ctx.lineTo(
            x,
            y
        );

        ctx.strokeStyle =
            gradient;

        ctx.lineWidth =
            1.5;

        ctx.stroke();


        // Meteor head
        ctx.beginPath();

        ctx.arc(
            x,
            y,
            1.8,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            `rgba(
                255,
                255,
                255,
                ${this.life}
            )`;

        ctx.fill();
    }


    isDead() {
        return (
            this.life <= 0
        );
    }
}


// ============================================================
// RANDOM METEOR EVENTS
// ============================================================

function createMeteorEvent() {
    if (!motionEnabled) {
        setTimeout(
            createMeteorEvent,
            8000
        );

        return;
    }

    const isShower =
        Math.random() <
        0.08;

    if (
        isShower
    ) {
        const amount =
            Math.floor(
                Math.random() *
                4
            ) +
            3;

        const showerAngle =
            Math.PI /
            4 +
            (
                Math.random() -
                0.5
            ) *
            0.20;

        for (
            let i = 0;
            i < amount;
            i++
        ) {
            shootingStars.push(
                new ShootingStar(
                    i * 12,
                    showerAngle
                )
            );
        }

    } else {
        shootingStars.push(
            new ShootingStar()
        );
    }

    const nextEvent =
        Math.random() *
        15000 +
        10000;

    setTimeout(
        createMeteorEvent,
        nextEvent
    );
}


// ============================================================
// ANIMATION
// ============================================================

function animate(time) {

    const elapsed =
        time - lastFrameTime;

    if (
        elapsed <
        FRAME_INTERVAL
    ) {
        requestAnimationFrame(
            animate
        );

        return;
    }


    lastFrameTime =
        time -
        (
            elapsed %
            FRAME_INTERVAL
        );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const drawTime =
        motionEnabled
            ? time
            : 0;


    // Background stars
    for (
        let i = 0;
        i < visibleBackgroundStars.length;
        i += skyDensityStep
    ) {
        visibleBackgroundStars[i].draw(drawTime);
    }


    // Constellations
    for (const constellation of renderedConstellations) {
        drawConstellation(constellation, drawTime);
    }


    // Shooting stars
    if (motionEnabled) {
        for (
            let i = shootingStars.length - 1;
            i >= 0;
            i--
        ) {
            shootingStars[i].update();
            shootingStars[i].draw();

            if (shootingStars[i].isDead()) {
                shootingStars.splice(i, 1);
            }
        }
    }


    requestAnimationFrame(
        animate
    );

    
}


// ============================================================
// SKY INTERACTION / PUBLIC CONTROLS
// ============================================================

function getSkyTargetAt(clientX, clientY) {
    let nearest = null;
    let nearestDistanceSquared = Infinity;

    for (const constellation of renderedConstellations) {
        const centreX = constellation.x - cameraX;
        const centreY = constellation.y - cameraY;
        const margin = constellation.size * 1.7;

        if (
            centreX < -margin ||
            centreX > width + margin ||
            centreY < -margin ||
            centreY > height + margin
        ) {
            continue;
        }

        for (let i = 0; i < constellation.stars.length; i++) {
            const star = constellation.stars[i];
            const isPolaris = constellation.polarisIndex === i;

            /*
                Labels are an easter egg, not a continuous UI layer.
                Only Polaris and unusually bright catalogue stars respond.
            */
            if (!isPolaris && star.magnitude > 2.25) {
                continue;
            }

            const screenX = star.x - cameraX;
            const screenY = star.y - cameraY;
            const dx = clientX - screenX;
            const dy = clientY - screenY;
            const distanceSquared = dx * dx + dy * dy;
            const hitRadius = isPolaris ? 20 : 11;

            if (
                distanceSquared <= hitRadius * hitRadius &&
                distanceSquared < nearestDistanceSquared
            ) {
                nearestDistanceSquared = distanceSquared;
                nearest = {
                    id: constellation.id,
                    name: constellation.name,
                    ra: star.ra,
                    dec: star.dec,
                    magnitude: star.magnitude,
                    isPolaris
                };
            }
        }
    }

    return nearest;
}


function clearSkyHover() {
    if (lastSkyHoverKey === null) {
        return;
    }

    lastSkyHoverKey = null;
    window.dispatchEvent(
        new CustomEvent("portfolio:skyhover", {
            detail: null
        })
    );
}


window.addEventListener(
    "pointermove",
    (event) => {
        if (
            event.target.closest?.(
                ".site-header, .project-card, .cv-entry, " +
                ".course-entry, .contact-links, .site-footer, " +
                "a, button, input, textarea"
            )
        ) {
            clearSkyHover();
            return;
        }

        const target = getSkyTargetAt(event.clientX, event.clientY);
        const key = target
            ? `${target.id}:${target.ra}:${target.dec}`
            : null;

        if (key === null) {
            clearSkyHover();
            return;
        }

        lastSkyHoverKey = key;
        window.dispatchEvent(
            new CustomEvent("portfolio:skyhover", {
                detail: {
                    ...target,
                    clientX: event.clientX,
                    clientY: event.clientY
                }
            })
        );
    },
    { passive: true }
);


window.addEventListener("pointerleave", clearSkyHover);


window.addEventListener("click", (event) => {
    if (
        event.target.closest?.(
            ".site-header, .project-card, .cv-entry, " +
            ".course-entry, .contact-links, .site-footer, " +
            "a, button, input, textarea, select, [role='dialog']"
        )
    ) {
        return;
    }

    const target = getSkyTargetAt(event.clientX, event.clientY);

    if (target?.isPolaris) {
        window.dispatchEvent(
            new CustomEvent("portfolio:polaris")
        );
    }
});


window.addEventListener("portfolio:sectionchange", (event) => {
    activeConstellationId =
        SECTION_CONSTELLATIONS[event.detail?.id] ||
        SECTION_CONSTELLATIONS.home;
});


window.portfolioSky = {
    toggleMotion() {
        motionEnabled = !motionEnabled;

        if (!motionEnabled) {
            shootingStars.length = 0;
        }

        return motionEnabled;
    },

    toggleDensity() {
        if (skyDensityMode === "FULL") {
            skyDensityMode = "REDUCED";
            skyDensityStep = 2;
        } else {
            skyDensityMode = "FULL";
            skyDensityStep = 1;
        }

        return skyDensityMode;
    },

    find(name) {
        const query = String(name || "").trim().toLowerCase();
        const constellation = constellationCatalogue.find(
            (item) =>
                item.id.toLowerCase() === query ||
                item.name.toLowerCase() === query
        );

        if (!constellation) {
            console.info(`No constellation found for "${name}".`);
            return null;
        }

        console.table({
            id: constellation.id,
            name: constellation.name,
            stars: constellation.stars.length,
            centreX: constellation.x,
            centreY: constellation.y
        });

        return constellation;
    }
};


console.info("Polaris is where it should be.");
console.info(
    `Sky catalogue loaded: ${constellationCatalogue.length} constellations / ` +
    `${BACKGROUND_STAR_COUNT} background stars.`
);


// ============================================================
// START
// ============================================================

resizeCanvas();

createBackgroundStars();

buildConstellationCatalogue();

setTimeout(
    createMeteorEvent,
    3000
);

requestAnimationFrame(
    animate
);
