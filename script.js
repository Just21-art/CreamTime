var scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 10); camera.rotation.order = 'YXZ';

var renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight); document.body.appendChild(renderer.domElement);

// Свет
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
var sun = new THREE.DirectionalLight(0xffffff, 1); sun.position.set(10,20,10); scene.add(sun);
var light1 = new THREE.PointLight(0xffaa00, 1.5, 30); light1.position.set(0, 4, -20); scene.add(light1);
var light2 = new THREE.PointLight(0xff0000, 2, 30); light2.position.set(0, 4, -60); scene.add(light2); 

// Улица
var grass = new THREE.Mesh(new THREE.PlaneGeometry(100,100), new THREE.MeshStandardMaterial({color:0x4CAF50}));
grass.rotation.x = -Math.PI/2; grass.position.y = -0.1; scene.add(grass);
var road = new THREE.Mesh(new THREE.PlaneGeometry(6,100), new THREE.MeshStandardMaterial({color:0x555555}));
road.rotation.x = -Math.PI/2; scene.add(road);
var factory = new THREE.Mesh(new THREE.BoxGeometry(12,8,10), new THREE.MeshStandardMaterial({color:0x8B4513}));
factory.position.set(0,4,-5); scene.add(factory);

// Коридор
var wallMat = new THREE.MeshStandardMaterial({color:0x555555});
var floorMat = new THREE.MeshStandardMaterial({color:0x2a2a2a});
var floor1 = new THREE.Mesh(new THREE.PlaneGeometry(10,40), floorMat); floor1.rotation.x = -Math.PI/2; floor1.position.z = -20; scene.add(floor1);
var lWall1 = new THREE.Mesh(new THREE.PlaneGeometry(40,5), wallMat); lWall1.rotation.y = Math.PI/2; lWall1.position.set(-5,2.5,-20); scene.add(lWall1);
var rWall1 = new THREE.Mesh(new THREE.PlaneGeometry(40,5), wallMat); rWall1.rotation.y = -Math.PI/2; rWall1.position.set(5,2.5,-20); scene.add(rWall1);
var ceil1 = new THREE.Mesh(new THREE.PlaneGeometry(10,40), wallMat); ceil1.rotation.x = Math.PI/2; ceil1.position.y = 5; ceil1.position.z = -20; scene.add(ceil1);

// Дверь в конце коридора
var endDoor = new THREE.Mesh(new THREE.BoxGeometry(2,4,0.2), new THREE.MeshStandardMaterial({color:0x111111}));
endDoor.position.set(0,2,-39.8); scene.add(endDoor);

// Вторая комната (обрыв)
var floor2a = new THREE.Mesh(new THREE.PlaneGeometry(10,10), floorMat); floor2a.rotation.x = -Math.PI/2; floor2a.position.set(0, 0, -50); scene.add(floor2a);
var floor2b = new THREE.Mesh(new THREE.PlaneGeometry(10,10), floorMat); floor2b.rotation.x = -Math.PI/2; floor2b.position.set(0, 0, -70); scene.add(floor2b);
var bridge = new THREE.Mesh(new THREE.PlaneGeometry(3,10), new THREE.MeshStandardMaterial({color:0x8B4513}));
bridge.rotation.x = -Math.PI/2; bridge.position.set(0, 0.1, -60); scene.add(bridge);

// Выход (зеленая дверь)
var exitDoor = new THREE.Mesh(new THREE.BoxGeometry(2,4,0.2), new THREE.MeshStandardMaterial({color:0x00ff00}));
exitDoor.position.set(0,2,-79.8); scene.add(exitDoor);

