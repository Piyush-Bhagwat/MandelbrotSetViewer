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
        "centerX": -1.473507272,
        "centerY": 0.0000001203,
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
        "zoom": 2221100,
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
        "zoom": 766760,
        "centerX": -1.253671311885862,
        "centerY": -0.3826695337678726,
        "iteration": 400
    }
]

const localData = JSON.parse(localStorage.getItem('locations'));

if(localData){
    locations = localData;
}
