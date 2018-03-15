var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.angle = 0;
        }
        
        setAngle(a) {
            this.angle = a;
        }
        
        x() {
            return this.x;
        }

        y() {
            return this.y;
        }
        
        getAngle() {
            return this.angle;
        }
    }

    var stompClient = null;
    var can = document.getElementById("canvas");

    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
        ctx.stroke();
        //console.log(Point);
        sendPoint(Point);
    };

    var sendPoint = function (pt) {
        //console.log(pt);
        stompClient.send("/app/newpoint." + $("#drawId"), {}, JSON.stringify({'x': parseInt($("#x").val()), 'y': parseInt($("#y").val())}));
        //stompClient.send("/topic/newpoint", {}, JSON.stringify({'x': pt.x,'y': pt.y}));
    };

    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        //subscribe to /topic/newpoint when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/newpoint.' + $("#drawId"), function (eventbody) {
                //alert(eventbody);
                console.log(eventbody);
                var point = JSON.parse(eventbody.body);
                console.log(point);
                var canvas = document.getElementById("canvas");
                var ctx = canvas.getContext("2d");
                ctx.beginPath();
                ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
                ctx.stroke();
                //var x = point.x;
                //var y = point.y;
            });
            stompClient.subscribe('/topic/newpolygon.' + $("#drawId"), function (eventbody) {
                console.log("Poligono:");
                console.log(eventbody);
                drawPolygon(eventbody.body);
            });
        });

    };

    var drawPolygon = function (points) {
        console.log("angulo:");
            console.log(points[0].angle);
        
        var canvas = document.getElementById('canvas');
        if (canvas.getContext) {
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = "red";
            console.log("Configuro el canvas.");

            // calculate max and min x and y
            var minX = points[0].x;
            var maxX = points[0].x;
            var minY = points[0].y;
            var maxY = points[0].y;            

            for (var i = 1; i < points.length; i++) {
                if (points[i].x < minX) minX = points[i].x;
                if (points[i].x > maxX) maxX = points[i].x;
                if (points[i].y < minY) minY = points[i].y;
                if (points[i].y > maxY) maxY = points[i].y;
            }
            console.log("Calculo el max y el min");

            // choose a "central" point
            var center = {
                x: minX + (maxX - minX) / 2,
                y: minY + (maxY - minY) / 2
            };
            console.log("Escogio el punto central");

            // precalculate the angles of each point to avoid multiple calculations on sort
            for (var i = 0; i < points.length; i++) {
                points[i].angle(Math.acos((points[i].x - center.x) / lineDistance(center, points[i])));

                if (points[i].y > center.y) {
                    points[i].angle(Math.PI + Math.PI - points[i].angle);
                }
            }
            console.log("Precalculo los angulos");
            
            console.log(points);
            
            // sort by angle
            points.sort(function(a, b) {return a.getAngle() - b.getAngle();});

            // Draw
            console.log("Comienza a dibujar");
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);

            for (var i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }

            ctx.lineTo(points[0].x, points[0].y);

            ctx.stroke();
            ctx.fill();
        }
    };
    
    var funcSort = function (pts) {
        pts.sort(function(a, b){return a.angle-b.angle});
        return pts;
    };

    var lineDistance = function (point1, point2) {
        var xs = 0;
        var ys = 0;

        xs = point2.x - point1.x;
        xs = xs * xs;

        ys = point2.y - point1.y;
        ys = ys * ys;

        return Math.sqrt(xs + ys);
    };

    return {

        /*init: function () {
         var can = document.getElementById("canvas");
         
         //websocket connection
         connectAndSubscribe();
         },*/

        connect: function () {
            connectAndSubscribe();
        },

        publishPoint: function (px, py) {
            var pt = new Point(px, py);
            console.info("publishing point at " + pt);
            addPointToCanvas(pt);

            //publicar el evento
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();