// Монстр (снеговик)
var monster = new THREE.Group();
var mBody = new THREE.Mesh(new THREE.BoxGeometry(1,2,1), new THREE.MeshStandardMaterial({color:0xeeeeee})); mBody.position.y=1; monster.add(mBody);
var mHead = new THREE.Mesh(new THREE.BoxGeometry(1.2,1,1.2), new THREE.MeshStandardMaterial({color:0xff9999})); mHead.position.y=2.5; monster.add(mHead);
var eyeMat = new THREE.MeshStandardMaterial({color:0});
var e1 = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.1), eyeMat); e1.position.set(-0.3,2.6,0.61); monster.add(e1);
var e2 = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.1), eyeMat); e2.position.set(0.3,2.6,0.61); monster.add(e2);
monster.position.set(-4,0,-2); monster.visible=false; scene.add(monster);

// Переменные
var moveF=false, moveB=false, moveL=false, moveR=false, isRun=false;
var speed=3, runSpeed=6, inside=false, won=false, cameraSens=0.005;
var inRoom2 = false;

// Логика запуска
document.getElementById('startBtn').onclick = function() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('task').style.display = 'block';
    document.getElementById('pauseBtn').style.display = 'block';
    animate();
};

// Пауза
var paused = false;
document.getElementById('pauseBtn').onclick = function() {
    paused = true;
    alert("Игра на паузе. Нажмите ОК, чтобы продолжить.");
    paused = false;
};

// Управление
document.querySelectorAll('.jbtn').forEach(function(b){
    var d = b.getAttribute('data-dir');
    b.addEventListener('touchstart', function(e){ e.preventDefault();
        if(d==='up')moveF=true; if(d==='down')moveB=true; if(d==='left')moveL=true; if(d==='right')moveR=true;
    }, {passive:false});
    b.addEventListener('touchend', function(e){ e.preventDefault();
        if(d==='up')moveF=false; if(d==='down')moveB=false; if(d==='left')moveL=false; if(d==='right')moveR=false;
    }, {passive:false});
});

var rBtn = document.getElementById('runBtn');
rBtn.addEventListener('touchstart', function(e){ e.preventDefault(); isRun=true; }, {passive:false});
rBtn.addEventListener('touchend', function(e){ e.preventDefault(); isRun=false; }, {passive:false});

var look = document.getElementById('look');
var lx=0, ly=0;
look.addEventListener('touchstart', function(e){ lx=e.touches[0].clientX; ly=e.touches[0].clientY; }, {passive:false});
look.addEventListener('touchmove', function(e){
    e.preventDefault();
    camera.rotation.y -= (e.touches[0].clientX - lx) * cameraSens;
    camera.rotation.x -= (e.touches[0].clientY - ly) * cameraSens;
    camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    lx = e.touches[0].clientX; ly = e.touches[0].clientY;
}, {passive:false});

// Анимация
var clock = new THREE.Clock();
function animate() {
    if(won) return;
    requestAnimationFrame(animate);
    
    var delta = clock.getDelta();
    var sp = isRun ? runSpeed : speed;
    var dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    var right = new THREE.Vector3(); right.crossVectors(camera.up, dir).normalize();

    var oldX = camera.position.x;
    var oldZ = camera.position.z;

    if(moveF){ camera.position.x+=dir.x*sp*delta; camera.position.z+=dir.z*sp*delta; }
    if(moveB){ camera.position.x-=dir.x*sp*delta; camera.position.z-=dir.z*sp*delta; }
    if(moveL){ camera.position.x-=right.x*sp*delta; camera.position.z-=right.z*sp*delta; }
    if(moveR){ camera.position.x+=right.x*sp*delta; camera.position.z+=right.z*sp*delta; }

    // Ограничения стен
    if(camera.position.x > 4.5 || camera.position.x < -4.5) camera.position.x = oldX;
    if(camera.position.z > 15 || camera.position.z < -79) camera.position.z = oldZ;

    // Падение в обрыв
    if(camera.position.z < -55 && camera.position.z > -65) {
        if (camera.position.x < -1.5 || camera.position.x > 1.5) {
            alert("Вы упали в обрыв!");
            location.reload();
        }
    }

    // Финиш
    if(camera.position.z < -78) {
        won = true;
        document.getElementById('win').style.display='flex';
    }

    renderer.render(scene, camera);
        }
