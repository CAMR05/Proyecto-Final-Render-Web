import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'

/**
 * CONFIGURACIÓN
 */
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
scene.background = new THREE.Color('#eeeeee') // Fondo claro para Cómics
scene.fog = new THREE.Fog('#eeeeee', 8, 25)

const detailPanel = document.getElementById('detail-panel')
// ... (mismas referencias UI que cassettes.js) ...
// Para ahorrar espacio aquí, asume que son las mismas const uiTitle, etc.
const uiTitle = document.getElementById('detail-title')
const uiDesc = document.getElementById('detail-desc')
const uiLabel1 = document.getElementById('label-1')
const uiStat1 = document.getElementById('stat-1')
const uiLabel2 = document.getElementById('label-2')
const uiStat2 = document.getElementById('stat-2')
const closeBtn = document.getElementById('close-detail')

let isViewingDetail = false 
let selectedIndex = null 

/**
 * 🦸‍♂️ DATOS DE COMICS
 */
const itemsList = [
    { 
        name: 'Amazing Fantasy #15', 
        path: '/models/comicbooks/comic/scene.gltf', 
        scale: 1, 
        rotationOffset: 0,
        bio: "El inicio de una leyenda. Peter Parker descubre que un gran poder conlleva una gran responsabilidad.",
        stats: { label1: 'Editorial', val1: 'Marvel', label2: 'Año', val2: '1963' }
    },
    { 
        name: 'Invincible', 
        path: '/models/comicbooks/comic_book_invincible_1/scene.gltf', 
        scale: 1, 
        rotationOffset: 0,
        bio: "Mark Grayson, hijo de un superhéroe alienígena, descubre sus propios poderes y enfrenta amenazas cósmicas.",
        stats: { label1: 'Editorial', val1: 'Image Comics', label2: 'Año', val2: '2003' }
    },
    {
        name: 'Akira Volume. 4',
        path: '/models/comicbooks/akira_vol._4_photogrammetry/scene.gltf',
        scale: 1,
        rotationOffset: 0,
        bio: "La distopía cyberpunk en su máxima expresión. Kaneda y Tetsuo enfrentan su destino en Neo-Tokio.",
        stats: { label1: 'Editorial', val1: 'Kodansha', label2: 'Año', val2: '1984' }
    },
    {
        name: 'Spawn',
        path: '/models/comicbooks/comic_book_spawn_1/scene.gltf',
        scale: 1,
        rotationOffset: 0,
        bio: "Al Simmons regresa del infierno como Spawn, enfrentando su nueva realidad y buscando venganza.",
        stats: { label1: 'Editorial', val1: 'Image Comics', label2: 'Año', val2: '1992' }
    },
    {
        name: 'Deadpool',
        path: '/models/comicbooks/deadpool/scene.gltf',
        scale: 1,
        rotationOffset: 0,
        bio: "El mercenario bocazas en su máxima expresión. Deadpool rompe la cuarta pared y redefine el anti-héroe.",
        stats: { label1: 'Editorial', val1: 'Marvel', label2: 'Año', val2: '1991' }
    },
    {
        name: 'Swamp Thing',
        path: '/models/comicbooks/swamp_thing_comic/scene.gltf',
        scale: 1,
        rotationOffset: 0,
        bio: "La criatura del pantano lucha por proteger la naturaleza y descubrir su propia humanidad.",
        stats: { label1: 'Editorial', val1: 'DC Comics', label2: 'Año', val2: '1971' }
    },
    {
        name: 'The Walking Dead #1',
        path: '/models/comicbooks/the_walking_dead_comic/scene.gltf',
        scale: 1, 
        rotationOffset: 0,
        bio: "El inicio de la saga apocalíptica. Rick Grimes despierta en un mundo dominado por los muertos vivientes.",
        stats: { label1: 'Editorial', val1: 'Image Comics', label2: 'Año', val2: '2003' }
    }

]

const gap = 3.5 // Menos distancia porque los comics son delgados

/**
 * CÁMARA & LUCES
 */
