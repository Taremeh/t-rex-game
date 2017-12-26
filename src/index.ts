var canvas = document.getElementById("canvas") as HTMLCanvasElement;
var ctx: CanvasRenderingContext2D = canvas.getContext("2d");

var image: HTMLImageElement = new Image();
image.src = './asset/t-rex.png';
image.onload = () => {
    start()
}

function start() {
    window.requestAnimationFrame(draw);
}


function cleanCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function draw() {
    cleanCanvas();

    var width = image.naturalWidth;
    var height = image.naturalHeight;
    var x = 0;
    var y = 0;
    ctx.drawImage(image, x, y, width, height);

    var time = Date.now()
    if (time % 3000 < 200) {
        ctx.fillStyle = "#535353";
        ctx.fillRect(x + 33, y + 30, 3, 3)
    }
    window.requestAnimationFrame(draw);
}
