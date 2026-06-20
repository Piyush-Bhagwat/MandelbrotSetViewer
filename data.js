let locations = [
    {
        "name": "Julia Set",
        "zoom": 4442702,
        "centerX": -1.768778833,
        "centerY": 0.001738996,
        "iteration": 800
    },
    {
        "name": "Flower",
        "zoom": 4442702000,
        "centerX": -1.99998588115817,
        "centerY": 0,
        "iteration": 300
    },
    {
        "name": "Mushroom",
        "zoom": 44427,
        "centerX": -1.4735058485163814,
        "centerY": -0.000011089633495735021,
        "iteration": 500
    },
    {
        "name": "Circles",
        "zoom": 24842255549103,
        "centerX": 0.25068140828187774,
        "centerY": 0.000028508468671150478,
        "iteration": 1200
    },
    {
        "name": "Leaves",
        "zoom": 8088820,
        "centerX": -0.10932942795,
        "centerY": 0.89496210031,
        "iteration": 1400
    },
    {
        "name": "Tendrils",
        "zoom": 2221100,
        "centerX": -0.226266546,
        "centerY": -1.116174386,
        "iteration": 500
    },
    {
        "name": "Tree",
        "zoom": 956110,
        "centerX": -1.940157343,
        "centerY": -0.0000008,
        "iteration": 240
    },
    {
        "name": "Elephant",
        "zoom": 500,
        "centerX": 0.282,
        "centerY": 0.01,
        "iteration": 600
    },
    {
        "name": "Blackhole",
        "zoom": 45000,
        "centerX": 0.25603102316772636,
        "centerY": -0.0007546292037262689,
        "iteration": 750
    },
    {
        "name": "Iris",
        "zoom": 12353467,
        "centerX": 0.250414246919196,
        "centerY": 0.0000134864436812731,
        "iteration": 1850
    },
    {
        "name": "KingBrot",
        "zoom": 246667851,
        "centerX": 0.2542099079452338,
        "centerY": -0.0004374588482306643,
        "iteration": 1050
    },
    {
        "name": "Wormhole",
        "zoom": 856511,
        "centerX": -0.6191860398954405,
        "centerY": 0.4047770628486949,
        "iteration": 1050
    },
    {
        "name": "Sun",
        "zoom": 44427,
        "centerX": -0.776592847,
        "centerY": 0.136640848,
        "iteration": 500
    },
    {
        "name": "Lighting",
        "zoom": 621075,
        "centerX": -1.253671586813726,
        "centerY": -0.3826700355112246,
        "iteration": 400
    },
    {
        name: "Seahorse Valley",
        zoom: 850,
        centerX: -0.7453,
        centerY: 0.1127,
        iteration: 500
    },
    {
        name: "Triple Spiral",
        zoom: 2200,
        centerX: -0.08837174,
        centerY: 0.65448880,
        iteration: 600
    }, {
        name: "Needle",
        zoom: 3500,
        centerX: -1.25066,
        centerY: 0.02012,
        iteration: 700
    }, {
        name: "Galaxy",
        zoom: 180000,
        centerX: -0.745428,
        centerY: 0.113009,
        iteration: 1000
    }, {
        name: "Dragon",
        zoom: 950000,
        centerX: -0.743643887037151,
        centerY: 0.13182590420533,
        iteration: 1200
    }, {
        name: "Cathedral",
        zoom: 2500000,
        centerX: -0.745433648,
        centerY: 0.113008441,
        iteration: 1400
    }, {
        name: "Neuron",
        zoom: 4800000,
        centerX: -0.101096363845,
        centerY: 0.956286510809,
        iteration: 1500
    }, {
        name: "Eye",
        zoom: 125000,
        centerX: -0.748,
        centerY: 0.1,
        iteration: 900
    }, {
        name: "Phoenix",
        zoom: 750000,
        centerX: -1.769383179,
        centerY: 0.004236847,
        iteration: 1000
    }, {
        name: "Infinity",
        zoom: 550000,
        centerX: 0.00164288,
        centerY: -0.82246652,
        iteration: 900
    }, 
    {
        name: "Orbit Playground",
        zoom: 1200,
        centerX: -0.74529,
        centerY: 0.11274,
        iteration: 700
    },
    {
        name: "Inside",
        zoom: 1200000,
        centerX: -1.74974771609071,
        centerY:  0.00005828594911,
        iteration: 700
    },
    {
        name: "Inside2",
        zoom: 120000000,
        centerX: -0.10715079727776 ,
        centerY:  -0.91210278793461,
        iteration: 700
    },
    {
        name: "Golden Tendril",
        zoom: 120000,
        centerX: -0.80026,
        centerY:  -0.15574,
        iteration: 1700

    },
    {
        name: "Needle Coast",
        zoom: 140000000,
        centerX: -1.77066592, 
        centerY:  0.01633265,
        iteration: 1700
    }
]

const localData = JSON.parse(localStorage.getItem('locations'));

if (localData) {

    const map = new Map();

    [...locations, ...localData].forEach(loc => {
        map.set(loc.name, loc);
    });

    locations = [...map.values()];
}