const sizes = { width: window.innerWidth, height: window.innerHeight }
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.5, 100)
camera.position.set(0, 0, 4) 
scene.add(camera)

// Luz más fuerte y blanca para resaltar el papel/color
const ambientLight = new THREE.AmbientLight(0xffffff, 2.5) 
scene.add(ambientLight)
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
dirLight.position.set(2, 5, 5)
scene.add(dirLight)

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

window.addEventListener('resize', () => { /* ... código resize standard ... */ })

/**
 * LOADERS
 */
const loadingManager = new THREE.LoadingManager()
const gltfLoader = new GLTFLoader(loadingManager)
// No necesitamos envMap tan fuerte en comics (son papel), 
// pero ayuda si la portada es "glossy" (brillante).

/**
 * CONSTRUCCIÓN
 */
const galleryGroup = new THREE.Group()
scene.add(galleryGroup)
const loadedItems = [] 

itemsList.forEach((data, index) => {
    gltfLoader.load(data.path, (gltf) => {
        const model = gltf.scene
        
        model.userData = { id: index, ...data }
        model.scale.set(data.scale, data.scale, data.scale)

        const baseX = index * gap
        const xFix = data.offset ? data.offset.x : 0
        
        model.position.set(baseX + xFix, -0.5, 0)
        
        // Rotación inicial: De frente (0) o ligeramente rotado
        model.rotation.y = 0 + (data.rotationOffset || 0)

        galleryGroup.add(model)
        loadedItems.push(model)
    })
})

/**
 * INTERACCIÓN (SCROLL & CLICK) - Idéntico a cassettes.js
 */
// ... (Copia y pega la lógica de Scroll/Touch/Click de cassettes.js aquí) ...
// ... Es exactamente igual, solo cambia el nombre de las variables si quieres ...

// La única diferencia es openDetail, ajustando la cámara Z
function openDetail(item) {
    // ... (lógica UI igual) ...
    isViewingDetail = true
    selectedIndex = item.userData.id
    
    uiTitle.innerText = item.userData.name
    uiDesc.innerText = item.userData.bio
    uiLabel1.innerText = item.userData.stats.label1 + ":"
    uiStat1.innerText = item.userData.stats.val1
    uiLabel2.innerText = item.userData.stats.label2 + ":"
    uiStat2.innerText = item.userData.stats.val2

    detailPanel.style.display = 'block'
    detailPanel.scrollTop = 0; 
    setTimeout(() => {
        detailPanel.style.opacity = '1'
        detailPanel.style.pointerEvents = 'all'
    }, 10)

    // Acercamos más la cámara porque los comics son planos
    const isMobile = window.innerWidth < 768
    const targetZ = isMobile ? 3 : 2 
    const targetX = item.position.x + (isMobile ? 0 : 1.2)

    gsap.to(camera.position, { duration: 1.5, x: targetX, y: 0, z: targetZ, ease: 'power2.inOut' })
}

// CloseBtn logic igual...

/**
 * LOOP
 */
const tick = () => {
    const time = Date.now() * 0.001;

    if (!isViewingDetail) {
        currentScroll += (scrollX - currentScroll) * 0.05
        camera.position.x = currentScroll
        
        const velocity = scrollX - currentScroll

        loadedItems.forEach((item) => {
            // ANIMACIÓN COMIC:
            // 1. Inclinación leve al moverse (como pasando hojas)
            item.rotation.z = -velocity * 0.2 
            
            // 2. Rotación leve constante en Y
            item.rotation.y = Math.sin(time * 0.5) * 0.1
        })
    } else {
        if (selectedIndex !== null) {
            const item = loadedItems.find(c => c.userData.id === selectedIndex);
            // En detalle: el comic flota de frente
            if (item) {
                item.rotation.z = 0
                item.rotation.y = Math.sin(time) * 0.05 // Vaivén muy suave
            }
        }
    }
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}
tick()

// BackBtn logic...

const backBtn = document.getElementById('back-btn')
if(backBtn) backBtn.addEventListener('click', () => window.location.href = 'index.html')