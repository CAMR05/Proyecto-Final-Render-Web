import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'

/**
 * 1. CONFIGURACIÓN DE ESCENA
 */
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
scene.background = new THREE.Color('#1a1a1a')
scene.fog = new THREE.Fog('#1a1a1a', 10, 30)

// Referencias HTML
const detailPanel = document.getElementById('car-detail-panel')
const closeBtn = document.getElementById('close-detail')
const uiName = document.getElementById('detail-name')
const uiDesc = document.getElementById('detail-desc')
const uiSpeed = document.getElementById('detail-speed')
const uiHandling = document.getElementById('detail-handling')

let isViewingDetail = false
let selectedCarIndex = null

/**
 * 2. DATOS DE LOS COCHES
 */
const carsList = [
    {
        name: 'Lightining McQueen',
        path: '/models/cars/radiator_springs_lightning_mcqueen/scene.gltf',
        scale: 0.5,
        rotationOffset: 0,
        bio: "El campeón de la Copa Pistón. Famoso por su velocidad y su lema 'Kachow!'.",
        stats: { speed: '10/10', handling: '8/10' }
    },
    {
        name: 'Mate (Mater)',
        path: '/models/cars/mater/scene.gltf',
        scale: 0.5,
        rotationOffset: Math.PI,
        bio: "El mejor conductor en reversa del mundo. Oxidado por fuera, pero con un corazón de oro.",
        stats: { speed: '5/10', handling: '10/10' }
    },
    {
        name: 'Sally Carrera',
        path: '/models/cars/sally_carrera/scene.gltf',
        scale: 0.5,
        rotationOffset: 0,
        bio: "Abogada de Radiador Springs. Se enamoró del encanto del pueblo.",
        stats: { speed: '8/10', handling: '9/10' }
    },
    {
        name: 'Dinoco McQueen',
        path: '/models/cars/dinoco_lightning_mcqueen/scene.gltf',
        scale: 0.5,
        rotationOffset: 0,
        bio: "La versión soñada de McQueen pintado con el azul del patrocinador Dinoco.",
        stats: { speed: '10/10', handling: '8/10' }
    },
    {
        name: 'Francesco Bernoulli',
        path: '/models/cars/francesco_bernoulli/scene.gltf',
        scale: 0.5,
        rotationOffset: -Math.PI / 2,
        bio: "El rival italiano de Fórmula. Es rápido y arrogante.",
        stats: { speed: '10/10', handling: '10/10' }
    },
    {
        name: 'Carla Veloso',
        path: '/models/cars/carla_veloso/scene.gltf',
        scale: 0.5,
        rotationOffset: 0,
        bio: "Competidora de Brasil. Su diseño aerodinámico la hace letal.",
        stats: { speed: '9/10', handling: '7/10' }
    },
    {
        name: 'Cruz Ramirez',
        path: '/models/cars/cruz_ramirez/scene.gltf',
        scale: 0.5,
        rotationOffset: 0,
        bio: "Entrenadora experta en tecnología con alma de corredora.",
        stats: { speed: '9/10', handling: '9/10' }
    },
    {
        name: 'Holley Shiftwell',
        path: '/models/cars/holley_shiftwell/scene.gltf',
        scale: 0.5,
        rotationOffset: 0,
        bio: "Espía británica equipada con la última tecnología.",
        stats: { speed: '8/10', handling: '10/10' }
    },
]

const carGap = 6

/**
 * 3. CÁMARA & LUCES
 */
const sizes = { width: window.innerWidth, height: window.innerHeight }
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.5, 100)
camera.position.set(0, 1.5, 5)
scene.add(camera)

const ambientLight = new THREE.AmbientLight(0xffffff, 2.0)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 3.0)
dirLight.position.set(5, 10, 7)
scene.add(dirLight)

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
})

/**
 * 4. LOADERS
 */
const loadingManager = new THREE.LoadingManager()
const gltfLoader = new GLTFLoader(loadingManager)
const cubeTexloader = new THREE.CubeTextureLoader(loadingManager)

// CUBEMAP: Asegúrate que esta carpeta existe tal cual en 'public'
const envMap = cubeTexloader.load(
    [
        '/Cars-Cube-Map/px.png', '/Cars-Cube-Map/nx.png',
        '/Cars-Cube-Map/py.png', '/Cars-Cube-Map/ny.png',
        '/Cars-Cube-Map/pz.png', '/Cars-Cube-Map/nz.png'
    ],
    () => {
        scene.environment = envMap;
        scene.background = envMap;
    },
    undefined,
    (err) => console.warn("⚠️ Error cargando Cubemap. Verifica la ruta /Cars-Cube-Map/")
)

/**
 * 5. CONSTRUCCIÓN DE LA FILA
 */
const galleryGroup = new THREE.Group()
scene.add(galleryGroup)
const loadedCars = [] 

carsList.forEach((carData, index) => {
    if (!carData.path) return;

    gltfLoader.load(carData.path, (gltf) => {
        const model = gltf.scene

        // Calculamos la rotación base Y
        const rotY = (Math.PI / 2) + (carData.rotationOffset || 0)

        model.userData = {
            id: index,
            name: carData.name,
            bio: carData.bio,
            stats: carData.stats,
            baseRotation: { x: 0, y: rotY, z: 0 } 
        }

        model.scale.set(carData.scale, carData.scale, carData.scale)
        model.traverse((child) => {
            if (child.isMesh) {
                child.material.envMap = envMap
                child.material.envMapIntensity = 1.5
            }
        })

        const baseX = index * carGap
        const xFix = carData.offset ? carData.offset.x : 0
        const yFix = carData.offset ? carData.offset.y : 0
        const zFix = carData.offset ? carData.offset.z : 0

        model.position.set(baseX + xFix, -1 + yFix, 0 + zFix)
        
        // Aplicamos rotación inicial
        model.rotation.set(0, rotY, 0)

        galleryGroup.add(model)
        loadedCars.push(model) 
    }, undefined, (error) => {
        console.error(`❌ Error al cargar modelo: ${carData.name}`, error);
    })
})

