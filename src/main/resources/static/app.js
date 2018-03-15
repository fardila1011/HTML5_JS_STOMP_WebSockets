var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.angle = 0;
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
                drawPolygon(JSON.parse(eventbody.body));
            });
        });

    };

    var drawPolygon = function (points) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        
        ctx.fillStyle = '#f00';
        ctx.beginPath();
       
        for(var i = 0; i < points.length; i++){
            if(i===0){
                 ctx.moveTo(points[i].x,points[i].y);
            }
            ctx.lineTo(points[i].x,points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
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