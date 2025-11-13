import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
console.log(GLTFLoader);

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#444444',
        metalness: 0,
        roughness: 0.5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(2, 2, 2)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.75, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))




const manager = new THREE.LoadingManager();

manager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log(`Iniciando carga de: ${url} (${itemsLoaded + 1}/${itemsTotal})`);
};

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    console.log(`Cargando: ${url} (${itemsLoaded}/${itemsTotal})`);
};

manager.onLoad = function () {
    console.log('✅ ¡Todas las texturas cargadas!');
    gltfLoader.load('/models/radiator_springs_lightning_mcqueen/scene.gltf',

        function (gltf) {
            console.log(gltf);
            //gltf.scene.scale.set(0.025, 0.025, 0.025);
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.material.envMap = envMap;
                    child.material.envMapIntensity = 15.0;
                    child.material.needsUpdate = true;
                }
            });
            scene.add(gltf.scene);


        }
    );
};

manager.onError = function (url) {
    console.error(`❌ Error al cargar: ${url}`);
};



let mixer = null;
const gltfLoader = new GLTFLoader();
const cubeTexloader = new THREE.CubeTextureLoader(manager);

const envMap = cubeTexloader.load([
    '/SaintPetersBasilica/negx.jpg',
    '/SaintPetersBasilica/posx.jpg',
    '/SaintPetersBasilica/negy.jpg',
    '/SaintPetersBasilica/posy.jpg',
    '/SaintPetersBasilica/negz.jpg',
    '/SaintPetersBasilica/posz.jpg',

]);
scene.background = envMap;






/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Model animation
    if (mixer) {
        mixer.update(deltaTime)
    }


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()