/**
 * 6. INTERACCIÓN
 */
let scrollX = 0
let currentScroll = 0
const maxScroll = (carsList.length - 1) * carGap

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// --- SCROLL (DESKTOP) ---
window.addEventListener('wheel', (e) => {
    if (isViewingDetail) return;
    e.preventDefault();
    scrollX += e.deltaY * 0.005
    scrollX = Math.min(Math.max(scrollX, -2), maxScroll + 2)
}, { passive: false })

// --- TOUCH (MOBILE) ---
let touchStartX = 0
let isDragging = false

window.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX
    if (!isViewingDetail) isDragging = true;
    mouse.x = (e.touches[0].clientX / sizes.width) * 2 - 1
    mouse.y = -(e.touches[0].clientY / sizes.height) * 2 + 1
}, { passive: false })

window.addEventListener('touchmove', (e) => {
    if (isViewingDetail) return;
    e.preventDefault();
    if (!isDragging) return
    const deltaX = e.touches[0].clientX - touchStartX
    scrollX -= deltaX * 0.02
    scrollX = Math.min(Math.max(scrollX, -2), maxScroll + 2)
    touchStartX = e.touches[0].clientX
}, { passive: false })

window.addEventListener('touchend', () => { isDragging = false })

// --- COORDENADAS MOUSE (OPTIMIZADO) ---
window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / sizes.width) * 2 - 1
    mouse.y = -(e.clientY / sizes.height) * 2 + 1
})

// --- CLICK ---
window.addEventListener('click', () => {
    if (isViewingDetail) return

    raycaster.setFromCamera(mouse, camera)
    // ARREGLO: Usamos loadedCars aquí también
    const intersects = raycaster.intersectObjects(galleryGroup.children, true)

    if (intersects.length > 0) {
        const objectHit = intersects[0].object
        const carFound = loadedCars.find(carRoot => {
            let belongs = false;
            carRoot.traverse((child) => { if (child === objectHit) belongs = true; });
            return belongs;
        });

        if (carFound) openDetailView(carFound);
    }
})

// --- FUNCIONES DE UI ---
function openDetailView(carObject) {
    if (!carObject.position) return;
    if (!detailPanel) return;

    isViewingDetail = true
    selectedCarIndex = carObject.userData.id

    if (uiName) uiName.innerText = carObject.userData.name || ""
    if (uiDesc) uiDesc.innerText = carObject.userData.bio || ""
    if (uiSpeed && carObject.userData.stats) uiSpeed.innerText = carObject.userData.stats.speed
    if (uiHandling && carObject.userData.stats) uiHandling.innerText = carObject.userData.stats.handling

    detailPanel.style.display = 'block'
    detailPanel.scrollTop = 0;

    setTimeout(() => {
        detailPanel.style.opacity = '1'
        detailPanel.style.pointerEvents = 'all'
    }, 10)

    const isMobile = window.innerWidth < 768
    const targetZ = isMobile ? 4 : 3
    const targetXOffset = isMobile ? 0 : 1.5
    const targetX = carObject.position.x + targetXOffset

    gsap.to(camera.position, { duration: 1.5, x: targetX, y: 1, z: targetZ, ease: 'power2.inOut' })
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        isViewingDetail = false
        selectedCarIndex = null

        if (detailPanel) {
            detailPanel.style.opacity = '0'
            detailPanel.style.pointerEvents = 'none'
            setTimeout(() => {
                if (!isViewingDetail) detailPanel.style.display = 'none'
            }, 500)
        }

        gsap.to(camera.position, { duration: 1.0, x: currentScroll, y: 1.5, z: 5, ease: 'power2.inOut' })
    })
}

/**
 * 7. LOOP DE ANIMACIÓN
 */
const tick = () => {
    const time = Date.now() * 0.001;

    if (!isViewingDetail) {
        currentScroll += (scrollX - currentScroll) * 0.05
        camera.position.x = currentScroll
        
        loadedCars.forEach((item) => {
             // Recuperamos rotación base
             const baseRotY = item.userData.baseRotation ? item.userData.baseRotation.y : 0
             

             item.rotation.y = baseRotY + Math.sin(time * 0.5) * 0.1
        })
    } else {
        if (selectedCarIndex !== null) {
            const item = loadedCars.find(c => c.userData.id === selectedCarIndex);
            if (item && item.userData.baseRotation) {
                // Rotación suave en detalle
                item.rotation.y = item.userData.baseRotation.y + Math.sin(time) * 0.05 
            }
        }
    }

    // --- RAYCASTER OPTIMIZADO ---
    if (!isViewingDetail) {
        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(loadedCars, true)

        if (intersects.length > 0) {
            document.body.style.cursor = 'pointer'
        } else {
            document.body.style.cursor = 'default'
        }
    } else {
        document.body.style.cursor = 'default'
    }

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}
tick()

// BOTÓN VOLVER
const backBtn = document.getElementById('back-btn')
if (backBtn) {
    backBtn.addEventListener('click', () => window.location.href = 'index.html')
}